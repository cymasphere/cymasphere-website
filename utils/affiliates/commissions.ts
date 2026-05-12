/**
 * @fileoverview Webhook-side commission ingestion for the affiliate system.
 *
 * Pure helpers consumed by `app/api/stripe/webhook/route.ts` to insert
 * commission rows when subscription invoices or lifetime payment intents
 * succeed, and to reverse them on refunds/disputes. All operations are
 * idempotent — they rely on the unique indexes
 *   (stripe_invoice_id, affiliate_id) and (stripe_payment_intent_id, affiliate_id)
 * defined in the affiliates migration.
 *
 * @module utils/affiliates/commissions
 */

import "server-only";
import type Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { extractPromotionCodeIdFromStripeObject } from "@/utils/affiliates/stripe";

/**
 * Number of days a commission stays in `pending` before being eligible
 * for promotion to `approved` by the nightly cron. This buffer absorbs
 * the typical refund/dispute window so we don't pay out money we'll
 * have to claw back.
 */
const REFUND_HOLD_DAYS = 30;

/**
 * Cached lookup of price-id → product_kind, populated from the env vars
 * STRIPE_PRICE_ID_MONTHLY / _ANNUAL / _LIFETIME. Lets us tag commissions
 * with the right kind without making a Stripe `prices.retrieve` call.
 */
function getPriceIdMap(): Record<string, "monthly" | "annual" | "lifetime"> {
  const map: Record<string, "monthly" | "annual" | "lifetime"> = {};
  const m = process.env.STRIPE_PRICE_ID_MONTHLY?.trim();
  const a = process.env.STRIPE_PRICE_ID_ANNUAL?.trim();
  const l = process.env.STRIPE_PRICE_ID_LIFETIME?.trim();
  if (m) map[m] = "monthly";
  if (a) map[a] = "annual";
  if (l) map[l] = "lifetime";
  return map;
}

/**
 * Affiliate row shape we need from the DB for commission math.
 */
interface AffiliateForCommission {
  id: string;
  user_id: string;
  stripe_promotion_code_id: string;
  commission_rate_subscription: number;
  commission_rate_lifetime: number;
  recurring_months: number;
  status: string;
}

/**
 * @brief Look up the affiliate that owns a given Stripe promotion code.
 *
 * @param promotionCodeId Stripe `promo_...` id.
 * @returns Affiliate row (active only), or null when not attributable.
 */
async function findAffiliateByPromotionCode(
  promotionCodeId: string,
): Promise<AffiliateForCommission | null> {
  const supabase = await createSupabaseServiceRole();
  const { data, error } = await supabase
    .from("affiliates")
    .select(
      "id, user_id, stripe_promotion_code_id, commission_rate_subscription, commission_rate_lifetime, recurring_months, status",
    )
    .eq("stripe_promotion_code_id", promotionCodeId)
    .maybeSingle();
  if (error) {
    console.error("[affiliates] findAffiliateByPromotionCode error:", error);
    return null;
  }
  return data;
}

/**
 * @brief Resolve the referred Supabase user (if any) for a Stripe customer.
 *
 * Used to flag self-referrals and to surface the customer in the
 * affiliate's dashboard. Falls back gracefully — a referred user may
 * not yet have a profile (e.g. guest checkout) and that's fine.
 *
 * @param customerId Stripe customer id.
 * @returns The Supabase profile id, or null.
 */
async function findReferredUserId(
  customerId: string,
): Promise<string | null> {
  const supabase = await createSupabaseServiceRole();
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("customer_id", customerId)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * @brief Check whether the affiliate is referring themselves.
 *
 * Self-referrals are blocked at commission-insert time so we don't pay
 * affiliates for their own subscription.
 *
 * @param affiliateUserId Profile id of the affiliate.
 * @param referredUserId Profile id of the customer (may be null).
 * @returns True if the affiliate is referring themselves.
 */
function isSelfReferral(
  affiliateUserId: string,
  referredUserId: string | null,
): boolean {
  return Boolean(referredUserId && referredUserId === affiliateUserId);
}

/**
 * @brief Pull a subscription id out of an Invoice in a version-agnostic way.
 *
 * Stripe API 2025-12-15 moved `subscription` off the top level and onto
 * `parent.subscription_details.subscription`. Older versions kept it on
 * the top level. We handle both.
 */
function extractInvoiceSubscriptionId(
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
  },
): string | null {
  // Legacy direct field.
  if (typeof invoice.subscription === "string") return invoice.subscription;
  if (invoice.subscription && typeof invoice.subscription === "object") {
    return invoice.subscription.id ?? null;
  }
  // Modern Invoice.parent.subscription_details.subscription.
  const parent = (invoice as { parent?: unknown }).parent;
  if (parent && typeof parent === "object") {
    const subDetails = (parent as { subscription_details?: unknown })
      .subscription_details;
    if (subDetails && typeof subDetails === "object") {
      const sub = (subDetails as { subscription?: unknown }).subscription;
      if (typeof sub === "string") return sub;
      if (sub && typeof sub === "object" && "id" in (sub as object)) {
        return (sub as { id: string }).id;
      }
    }
  }
  return null;
}

