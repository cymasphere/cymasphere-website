/**
 * @fileoverview Affiliate dashboard stats endpoint.
 *
 * Returns the calling user's affiliate row (if any), aggregated commission
 * totals broken out by status, payout history, and Stripe Connect
 * onboarding state. Used by the `/affiliate` page.
 *
 * Auth: requires a logged-in user. If the user is not an affiliate, we
 * return `{ affiliate: null }` (200) rather than 403 so the page can
 * render a friendly "you are not an affiliate" state.
 *
 * @module api/affiliate/stats
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

/**
 * @brief GET endpoint for affiliate dashboard stats.
 */
export async function GET(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createSupabaseServiceRole();

  const { data: affiliate } = await service
    .from("affiliates")
    .select(
      `
      id,
      code,
      customer_discount_percent,
      commission_rate_subscription,
      commission_rate_lifetime,
      recurring_months,
      payout_minimum_cents,
      stripe_connect_account_id,
      connect_payouts_enabled,
      connect_onboarded_at,
      status,
      tos_accepted_at,
      created_at
    `,
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate) {
    return NextResponse.json({ affiliate: null });
  }

  const { data: commissions } = await service
    .from("affiliate_commissions")
    .select("status, commission_amount_cents, currency, created_at")
    .eq("affiliate_id", affiliate.id);

  const stats = {
    pendingCents: 0,
    approvedCents: 0,
    paidCents: 0,
    refundedCents: 0,
    voidCents: 0,
    totalCount: 0,
    currency: "usd",
  };
  for (const c of commissions ?? []) {
    stats.totalCount += 1;
    if (c.currency) stats.currency = c.currency;
    switch (c.status) {
      case "pending":
        stats.pendingCents += c.commission_amount_cents;
        break;
      case "approved":
        stats.approvedCents += c.commission_amount_cents;
        break;
      case "paid":
        stats.paidCents += c.commission_amount_cents;
        break;
      case "refunded":
        stats.refundedCents += c.commission_amount_cents;
        break;
      case "void":
        stats.voidCents += c.commission_amount_cents;
        break;
    }
  }

  // Sum unapplied balance adjustments (refund clawbacks not yet applied to
  // a payout). Negative values reduce the affiliate's available balance.
  const { data: adjustments } = await service
    .from("affiliate_balance_adjustments")
    .select("amount_cents")
    .eq("affiliate_id", affiliate.id)
    .is("applied_to_payout_id", null);

  const adjustmentsCents = (adjustments ?? []).reduce(
    (sum, a) => sum + a.amount_cents,
    0,
  );
  const availableCents = stats.approvedCents + adjustmentsCents;

  const { data: payouts } = await service
    .from("affiliate_payouts")
    .select(
      "id, created_at, amount_cents, currency, commission_count, status",
    )
    .eq("affiliate_id", affiliate.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({
    affiliate,
    stats: {
      ...stats,
      adjustmentsCents,
      availableCents,
    },
    payouts: payouts ?? [],
  });
}

/**
 * @brief POST endpoint to record affiliate TOS acceptance.
 *
 * Called by the dashboard the first time an affiliate views it.
 */
export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createSupabaseServiceRole();
  const { error } = await service
    .from("affiliates")
    .update({ tos_accepted_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("tos_accepted_at", null);

  if (error) {
    return NextResponse.json(
      { error: "Failed to record acceptance", details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({ success: true });
}
