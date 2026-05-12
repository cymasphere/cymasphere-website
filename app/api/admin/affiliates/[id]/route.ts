/**
 * @fileoverview Admin affiliate detail / update API endpoint
 *
 * Handles GET (detail with commissions/payouts summary), PATCH (update
 * rates / status), and DELETE (deactivate the affiliate). Suspending
 * also deactivates the Stripe Promotion Code so no new attributions can
 * accrue, while preserving historical commissions.
 *
 * @module api/admin/affiliates/[id]
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { setAffiliatePromotionCodeActive } from "@/utils/affiliates/stripe";

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
 * @brief GET endpoint to retrieve a single affiliate with summary stats.
 *
 * @param request Next.js request object.
 * @param ctx Route context containing the affiliate id.
 * @returns NextResponse with the affiliate and aggregated stats.
 */
export async function GET(
  _request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  const supabase = await createSupabaseServiceRole();

  const { data: affiliate, error } = await supabase
    .from("affiliates")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !affiliate) {
    return NextResponse.json(
      { error: "Affiliate not found" },
      { status: 404 },
    );
  }

  const { data: commissions } = await supabase
    .from("affiliate_commissions")
    .select("status, commission_amount_cents, currency")
    .eq("affiliate_id", id);

  const stats = {
    pendingCents: 0,
    approvedCents: 0,
    paidCents: 0,
    refundedCents: 0,
    voidCents: 0,
    totalCount: 0,
  };
  for (const c of commissions ?? []) {
    stats.totalCount += 1;
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

  return NextResponse.json({ success: true, affiliate, stats });
}

/**
 * Body shape for PATCH.
 */
interface UpdateAffiliateBody {
  status?: "active" | "suspended";
  commissionRateSubscription?: number;
  commissionRateLifetime?: number;
  recurringMonths?: number;
  payoutMinimumCents?: number;
  notes?: string | null;
}

/**
 * @brief PATCH endpoint to update an affiliate's settings.
 *
 * Only admins may call this. When `status` changes between active/suspended
 * we also toggle the Stripe Promotion Code's `active` flag so that new
 * checkouts can or cannot redeem the code. Historical commissions are
 * untouched.
 *
 * @note `customer_discount_percent` is intentionally not editable here
 * because Stripe coupons are immutable on `percent_off`. Changing the
 * customer-facing discount requires creating a new affiliate.
 */
export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const { id } = await ctx.params;

  let body: UpdateAffiliateBody;
  try {
    body = (await request.json()) as UpdateAffiliateBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createSupabaseServiceRole();
  const { data: existing } = await supabase
    .from("affiliates")
    .select("id, stripe_promotion_code_id, status")
    .eq("id", id)
    .maybeSingle();
  if (!existing) {
    return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};

  if (body.status && (body.status === "active" || body.status === "suspended")) {
    updates.status = body.status;
  }
  if (
    typeof body.commissionRateSubscription === "number" &&
    body.commissionRateSubscription > 0 &&
    body.commissionRateSubscription <= 1
  ) {
    updates.commission_rate_subscription = body.commissionRateSubscription;
  }
  if (
    typeof body.commissionRateLifetime === "number" &&
    body.commissionRateLifetime > 0 &&
    body.commissionRateLifetime <= 1
  ) {
    updates.commission_rate_lifetime = body.commissionRateLifetime;
  }
  if (
    typeof body.recurringMonths === "number" &&
    Number.isInteger(body.recurringMonths) &&
    body.recurringMonths > 0
  ) {
    updates.recurring_months = body.recurringMonths;
  }
  if (
    typeof body.payoutMinimumCents === "number" &&
    Number.isInteger(body.payoutMinimumCents) &&
    body.payoutMinimumCents >= 0
  ) {
    updates.payout_minimum_cents = body.payoutMinimumCents;
  }
  if (body.notes !== undefined) {
    updates.notes = body.notes;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 },
    );
  }

  if (
    updates.status &&
    updates.status !== existing.status &&
    existing.stripe_promotion_code_id
  ) {
    try {
      await setAffiliatePromotionCodeActive(
        existing.stripe_promotion_code_id,
        updates.status === "active",
      );
    } catch (err) {
      console.error("[admin/affiliates PATCH] promotion code toggle failed:", err);
      return NextResponse.json(
        {
          error: "Failed to update Stripe promotion code state",
          details: err instanceof Error ? err.message : "Unknown error",
        },
        { status: 500 },
      );
    }
  }

  const { data: updated, error } = await supabase
    .from("affiliates")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json(
      { error: "Failed to update affiliate", details: error?.message },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, affiliate: updated });
}