/**
 * @brief Extract a charge id and payment-intent id from an Invoice.
 *
 * Stripe API 2025-12-15 moved these onto the InvoicePayment children
 * (`invoice.payments.data[].payment.charge | payment_intent`). Older
 * versions exposed them as top-level `invoice.charge` / `invoice.payment_intent`.
 */
function extractInvoicePaymentRefs(
  invoice: Stripe.Invoice & {
    charge?: string | Stripe.Charge | null;
    payment_intent?: string | Stripe.PaymentIntent | null;
  },
): { chargeId: string | null; paymentIntentId: string | null } {
  // Legacy fields first.
  let chargeId: string | null =
    typeof invoice.charge === "string"
      ? invoice.charge
      : invoice.charge?.id ?? null;
  let paymentIntentId: string | null =
    typeof invoice.payment_intent === "string"
      ? invoice.payment_intent
      : invoice.payment_intent?.id ?? null;

  // Modern InvoicePayment children.
  const payments = (invoice as { payments?: { data?: unknown[] } }).payments;
  const data = payments?.data;
  if (Array.isArray(data)) {
    for (const ip of data) {
      if (!ip || typeof ip !== "object") continue;
      const payment = (ip as { payment?: unknown }).payment;
      if (!payment || typeof payment !== "object") continue;
      const p = payment as {
        charge?: string | { id: string };
        payment_intent?: string | { id: string };
      };
      if (!chargeId && p.charge) {
        chargeId = typeof p.charge === "string" ? p.charge : p.charge.id;
      }
      if (!paymentIntentId && p.payment_intent) {
        paymentIntentId =
          typeof p.payment_intent === "string"
            ? p.payment_intent
            : p.payment_intent.id;
      }
      if (chargeId && paymentIntentId) break;
    }
  }
  return { chargeId, paymentIntentId };
}

/**
 * @brief Insert a commission row for a successfully paid subscription invoice.
 *
 * Looks up the affiliate by the promotion code applied to the invoice
 * (or by the affiliate metadata stamped on the subscription), counts
 * how many invoices have already been credited for this subscription,
 * and inserts a new pending commission if we're still within the
 * `recurring_months` cap.
 *
 * Idempotency: relies on the
 * `(stripe_invoice_id, affiliate_id)` unique index.
 *
 * @param invoice Stripe Invoice object from `invoice.payment_succeeded`.
 */
