/**
 * @fileoverview Admin affiliate payouts management.
 *
 * GET lists payouts (optionally filtered by affiliate).
 *
 * POST runs a payout batch for a single affiliate:
 *  1. Verifies the affiliate has a verified Stripe Connect Express account.
 *  2. Locks in the set of currently-approved commissions plus unapplied
 *     balance adjustments. Net amount must be ≥ payout_minimum_cents.
 *  3. Creates a payouts row in `processing` state.
 *  4. Calls `stripe.transfers.create` with a deterministic `transfer_group`
 *     (`affiliate_<id>_payout_<payoutId>`) so retries are safe.
 *  5. On success, flips commissions to `paid`, stamps their `payout_id`,
 *     marks adjustments applied, flips the payouts row to `paid`.
 *  6. On failure, leaves commissions untouched and marks payouts row `failed`.
 *
 * @module api/admin/affiliates/payouts
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { getAffiliateStripeClient } from "@/utils/affiliates/stripe";
import { sendEmail } from "@/utils/email";
import { generateAffiliatePayoutEmail } from "@/utils/email-campaigns/affiliate-emails";

async function requireAdmin(): Promise<
  | { ok: true; userId: string }
  | { ok: false; response: NextResponse }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  const { data: adminRow } = await supabase
    .from("admins")
    .select("user")
    .eq("user", user.id)
    .maybeSingle();
  if (!adminRow) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { ok: true, userId: user.id };
}

/**
 * @brief GET endpoint listing payouts (newest first).
 *
 * Query params:
 * - affiliateId: filter to one affiliate
 * - limit / offset
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const affiliateId = sp.get("affiliateId");
  const limit = Math.min(Number(sp.get("limit") ?? 100) || 100, 500);
  const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);

  const supabase = await createSupabaseServiceRole();
  let query = supabase
    .from("affiliate_payouts")
    .select(
      `
      id,
      created_at,
      affiliate_id,
      amount_cents,
      currency,
      commission_count,
      adjustment_total_cents,
      status,
      stripe_transfer_id,
      failure_reason
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (affiliateId) query = query.eq("affiliate_id", affiliateId);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch payouts", details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({
    success: true,
    payouts: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}

interface CreatePayoutBody {
  affiliateId: string;
}

/**
 * @brief POST handler to run a payout batch for a single affiliate.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  let body: CreatePayoutBody;
  try {
    body = (await request.json()) as CreatePayoutBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const { affiliateId } = body;
  if (!affiliateId) {
    return NextResponse.json(
      { error: "affiliateId is required" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServiceRole();
  const { data: affiliate, error: affErr } = await supabase
    .from("affiliates")
    .select(
      "id, code, user_id, stripe_connect_account_id, connect_payouts_enabled, payout_minimum_cents, status",
    )
    .eq("id", affiliateId)
    .maybeSingle();
  if (affErr || !affiliate) {
    return NextResponse.json(
      { error: "Affiliate not found" },
      { status: 404 },
    );
  }
  if (!affiliate.stripe_connect_account_id || !affiliate.connect_payouts_enabled) {
    return NextResponse.json(
      {
        error:
          "Affiliate has not finished Stripe Connect onboarding; cannot pay out.",
      },
      { status: 400 },
    );
  }

  // Snapshot approved commissions and unapplied adjustments. We read into
  // memory first so the math is consistent regardless of concurrent writes.
  const { data: approved } = await supabase
    .from("affiliate_commissions")
    .select("id, commission_amount_cents, currency")
    .eq("affiliate_id", affiliateId)
    .eq("status", "approved");

  const { data: adjustments } = await supabase
    .from("affiliate_balance_adjustments")
    .select("id, amount_cents")
    .eq("affiliate_id", affiliateId)
    .is("applied_to_payout_id", null);

  const commissionTotal = (approved ?? []).reduce(
    (sum, c) => sum + c.commission_amount_cents,
    0,
  );
  const adjustmentTotal = (adjustments ?? []).reduce(
    (sum, a) => sum + a.amount_cents,
    0,
  );
  const netCents = commissionTotal + adjustmentTotal;
  const currency = approved?.[0]?.currency ?? "usd";

  if (netCents <= 0) {
    return NextResponse.json(
      {
        error: "No approved balance to pay out.",
        netCents,
        commissionTotal,
        adjustmentTotal,
      },
      { status: 400 },
    );
  }
  if (netCents < affiliate.payout_minimum_cents) {
    return NextResponse.json(
      {
        error: `Balance ${netCents} cents below minimum ${affiliate.payout_minimum_cents} cents.`,
        netCents,
      },
      { status: 400 },
    );
  }

  // Create the payouts row up front so we have an id to use as the
  // Stripe transfer_group (idempotency key).
  const { data: payout, error: payoutErr } = await supabase
    .from("affiliate_payouts")
    .insert({
      affiliate_id: affiliateId,
      amount_cents: netCents,
      currency,
      commission_count: approved?.length ?? 0,
      adjustment_total_cents: adjustmentTotal,
      status: "processing",
      created_by: auth.userId,
    })
    .select()
    .single();
  if (payoutErr || !payout) {
    return NextResponse.json(
      {
        error: "Failed to create payout record",
        details: payoutErr?.message,
      },
      { status: 500 },
    );
  }

  const transferGroup = `affiliate_${affiliateId}_payout_${payout.id}`;

  // Fire the Stripe transfer. Use the payout id as the idempotency key so
  // retries of this endpoint with the same payout don't double-pay.
  const stripe = getAffiliateStripeClient();
  let transferId: string;
  try {
    const transfer = await stripe.transfers.create(
      {
        amount: netCents,
        currency,
        destination: affiliate.stripe_connect_account_id,
        transfer_group: transferGroup,
        description: `Cymasphere affiliate payout (${affiliate.code})`,
        metadata: {
          affiliate_id: affiliateId,
          affiliate_code: affiliate.code,
          payout_id: payout.id,
          commission_count: String(approved?.length ?? 0),
        },
      },
      { idempotencyKey: `affiliate_payout_${payout.id}` },
    );
    transferId = transfer.id;
  } catch (err) {
    console.error("[admin/payouts] transfer failed:", err);
    await supabase
      .from("affiliate_payouts")
      .update({
        status: "failed",
        failure_reason: err instanceof Error ? err.message : "Unknown",
      })
      .eq("id", payout.id);
    return NextResponse.json(
      {
        error: "Stripe transfer failed",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    );
  }

  // Mark all snapshotted commissions paid and stamp them with this payout.
  const commissionIds = (approved ?? []).map((c) => c.id);
  if (commissionIds.length > 0) {
    await supabase
      .from("affiliate_commissions")
      .update({
        status: "paid",
        payout_id: payout.id,
        paid_at: new Date().toISOString(),
      })
      .in("id", commissionIds)
      .eq("status", "approved"); // double-check no race
  }

  const adjustmentIds = (adjustments ?? []).map((a) => a.id);
  if (adjustmentIds.length > 0) {
    await supabase
      .from("affiliate_balance_adjustments")
      .update({ applied_to_payout_id: payout.id })
      .in("id", adjustmentIds);
  }

  const { data: finalised } = await supabase
    .from("affiliate_payouts")
    .update({
      status: "paid",
      stripe_transfer_id: transferId,
      stripe_transfer_group: transferGroup,
    })
    .eq("id", payout.id)
    .select()
    .single();

  // Notify the affiliate. Fire-and-forget: an email failure must not
  // roll back the payout (the money has already moved).
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name")
      .eq("id", affiliate.user_id)
      .maybeSingle();
    if (profile?.email) {
      const tpl = generateAffiliatePayoutEmail({
        affiliateName:
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          undefined,
        affiliateEmail: profile.email,
        code: affiliate.code,
        amountCents: netCents,
        currency,
        commissionCount: approved?.length ?? 0,
      });
      sendEmail({
        to: profile.email,
        subject: tpl.subject,
        html: tpl.html,
        text: tpl.text,
        source: "affiliate_payout",
        dedupeKey: `affiliate_payout_${payout.id}`,
      }).catch((err) =>
        console.error("[admin/payouts] payout email failed:", err),
      );
    }
  } catch (err) {
    console.error(
      "[admin/payouts] error while sending payout notification:",
      err,
    );
  }

  return NextResponse.json({ success: true, payout: finalised });
}
