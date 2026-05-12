import "server-only";

import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type InvoiceWithStripeCompat = Stripe.Invoice & {
  subscription?: string | Stripe.Subscription | null;
};

function getPriceIdFromLine(line: Stripe.InvoiceLineItem): string | null {
  const pricingPrice = line.pricing?.price_details?.price;
  if (typeof pricingPrice === "string") return pricingPrice;
  if (pricingPrice && typeof pricingPrice === "object" && "id" in pricingPrice) {
    return (pricingPrice as { id?: string }).id ?? null;
  }
  const legacyPrice = (line as { price?: { id?: string } }).price;
  return legacyPrice?.id ?? null;
}

function extractSubscriptionId(invoice: InvoiceWithStripeCompat): string | null {
  if (typeof invoice.subscription === "string") return invoice.subscription;
  if (invoice.subscription && typeof invoice.subscription === "object") {
    return invoice.subscription.id ?? null;
  }
  return null;
}

function invoiceContainsRentToOwnPrice(invoice: InvoiceWithStripeCompat): boolean {
  const rentToOwnPriceId = process.env.STRIPE_PRICE_ID_RENT_TO_OWN?.trim();
  if (!rentToOwnPriceId) return false;
  return (invoice.lines?.data ?? []).some(
    (line) => getPriceIdFromLine(line) === rentToOwnPriceId,
  );
}

async function getLifetimeTargetSnapshot(): Promise<{
  targetCents: number;
  currency: string;
}> {
  const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME?.trim();
  if (!lifetimePriceId) {
    throw new Error("STRIPE_PRICE_ID_LIFETIME is not configured.");
  }
  const lifetimePrice = await stripe.prices.retrieve(lifetimePriceId);
  const targetCents = lifetimePrice.unit_amount ?? 0;
  if (targetCents <= 0) {
    throw new Error("Lifetime price must be a positive amount.");
  }
  return {
    targetCents,
    currency: lifetimePrice.currency ?? "usd",
  };
}

export async function ensureRentToOwnProgress(
  userId: string,
  opts?: { activeSubscriptionId?: string | null },
): Promise<void> {
  const supabase = await createSupabaseServiceRole();
  const { data: existing } = await supabase
    .from("rent_to_own_progress")
    .select("user_id, started_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("rent_to_own_progress")
      .update({
        ...(opts?.activeSubscriptionId
          ? { active_subscription_id: opts.activeSubscriptionId }
          : {}),
        ...(existing.started_at ? {} : { started_at: new Date().toISOString() }),
      })
      .eq("user_id", userId);
    return;
  }

  const snapshot = await getLifetimeTargetSnapshot();
  await supabase.from("rent_to_own_progress").insert({
    user_id: userId,
    target_cents: snapshot.targetCents,
    paid_cents: 0,
    currency: snapshot.currency,
    active_subscription_id: opts?.activeSubscriptionId ?? null,
    started_at: new Date().toISOString(),
  });
}

export async function applyRentToOwnPayment(
  invoice: InvoiceWithStripeCompat,
  userId: string,
): Promise<{ completed: boolean }> {
  if (!invoice.id || !invoiceContainsRentToOwnPrice(invoice)) {
    return { completed: false };
  }

  const amountPaid = invoice.amount_paid ?? 0;
  if (amountPaid <= 0) {
    return { completed: false };
  }

  const stripeSubscriptionId = extractSubscriptionId(invoice);
  const invoiceCurrency = invoice.currency ?? "usd";

  await ensureRentToOwnProgress(userId, {
    activeSubscriptionId: stripeSubscriptionId,
  });

  const supabase = await createSupabaseServiceRole();
  const { error: paymentInsertError } = await supabase
    .from("rent_to_own_payments")
    .insert({
      user_id: userId,
      stripe_invoice_id: invoice.id,
      stripe_subscription_id: stripeSubscriptionId,
      amount_cents: amountPaid,
      currency: invoiceCurrency,
    });

  if (paymentInsertError) {
    if (paymentInsertError.code === "23505") {
      return { completed: false };
    }
    throw paymentInsertError;
  }

  const { data: progress } = await supabase
    .from("rent_to_own_progress")
    .select("paid_cents, target_cents, completed_at")
    .eq("user_id", userId)
    .single();

  const nextPaid = (progress?.paid_cents ?? 0) + amountPaid;
  const target = progress?.target_cents ?? 0;

  const reachedTarget = target > 0 && nextPaid >= target;
  const nowIso = new Date().toISOString();

  await supabase
    .from("rent_to_own_progress")
    .update({
      paid_cents: nextPaid,
      active_subscription_id: reachedTarget ? null : stripeSubscriptionId,
      ...(reachedTarget && !progress?.completed_at
        ? { completed_at: nowIso }
        : {}),
    })
    .eq("user_id", userId);

  if (reachedTarget && !progress?.completed_at) {
    if (stripeSubscriptionId) {
      await stripe.subscriptions.cancel(stripeSubscriptionId, {
        invoice_now: false,
        prorate: false,
      });
    }
    await supabase
      .from("profiles")
      .update({ subscription: "lifetime" })
      .eq("id", userId);
    return { completed: true };
  }

  return { completed: false };
}

export async function getRentToOwnProgress(userId: string): Promise<{
  targetCents: number;
  paidCents: number;
  remainingCents: number;
  completed: boolean;
  currency: string;
} | null> {
  const supabase = await createSupabaseServiceRole();
  const { data } = await supabase
    .from("rent_to_own_progress")
    .select("target_cents, paid_cents, completed_at, currency")
    .eq("user_id", userId)
    .maybeSingle();

  if (!data) return null;
  const remainingCents = Math.max(0, data.target_cents - data.paid_cents);
  return {
    targetCents: data.target_cents,
    paidCents: data.paid_cents,
    remainingCents,
    completed: Boolean(data.completed_at),
    currency: data.currency,
  };
}