export async function ingestInvoicePaid(
  invoice: Stripe.Invoice & {
    subscription?: string | Stripe.Subscription | null;
    payment_intent?: string | Stripe.PaymentIntent | null;
    charge?: string | Stripe.Charge | null;
  },
): Promise<void> {
  if (!invoice.id) return;
  if ((invoice.amount_paid ?? 0) <= 0) {
    return;
  }

  // Resolve the promotion code two ways: from the invoice itself, and
  // from any affiliate metadata that the checkout route stamped on the
  // underlying subscription. We prefer the on-invoice value (Stripe
  // confirms the discount was actually applied) but fall back to
  // metadata if Stripe didn't surface a promotion_code (rare).
  let promotionCodeId =
    extractPromotionCodeIdFromStripeObject(invoice) ?? null;
  let affiliateIdFromMeta: string | null = null;

  if (!promotionCodeId) {
    const subRef = invoice.subscription;
    if (subRef && typeof subRef === "object" && "metadata" in subRef) {
      const meta = (subRef as Stripe.Subscription).metadata ?? {};
      const pcid = meta.affiliate_promotion_code_id;
      if (typeof pcid === "string") promotionCodeId = pcid;
      if (typeof meta.affiliate_id === "string") {
        affiliateIdFromMeta = meta.affiliate_id;
      }
    }
  }

  let affiliate: AffiliateForCommission | null = null;
  if (promotionCodeId) {
    affiliate = await findAffiliateByPromotionCode(promotionCodeId);
  }
  if (!affiliate && affiliateIdFromMeta) {
    const supabase = await createSupabaseServiceRole();
    const { data } = await supabase
      .from("affiliates")
      .select(
        "id, user_id, stripe_promotion_code_id, commission_rate_subscription, commission_rate_lifetime, recurring_months, status",
      )
      .eq("id", affiliateIdFromMeta)
      .maybeSingle();
    affiliate = data;
    if (affiliate) {
      promotionCodeId = affiliate.stripe_promotion_code_id;
    }
  }
  if (!affiliate || affiliate.status !== "active" || !promotionCodeId) {
    return;
  }

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;
  if (!customerId) return;

  const referredUserId = await findReferredUserId(customerId);
  if (isSelfReferral(affiliate.user_id, referredUserId)) {
    console.warn(
      `[affiliates] Blocking self-referral commission for affiliate ${affiliate.id}`,
    );
    return;
  }

  // Determine product kind from the price on the first line item.
  // Stripe v2 line items expose this via `pricing.price_details.price`,
  // which may be a string id or an expanded Price object.
  const priceMap = getPriceIdMap();
  let productKind: "monthly" | "annual" | "lifetime" = "monthly";
  const firstLine = invoice.lines?.data?.[0];
  const priceDetails = firstLine?.pricing?.price_details;
  let linePriceId: string | undefined;
  if (priceDetails) {
    const p = priceDetails.price;
    linePriceId = typeof p === "string" ? p : p?.id;
  }
  if (linePriceId && priceMap[linePriceId]) {
    productKind = priceMap[linePriceId];
  }
  if (productKind === "lifetime") {
    // Lifetime invoices are handled via payment_intent.succeeded.
    return;
  }

  const subscriptionId = extractInvoiceSubscriptionId(invoice);
  if (!subscriptionId) return;

  // Enforce the recurring_months cap: count rows we've already created
  // for this affiliate+subscription pair (any status that still counts:
  // pending / approved / paid). If we're at or above the cap, bail.
  const supabase = await createSupabaseServiceRole();
  const { data: existing } = await supabase
    .from("affiliate_commissions")
    .select("recurring_month_index")
    .eq("affiliate_id", affiliate.id)
    .eq("stripe_subscription_id", subscriptionId)
    .in("status", ["pending", "approved", "paid"])
    .order("recurring_month_index", { ascending: false })
    .limit(1);

  const nextIndex = existing && existing.length > 0
    ? ((existing[0].recurring_month_index ?? -1) + 1)
    : 0;

  if (nextIndex >= affiliate.recurring_months) {
    console.log(
      `[affiliates] Subscription ${subscriptionId} hit recurring_months cap (${affiliate.recurring_months}) for affiliate ${affiliate.id}`,
    );
    return;
  }

  const grossCents = invoice.amount_paid;
  const commissionCents = Math.round(
    grossCents * affiliate.commission_rate_subscription,
  );
  const { chargeId, paymentIntentId } = extractInvoicePaymentRefs(invoice);

  const approveAt = new Date(
    Date.now() + REFUND_HOLD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("affiliate_commissions").insert({
    affiliate_id: affiliate.id,
    referred_customer_id: customerId,
    referred_user_id: referredUserId,
    stripe_promotion_code_id: promotionCodeId,
    stripe_invoice_id: invoice.id,
    stripe_charge_id: chargeId ?? null,
    stripe_payment_intent_id: paymentIntentId ?? null,
    stripe_subscription_id: subscriptionId,
    product_kind: productKind,
    recurring_month_index: nextIndex,
    gross_amount_cents: grossCents,
    commission_amount_cents: commissionCents,
    currency: invoice.currency,
    status: "pending",
    approve_at: approveAt,
  });

  if (error) {
    if (error.code === "23505") {
      // Unique-constraint violation: another webhook delivery already
      // inserted this commission, which is exactly what we want.
      return;
    }
    console.error("[affiliates] commission insert failed:", error);
    return;
  }

  console.log(
    `[affiliates] Inserted ${productKind} commission ${commissionCents}c for affiliate ${affiliate.id} on subscription ${subscriptionId} (#${nextIndex + 1}/${affiliate.recurring_months})`,
  );
}

/**
 * @brief Insert a commission row for a successful lifetime PaymentIntent.
 *
 * Only fires when the PI carries `purchase_type=lifetime` metadata (the
 * webhook validates this elsewhere) AND an `affiliate_id` was stamped on
 * the PI metadata by the checkout route.
 *
 * Idempotency: relies on `(stripe_payment_intent_id, affiliate_id)` unique.
 *
 * @param pi Stripe PaymentIntent from `payment_intent.succeeded`.
 */
export async function ingestLifetimePaymentIntent(
  pi: Stripe.PaymentIntent,
): Promise<void> {
  const metadata = pi.metadata ?? {};
  const affiliateId = metadata.affiliate_id;
  const promotionCodeId = metadata.affiliate_promotion_code_id;
  if (!affiliateId || !promotionCodeId) return;
  if ((pi.amount_received ?? 0) <= 0) return;
  if (metadata.purchase_type !== "lifetime") return;

  const supabase = await createSupabaseServiceRole();
  const { data: affiliate } = await supabase
    .from("affiliates")
    .select(
      "id, user_id, stripe_promotion_code_id, commission_rate_subscription, commission_rate_lifetime, recurring_months, status",
    )
    .eq("id", affiliateId)
    .maybeSingle();

  if (!affiliate || affiliate.status !== "active") return;

  const customerId =
    typeof pi.customer === "string" ? pi.customer : pi.customer?.id;
  if (!customerId) return;

  const referredUserId = await findReferredUserId(customerId);
  if (isSelfReferral(affiliate.user_id, referredUserId)) {
    console.warn(
      `[affiliates] Blocking self-referral lifetime commission for affiliate ${affiliate.id}`,
    );
    return;
  }

  const grossCents = pi.amount_received;
  const commissionCents = Math.round(
    grossCents * affiliate.commission_rate_lifetime,
  );

  const chargeId =
    typeof pi.latest_charge === "string"
      ? pi.latest_charge
      : pi.latest_charge?.id;

  const approveAt = new Date(
    Date.now() + REFUND_HOLD_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error } = await supabase.from("affiliate_commissions").insert({
    affiliate_id: affiliate.id,
    referred_customer_id: customerId,
    referred_user_id: referredUserId,
    stripe_promotion_code_id: promotionCodeId,
    stripe_payment_intent_id: pi.id,
    stripe_charge_id: chargeId ?? null,
    product_kind: "lifetime",
    recurring_month_index: null,
    gross_amount_cents: grossCents,
    commission_amount_cents: commissionCents,
    currency: pi.currency,
    status: "pending",
    approve_at: approveAt,
  });

  if (error) {
    if (error.code === "23505") return;
    console.error(
      "[affiliates] lifetime commission insert failed:",
      error,
    );
    return;
  }

  console.log(
    `[affiliates] Inserted lifetime commission ${commissionCents}c for affiliate ${affiliate.id}`,
  );
}

/**
 * @brief Reverse commissions tied to a refunded charge.
 *
 * Looks up commissions by `stripe_charge_id`. Each affected row is:
 *  - voided in place if it's still `pending` or `approved` (no money out the door)
 *  - flagged `refunded` AND a balance adjustment is created to debit the
 *    affiliate's running balance if the commission was already `paid`
 *
 * Idempotent: re-running on the same charge does not double-debit because
 * we skip rows already in `refunded`/`void`.
 *
 * @param chargeId Stripe charge id whose payment was refunded.
 */
export async function reverseCommissionsForCharge(
  chargeId: string,
): Promise<void> {
  const supabase = await createSupabaseServiceRole();
  const { data: affected, error } = await supabase
    .from("affiliate_commissions")
    .select("id, status, commission_amount_cents, affiliate_id")
    .eq("stripe_charge_id", chargeId)
    .in("status", ["pending", "approved", "paid"]);

  if (error) {
    console.error("[affiliates] reverse lookup failed:", error);
    return;
  }
  if (!affected || affected.length === 0) return;

  for (const row of affected) {
    if (row.status === "pending" || row.status === "approved") {
      await supabase
        .from("affiliate_commissions")
        .update({
          status: "void",
          refunded_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      console.log(
        `[affiliates] Voided commission ${row.id} after refund of charge ${chargeId}`,
      );
    } else if (row.status === "paid") {
      // Money has already shipped to the affiliate. Mark refunded and
      // create a debit adjustment that the next payout will net out.
      await supabase
        .from("affiliate_commissions")
        .update({
          status: "refunded",
          refunded_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      await supabase.from("affiliate_balance_adjustments").insert({
        affiliate_id: row.affiliate_id,
        amount_cents: -row.commission_amount_cents,
        reason: `Refund clawback for commission ${row.id} (charge ${chargeId})`,
        related_commission_id: row.id,
      });
      console.log(
        `[affiliates] Recorded clawback adjustment for paid commission ${row.id} after charge ${chargeId} refund`,
      );
    }
  }
}
