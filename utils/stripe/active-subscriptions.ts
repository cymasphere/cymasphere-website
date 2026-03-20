/**
 * @fileoverview Helpers to list a Stripe customer’s active and trialing subscriptions consistently.
 * @module utils/stripe/active-subscriptions
 *
 * @note Used by billing payment-method routes so “primary” subscription order matches between
 * read (default PM) and write (set default PM).
 */

import Stripe from "stripe";

/** @note Stripe instance type for subscription list/update calls. */
type StripeClient = Pick<Stripe, "subscriptions">;

/**
 * @brief Reads current_period_end from a subscription (Stripe typings may omit it on some API versions).
 * @param sub Stripe subscription object
 * @returns Unix seconds of period end, or 0 if missing
 */
function currentPeriodEndUnix(sub: Stripe.Subscription): number {
  const v = (sub as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  return typeof v === "number" ? v : 0;
}

/**
 * @brief Lists active ∪ trialing subscriptions for a customer, de-duplicated, newest period first.
 * @param stripe Initialized Stripe client
 * @param customerId Stripe customer id
 * @returns Sorted subscription array (may be empty)
 */
export async function listActiveTrialingSubscriptionsNewestFirst(
  stripe: StripeClient,
  customerId: string,
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 100,
  });
  const trialing = await stripe.subscriptions.list({
    customer: customerId,
    status: "trialing",
    limit: 100,
  });
  const merged = [
    ...subscriptions.data,
    ...trialing.data.filter(
      (s) => !subscriptions.data.some((a) => a.id === s.id),
    ),
  ];
  merged.sort((a, b) => currentPeriodEndUnix(b) - currentPeriodEndUnix(a));
  return merged;
}
