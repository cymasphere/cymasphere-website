/**
 * @fileoverview Admin commissions ledger endpoint.
 *
 * Returns a paginated list of affiliate commissions for the admin UI.
 * Supports filtering by affiliate id, status, and product kind.
 *
 * @module api/admin/affiliates/commissions
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

async function requireAdmin(): Promise<
  | { ok: true }
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
  return { ok: true };
}

/**
 * @brief GET endpoint listing commissions (admin only).
 *
 * Query params:
 * - affiliateId: filter to a single affiliate
 * - status: pending | approved | paid | refunded | void
 * - productKind: monthly | annual | lifetime
 * - limit: default 100, max 500
 * - offset: default 0
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const affiliateId = sp.get("affiliateId");
  const status = sp.get("status");
  const productKind = sp.get("productKind");
  const limit = Math.min(Number(sp.get("limit") ?? 100) || 100, 500);
  const offset = Math.max(Number(sp.get("offset") ?? 0) || 0, 0);

  const supabase = await createSupabaseServiceRole();
  let query = supabase
    .from("affiliate_commissions")
    .select(
      `
      id,
      created_at,
      affiliate_id,
      referred_customer_id,
      referred_user_id,
      stripe_invoice_id,
      stripe_payment_intent_id,
      stripe_subscription_id,
      product_kind,
      recurring_month_index,
      gross_amount_cents,
      commission_amount_cents,
      currency,
      status,
      approve_at,
      paid_at,
      payout_id
    `,
      { count: "exact" },
    )
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (affiliateId) query = query.eq("affiliate_id", affiliateId);
  if (status) query = query.eq("status", status);
  if (productKind) query = query.eq("product_kind", productKind);

  const { data, error, count } = await query;
  if (error) {
    return NextResponse.json(
      { error: "Failed to fetch commissions", details: error.message },
      { status: 500 },
    );
  }
  return NextResponse.json({
    success: true,
    commissions: data ?? [],
    total: count ?? 0,
    limit,
    offset,
  });
}
