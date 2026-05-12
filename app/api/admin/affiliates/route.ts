/**
 * @fileoverview Admin affiliates management API endpoint
 *
 * Handles listing affiliates and creating new ones. Creating an affiliate
 * is a transactional sequence: validate input, create Stripe Coupon, create
 * Stripe Promotion Code, insert the database row. If any step fails after
 * Stripe objects are created we attempt to clean them up.
 *
 * @module api/admin/affiliates
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import {
  createAffiliateStripeArtifacts,
  getAffiliateStripeClient,
  normaliseAffiliateCode,
} from "@/utils/affiliates/stripe";
import { sendEmail } from "@/utils/email";
import { generateAffiliateWelcomeEmail } from "@/utils/email-campaigns/affiliate-emails";

/**
 * @brief Verify the calling user is authenticated and an admin.
 *
 * @returns Object with the authenticated user id or an error response.
 */
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
 * @brief GET endpoint to list affiliates.
 *
 * Returns all affiliates in the system with their basic stats:
 * total commissions earned, pending balance, paid balance, and Stripe
 * Connect onboarding status. Ordered by creation date (newest first).
 *
 * Responses:
 * - 200 OK: `{ success: true, affiliates: Affiliate[] }`
 * - 401 Unauthorized
 * - 403 Forbidden (not an admin)
 * - 500 Internal Server Error
 *
 * @param _request Next.js request object (unused).
 * @returns NextResponse with affiliates list.
 */
export async function GET(_request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const supabase = await createSupabaseServiceRole();

  const { data: affiliates, error } = await supabase
    .from("affiliates")
    .select(
      `
      id,
      created_at,
      updated_at,
      user_id,
      code,
      stripe_coupon_id,
      stripe_promotion_code_id,
      customer_discount_percent,
      commission_rate_subscription,
      commission_rate_lifetime,
      recurring_months,
      payout_minimum_cents,
      stripe_connect_account_id,
      connect_payouts_enabled,
      connect_onboarded_at,
      status,
      notes,
      tos_accepted_at
    `,
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[admin/affiliates] list error:", error);
    return NextResponse.json(
      { error: "Failed to fetch affiliates" },
      { status: 500 },
    );
  }

  return NextResponse.json({ success: true, affiliates });
}

/**
 * Request body shape for affiliate creation.
 */
interface CreateAffiliateBody {
  userId: string;
  code: string;
  customerDiscountPercent?: number;
  commissionRateSubscription?: number;
  commissionRateLifetime?: number;
  recurringMonths?: number;
  payoutMinimumCents?: number;
  notes?: string;
}

