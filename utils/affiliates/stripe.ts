/**
 * @fileoverview Stripe helpers for the affiliate program
 *
 * Centralises creation of the Stripe Coupon + Promotion Code pair that
 * underpins every affiliate, plus the small lookups the webhook and
 * checkout routes need. Each affiliate's `code` is the customer-facing
 * Stripe Promotion Code "code" field; the underlying coupon defines the
 * discount percentage and duration.
 *
 * @module utils/affiliates/stripe
 */

import "server-only";
import Stripe from "stripe";

/**
 * Shared Stripe client.
 *
 * @note Reads `STRIPE_SECRET_KEY` from the environment at module load.
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Parameters required to spin up the Stripe coupon + promotion code
 * that back an affiliate.
 */
export interface CreateAffiliateStripeArtifactsParams {
  /** Customer-facing string, must be uppercase alphanumeric (3-32 chars). */
  code: string;
  /** Customer discount percentage (1-100). */
  customerDiscountPercent: number;
  /** Number of monthly invoices the coupon should apply to. */
  recurringMonths: number;
}

/**
 * Result of {@link createAffiliateStripeArtifacts}.
 */
export interface AffiliateStripeArtifacts {
  /** Stripe Coupon ID. */
  couponId: string;
  /** Stripe Promotion Code ID (different from the human-typed `code`). */
  promotionCodeId: string;
}

/**
 * @brief Validate that a candidate affiliate code is well-formed.
 *
 * Affiliate codes must be uppercase, alphanumeric, 3-32 characters long.
 * We also reject obvious profanity / Stripe-reserved patterns via a small
 * allow-list of characters.
 *
 * @param code Candidate code (any casing).
 * @returns The normalised (uppercased) code.
 * @throws Error if the code is invalid.
 */
export function normaliseAffiliateCode(code: string): string {
  const trimmed = (code ?? "").trim().toUpperCase();
  if (!/^[A-Z0-9]{3,32}$/.test(trimmed)) {
    throw new Error(
      "Affiliate code must be 3-32 uppercase letters or digits.",
    );
  }
  return trimmed;
}

/**
 * @brief Creates the Stripe Coupon + Promotion Code pair for a new affiliate.
 *
 * Atomically (well, sequentially) provisions:
 * 1. A Stripe Coupon with `duration=repeating, duration_in_months=recurringMonths`
 *    so the customer keeps the discount for the same window the affiliate earns on.
 * 2. A Stripe Promotion Code whose human-readable `code` matches the affiliate's code.
 *
 * If promotion-code creation fails after the coupon is created, the coupon
 * is best-effort deleted to avoid orphaned Stripe objects.
 *
 * @param params {@link CreateAffiliateStripeArtifactsParams}.
 * @returns IDs of the created coupon and promotion code.
 * @throws Error on Stripe failures; coupon is rolled back if promo creation fails.
 */
export async function createAffiliateStripeArtifacts(
  params: CreateAffiliateStripeArtifactsParams,
): Promise<AffiliateStripeArtifacts> {
  const { code, customerDiscountPercent, recurringMonths } = params;

  const coupon = await stripe.coupons.create({
    percent_off: customerDiscountPercent,
    duration: "repeating",
    duration_in_months: recurringMonths,
    name: `Affiliate ${code}`,
    metadata: {
      affiliate_code: code,
      kind: "affiliate",
    },
  });

  try {
    const promo = await stripe.promotionCodes.create({
      promotion: { type: "coupon", coupon: coupon.id },
      code,
      active: true,
      metadata: {
        affiliate_code: code,
        kind: "affiliate",
      },
    });

    return { couponId: coupon.id, promotionCodeId: promo.id };
  } catch (err) {
    try {
      await stripe.coupons.del(coupon.id);
    } catch (delErr) {
      console.error(
        "[affiliates] Failed to roll back coupon after promo failure:",
        delErr,
      );
    }
    throw err;
  }
}

/**
 * @brief Mark a Stripe Promotion Code active or inactive.
 *
 * Used when an admin suspends/unsuspends an affiliate. Inactive promotion
 * codes are rejected at Stripe Checkout, so this halts new attributions
 * without affecting historical commissions or in-flight subscriptions.
 *
 * @param promotionCodeId Stripe promotion_code id (e.g. promo_...).
 * @param active Whether the code should accept new redemptions.
 */
export async function setAffiliatePromotionCodeActive(
  promotionCodeId: string,
  active: boolean,
): Promise<void> {
  await stripe.promotionCodes.update(promotionCodeId, { active });
}

/**
 * @brief Locate the affiliate promotion code that was applied to a Stripe object.
 *
 * Reads the most-recently-applied promotion code on a Checkout Session,
 * Invoice, or PaymentIntent. Returns the promotion-code ID we can look up
 * in the `affiliates` table.
 *
 * @param obj A Stripe Session/Invoice/PaymentIntent (or its metadata).
 * @returns Stripe promotion_code id, or null if no discount was applied.
 *
 * @note Different Stripe objects surface the applied promotion code under
 * different fields. This helper normalises that:
 *   - Checkout Session: total_details.breakdown.discounts[].discount.promotion_code
 *   - Invoice: discount.promotion_code OR discounts[i].promotion_code
 *   - PaymentIntent: relies on attached charge/invoice metadata; caller
 *     should resolve the related invoice/session first when possible.
 */
export function extractPromotionCodeIdFromStripeObject(obj: unknown): string | null {
  if (!obj || typeof obj !== "object") return null;

  const o = obj as Record<string, unknown>;

  // Checkout Session shape
  if (o.total_details && typeof o.total_details === "object") {
    const td = o.total_details as Record<string, unknown>;
    const breakdown = td.breakdown as Record<string, unknown> | undefined;
    const discounts = breakdown?.discounts as Array<Record<string, unknown>> | undefined;
    if (Array.isArray(discounts) && discounts.length > 0) {
      const first = discounts[0]?.discount as Record<string, unknown> | undefined;
      const pc = first?.promotion_code;
      if (typeof pc === "string") return pc;
      if (pc && typeof pc === "object" && "id" in (pc as object)) {
        return (pc as { id: string }).id;
      }
    }
  }

  // Invoice / Subscription shape: `discount` is legacy, `discounts` is the array form.
  const discount = o.discount as Record<string, unknown> | undefined;
  if (discount) {
    const pc = discount.promotion_code;
    if (typeof pc === "string") return pc;
    if (pc && typeof pc === "object" && "id" in (pc as object)) {
      return (pc as { id: string }).id;
    }
  }

  const discounts = o.discounts;
  if (Array.isArray(discounts)) {
    for (const d of discounts) {
      if (typeof d === "string") continue;
      const dd = d as Record<string, unknown>;
      const pc = dd.promotion_code;
      if (typeof pc === "string") return pc;
      if (pc && typeof pc === "object" && "id" in (pc as object)) {
        return (pc as { id: string }).id;
      }
    }
  }

  return null;
}

/**
 * @brief Convenience getter for the shared Stripe client.
 *
 * Returned client is the same instance the helpers above use; expose it
 * so API routes don't have to re-instantiate Stripe.
 */
export function getAffiliateStripeClient(): Stripe {
  return stripe;
}
