/**
 * @fileoverview Validates a promo code for a plan and returns the discounted price.
 *
 * Used by checkout UI to show whether a code was applied and the new price before
 * the user proceeds to payment. Reuses the same coupon resolution logic as
 * subscription-setup and payment-intent (user-entered promotion codes only).
 *
 * @module api/stripe/validate-promo
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import { PlanType } from "@/types/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief Resolves coupon ID from user-entered promotion code only (no auto-apply).
 * @param promotionCode - User-entered promo code
 * @returns Coupon ID if valid, null otherwise
 */
async function resolveCouponId(
  promotionCode: string | undefined,
): Promise<{ couponId: string; fromCode: true } | null> {
  if (!promotionCode?.trim()) return null;
  const list = await stripe.promotionCodes.list({
    code: promotionCode.trim(),
    active: true,
    limit: 1,
  });
  const promo = list.data[0];
  const couponRef =
    promo?.promotion?.coupon ?? (promo as { coupon?: string })?.coupon;
  if (couponRef) {
    const couponId =
      typeof couponRef === "string"
        ? couponRef
        : (couponRef as { id: string }).id;
    return { couponId, fromCode: true };
  }
  return null;
}

/**
 * @brief Applies coupon to base amount (percent_off or amount_off).
 * @param baseAmountCents - Original amount in cents
 * @param currency - Currency code (e.g. usd)
 * @param coupon - Stripe coupon object
 * @returns Discounted amount in cents
 */
function applyCouponToAmount(
  baseAmountCents: number,
  currency: string,
  coupon: Stripe.Coupon,
): number {
  if (coupon.percent_off != null) {
    return Math.round((baseAmountCents * (100 - coupon.percent_off)) / 100);
  }
  if (
    coupon.amount_off != null &&
    (coupon.currency ?? "usd").toLowerCase() === currency.toLowerCase()
  ) {
    return Math.max(50, baseAmountCents - coupon.amount_off);
  }
  return baseAmountCents;
}

/**
 * @brief POST endpoint to validate a promo code and return discounted price
 *
 * Request body: { planType: PlanType, promotionCode?: string }
 *
 * Responses:
 * 200 - Valid code (or auto-apply): { success: true, valid: true, amountAfterDiscount, currency, message? }
 * 200 - Invalid code: { success: true, valid: false, message: string }
 * 400/503 - Bad request or Stripe unavailable
 *
 * @param request - Next.js request with JSON body
 * @returns NextResponse with validation result
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp, 20, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      planType,
      promotionCode,
    }: { planType?: string; promotionCode?: string } = body;

    const validPlans: PlanType[] = ["monthly", "annual", "lifetime"];
    if (!planType || !validPlans.includes(planType as PlanType)) {
      return NextResponse.json(
        {
          success: false,
          error: "planType must be monthly, annual, or lifetime.",
        },
        { status: 400 },
      );
    }

    const priceIds: Record<PlanType, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
      annual: process.env.STRIPE_PRICE_ID_ANNUAL,
      lifetime: process.env.STRIPE_PRICE_ID_LIFETIME,
    };
    const priceId = priceIds[planType as PlanType];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const price = await stripe.prices.retrieve(priceId);
    const baseAmount = price.unit_amount ?? 0;
    const currency = (price.currency as string) || "usd";

    if (baseAmount < 50) {
      return NextResponse.json(
        { success: false, error: "Invalid price configuration." },
        { status: 503 },
      );
    }

    const resolved = await resolveCouponId(promotionCode?.trim());

    if (!resolved) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: promotionCode?.trim()
          ? "Invalid or expired code."
          : "No promotion applied.",
      });
    }

    const coupon = await stripe.coupons.retrieve(resolved.couponId);
    if (!coupon.valid) {
      return NextResponse.json({
        success: true,
        valid: false,
        message: "This promotion is no longer valid.",
      });
    }

    const amountAfterDiscount = applyCouponToAmount(
      baseAmount,
      currency,
      coupon,
    );

    const duration =
      coupon.duration === "once"
        ? "once"
        : coupon.duration === "forever"
          ? "forever"
          : coupon.duration === "repeating" && coupon.duration_in_months != null
            ? "repeating"
            : null;
    const durationInMonths =
      duration === "repeating" ? coupon.duration_in_months ?? null : null;

    return NextResponse.json({
      success: true,
      valid: true,
      amountAfterDiscount,
      currency,
      message: resolved.fromCode ? "Code applied." : undefined,
      duration: duration ?? undefined,
      durationInMonths: durationInMonths ?? undefined,
    });
  } catch (error) {
    console.error("Validate promo error:", error);
    const msg = error instanceof Error ? error.message : "Validation failed";
    const isConfigError =
      msg.includes("apiKey") ||
      msg.includes("STRIPE_SECRET_KEY") ||
      msg.includes("connection to Stripe");
    return NextResponse.json(
      {
        success: false,
        error: isConfigError ? STRIPE_UNAVAILABLE_MSG : msg,
      },
      { status: isConfigError ? 503 : 500 },
    );
  }
}
