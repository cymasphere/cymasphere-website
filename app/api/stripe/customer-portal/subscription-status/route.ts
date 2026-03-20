/**
 * @fileoverview Returns the signed-in user’s active or trialing Stripe subscription flags for billing UI.
 * @module api/stripe/customer-portal/subscription-status
 *
 * Uses the same active/trialing merge logic as cancel-subscription and reactivate-subscription
 * routes so the dashboard
 * can show “cancel at period end” and hide cancel when no recurring subscription exists.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/** @brief Serializable subscription snapshot for billing (non-sensitive). */
export type BillingStripeSubscriptionSnapshot = {
  id: string;
  status: Stripe.Subscription.Status;
  cancelAtPeriodEnd: boolean;
  /** @note ISO 8601 end of current billing period (from Stripe). */
  currentPeriodEnd: string | null;
};

/**
 * @brief Picks the same primary subscription as cancel/reactivate (active ∪ trialing, first match).
 * @param customerId Stripe customer id
 * @returns The merged primary subscription or null
 */
async function getPrimaryActiveOrTrialingSubscription(
  customerId: string,
): Promise<Stripe.Subscription | null> {
  const active = await stripe.subscriptions.list({
    customer: customerId,
    status: "active",
    limit: 5,
  });
  const trialing = await stripe.subscriptions.list({
    customer: customerId,
    status: "trialing",
    limit: 5,
  });
  const activeOrTrialing = [
    ...active.data,
    ...trialing.data.filter(
      (s) => !active.data.some((a) => a.id === s.id),
    ),
  ];
  return activeOrTrialing[0] ?? null;
}

/**
 * @brief GET: active/trialing subscription summary for billing actions.
 *
 * @returns **200** `{ success: true, subscription: BillingStripeSubscriptionSnapshot | null }`
 * @returns **401** when not signed in
 * @returns **400** when profile has no `customer_id`
 * @returns **503** when Stripe is not configured
 *
 * @example
 * ```json
 * { "success": true, "subscription": { "id": "sub_123", "status": "active", "cancelAtPeriodEnd": true, "currentPeriodEnd": "2025-04-01T00:00:00.000Z" } }
 * ```
 */
export async function GET(_request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const clientIp = getClientIp(_request);
    if (!checkRateLimit(clientIp, 30, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.customer_id as string | null;
    if (!customerId) {
      return NextResponse.json(
        { success: true, subscription: null },
        { status: 200 },
      );
    }

    const sub = await getPrimaryActiveOrTrialingSubscription(customerId);
    if (!sub) {
      return NextResponse.json(
        { success: true, subscription: null },
        { status: 200 },
      );
    }

    const subWithPeriod = sub as Stripe.Subscription & {
      current_period_end?: number;
    };
    const periodEndUnix = subWithPeriod.current_period_end;
    const snapshot: BillingStripeSubscriptionSnapshot = {
      id: sub.id,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end === true,
      currentPeriodEnd:
        typeof periodEndUnix === "number"
          ? new Date(periodEndUnix * 1000).toISOString()
          : null,
    };

    return NextResponse.json(
      { success: true, subscription: snapshot },
      { status: 200 },
    );
  } catch (error) {
    console.error("Subscription status error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to load subscription";
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
