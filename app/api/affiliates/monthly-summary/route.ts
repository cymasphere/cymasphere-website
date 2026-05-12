/**
 * @fileoverview Monthly earnings-summary cron for affiliates.
 *
 * Runs once a month (first of the month, 9am UTC). For every active
 * affiliate it computes the previous calendar month's stats and emails
 * the affiliate a short report card with a link back to the dashboard.
 *
 * @module api/affiliates/monthly-summary
 */

import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { sendEmail } from "@/utils/email";
import { generateAffiliateMonthlySummaryEmail } from "@/utils/email-campaigns/affiliate-emails";

function authorizeCron(request: NextRequest): NextResponse | null {
  if (request.headers.get("x-vercel-cron-signature")) return null;
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return null;
  if (!cronSecret) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

interface AffiliateRow {
  id: string;
  code: string;
  user_id: string;
}

interface ProfileRow {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

/**
 * @brief Compute the prior calendar month [startUtc, endUtc).
 */
function priorMonthBounds(): {
  startIso: string;
  endIso: string;
  label: string;
} {
  const now = new Date();
  const start = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1, 0, 0, 0, 0),
  );
  const end = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0),
  );
  const label = start.toLocaleString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { startIso: start.toISOString(), endIso: end.toISOString(), label };
}

async function runForOne(
  affiliate: AffiliateRow,
  profile: ProfileRow | null,
  bounds: { startIso: string; endIso: string; label: string },
): Promise<boolean> {
  if (!profile?.email) return false;
  const supabase = await createSupabaseServiceRole();

  const { data: monthCommissions } = await supabase
    .from("affiliate_commissions")
    .select("status, commission_amount_cents, currency, paid_at")
    .eq("affiliate_id", affiliate.id)
    .gte("created_at", bounds.startIso)
    .lt("created_at", bounds.endIso);

  let conversionsCount = 0;
  let newPending = 0;
  let newApproved = 0;
  let currency = "usd";
  for (const c of monthCommissions ?? []) {
    conversionsCount += 1;
    if (c.currency) currency = c.currency;
    if (c.status === "pending") newPending += c.commission_amount_cents;
    if (c.status === "approved") newApproved += c.commission_amount_cents;
  }

  const { data: monthPaid } = await supabase
    .from("affiliate_commissions")
    .select("commission_amount_cents")
    .eq("affiliate_id", affiliate.id)
    .eq("status", "paid")
    .gte("paid_at", bounds.startIso)
    .lt("paid_at", bounds.endIso);
  const paidThisPeriod = (monthPaid ?? []).reduce(
    (s, r) => s + r.commission_amount_cents,
    0,
  );

  // Available = approved (all-time) + unapplied adjustments
  const { data: approvedAll } = await supabase
    .from("affiliate_commissions")
    .select("commission_amount_cents")
    .eq("affiliate_id", affiliate.id)
    .eq("status", "approved");
  const approvedTotal = (approvedAll ?? []).reduce(
    (s, r) => s + r.commission_amount_cents,
    0,
  );
  const { data: adjAll } = await supabase
    .from("affiliate_balance_adjustments")
    .select("amount_cents")
    .eq("affiliate_id", affiliate.id)
    .is("applied_to_payout_id", null);
  const adjustmentsTotal = (adjAll ?? []).reduce(
    (s, r) => s + r.amount_cents,
    0,
  );
  const available = Math.max(0, approvedTotal + adjustmentsTotal);

  // Skip silent months entirely — saves inbox noise.
  if (
    conversionsCount === 0 &&
    paidThisPeriod === 0 &&
    available === 0
  ) {
    return false;
  }

  const tpl = generateAffiliateMonthlySummaryEmail({
    affiliateName:
      [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
      undefined,
    affiliateEmail: profile.email,
    code: affiliate.code,
    periodLabel: bounds.label,
    conversionsCount,
    newPendingCents: newPending,
    newApprovedCents: newApproved,
    paidThisPeriodCents: paidThisPeriod,
    availableCents: available,
    currency,
  });

  await sendEmail({
    to: profile.email,
    subject: tpl.subject,
    html: tpl.html,
    text: tpl.text,
    source: "affiliate_monthly_summary",
    dedupeKey: `affiliate_summary_${affiliate.id}_${bounds.startIso.slice(0, 7)}`,
  });
  return true;
}

async function runMonthlySummary(): Promise<NextResponse> {
  const supabase = await createSupabaseServiceRole();
  const bounds = priorMonthBounds();

  const { data: affiliates, error } = await supabase
    .from("affiliates")
    .select("id, code, user_id")
    .eq("status", "active");

  if (error) {
    console.error("[affiliates/monthly-summary] list error:", error);
    return NextResponse.json(
      { error: "DB list failed", details: error.message },
      { status: 500 },
    );
  }
  if (!affiliates || affiliates.length === 0) {
    return NextResponse.json({ success: true, sent: 0 });
  }

  const userIds = affiliates.map((a) => a.user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .in("id", userIds);
  const profileById = new Map<string, ProfileRow>();
  for (const p of profiles ?? []) profileById.set(p.id, p as ProfileRow);

  let sent = 0;
  let errors = 0;
  for (const a of affiliates) {
    try {
      const did = await runForOne(a, profileById.get(a.user_id) ?? null, bounds);
      if (did) sent += 1;
    } catch (err) {
      console.error(
        `[affiliates/monthly-summary] error for ${a.id}:`,
        err,
      );
      errors += 1;
    }
  }

  return NextResponse.json({
    success: true,
    period: bounds.label,
    affiliates: affiliates.length,
    sent,
    errors,
  });
}

export async function GET(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;
  return runMonthlySummary();
}

export async function POST(request: NextRequest) {
  const unauthorized = authorizeCron(request);
  if (unauthorized) return unauthorized;
  return runMonthlySummary();
}