/**
 * @brief POST endpoint to invite (create) a new affiliate.
 *
 * Creates the Stripe Coupon + Promotion Code, then inserts the
 * `affiliates` row. On failure after Stripe objects are created we
 * attempt to delete them so we don't leak.
 *
 * Request body (JSON):
 * - userId: UUID of the existing Cymasphere user (must have a profiles row)
 * - code: customer-facing string (3-32 uppercase alphanumeric)
 * - customerDiscountPercent: 1-100, default 20
 * - commissionRateSubscription: 0..1, default 0.20
 * - commissionRateLifetime: 0..1, default 0.20
 * - recurringMonths: positive int, default 12
 * - payoutMinimumCents: non-negative int, default 5000 ($50)
 * - notes: optional admin notes
 *
 * Responses:
 * - 200 OK: `{ success: true, affiliate: {...} }`
 * - 400 Bad Request: invalid input
 * - 401/403 Auth
 * - 409 Conflict: code already exists
 * - 500: server error
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  const adminUserId = auth.userId;

  let body: CreateAffiliateBody;
  try {
    body = (await request.json()) as CreateAffiliateBody;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const {
    userId,
    code,
    customerDiscountPercent = 20,
    commissionRateSubscription = 0.2,
    commissionRateLifetime = 0.2,
    recurringMonths = 12,
    payoutMinimumCents = 5000,
    notes,
  } = body;

  if (!userId || typeof userId !== "string") {
    return NextResponse.json(
      { error: "userId is required" },
      { status: 400 },
    );
  }

  let normalisedCode: string;
  try {
    normalisedCode = normaliseAffiliateCode(code);
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Invalid code",
      },
      { status: 400 },
    );
  }

  if (
    customerDiscountPercent <= 0 ||
    customerDiscountPercent > 100 ||
    !Number.isFinite(customerDiscountPercent)
  ) {
    return NextResponse.json(
      { error: "customerDiscountPercent must be between 1 and 100" },
      { status: 400 },
    );
  }

  if (
    commissionRateSubscription <= 0 ||
    commissionRateSubscription > 1 ||
    commissionRateLifetime <= 0 ||
    commissionRateLifetime > 1
  ) {
    return NextResponse.json(
      { error: "Commission rates must be between 0 and 1 (e.g. 0.20 for 20%)" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(recurringMonths) || recurringMonths <= 0) {
    return NextResponse.json(
      { error: "recurringMonths must be a positive integer" },
      { status: 400 },
    );
  }

  if (!Number.isInteger(payoutMinimumCents) || payoutMinimumCents < 0) {
    return NextResponse.json(
      { error: "payoutMinimumCents must be a non-negative integer" },
      { status: 400 },
    );
  }

  const supabase = await createSupabaseServiceRole();

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name")
    .eq("id", userId)
    .maybeSingle();

  if (profileErr || !profile) {
    return NextResponse.json(
      { error: "User profile not found" },
      { status: 400 },
    );
  }

  const { data: existing } = await supabase
    .from("affiliates")
    .select("id, code")
    .or(`user_id.eq.${userId},code.eq.${normalisedCode}`)
    .limit(1);

  if (existing && existing.length > 0) {
    return NextResponse.json(
      {
        error:
          existing[0].code === normalisedCode
            ? "Affiliate code already in use"
            : "User is already an affiliate",
      },
      { status: 409 },
    );
  }

  let couponId: string | null = null;
  let promotionCodeId: string | null = null;

  try {
    const artifacts = await createAffiliateStripeArtifacts({
      code: normalisedCode,
      customerDiscountPercent,
      recurringMonths,
    });
    couponId = artifacts.couponId;
    promotionCodeId = artifacts.promotionCodeId;
  } catch (err) {
    console.error("[admin/affiliates] Stripe artifact creation failed:", err);
    return NextResponse.json(
      {
        error: "Failed to provision Stripe coupon/promotion code",
        details: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 },
    );
  }

  const { data: inserted, error: insertErr } = await supabase
    .from("affiliates")
    .insert({
      user_id: userId,
      code: normalisedCode,
      stripe_coupon_id: couponId!,
      stripe_promotion_code_id: promotionCodeId!,
      customer_discount_percent: customerDiscountPercent,
      commission_rate_subscription: commissionRateSubscription,
      commission_rate_lifetime: commissionRateLifetime,
      recurring_months: recurringMonths,
      payout_minimum_cents: payoutMinimumCents,
      notes: notes ?? null,
      created_by: adminUserId,
      status: "active",
    })
    .select()
    .single();

  if (insertErr || !inserted) {
    console.error("[admin/affiliates] DB insert failed, rolling back Stripe artifacts:", insertErr);
    const stripe = getAffiliateStripeClient();
    try {
      await stripe.promotionCodes.update(promotionCodeId!, { active: false });
    } catch (e) {
      console.error("[admin/affiliates] promo deactivate failed:", e);
    }
    try {
      await stripe.coupons.del(couponId!);
    } catch (e) {
      console.error("[admin/affiliates] coupon delete failed:", e);
    }
    return NextResponse.json(
      { error: "Failed to create affiliate", details: insertErr?.message },
      { status: 500 },
    );
  }

  // Fire-and-forget welcome email. We don't await — a transient email
  // failure shouldn't prevent affiliate creation, but log it for ops.
  if (profile.email) {
    const tpl = generateAffiliateWelcomeEmail({
      affiliateName:
        [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
        undefined,
      affiliateEmail: profile.email,
      code: normalisedCode,
      customerDiscountPercent,
      commissionRateSubscription,
      commissionRateLifetime,
      recurringMonths,
    });
    sendEmail({
      to: profile.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      source: "affiliate_welcome",
      dedupeKey: `affiliate_welcome_${inserted.id}`,
    }).catch((err) =>
      console.error("[admin/affiliates] welcome email failed:", err),
    );
  }

  return NextResponse.json({ success: true, affiliate: inserted });
}
