"use server";

import { SubscriptionType } from "@/utils/supabase/types";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { cancelSubscription } from "./actions";

export type CustomerPurchasedProResponse = {
  success: boolean;
  subscription: SubscriptionType;
  trial_end_date?: Date;
  subscription_expiration?: Date;
  error?: Error | unknown;
};

// Type for Stripe metadata and nested properties
type StripeAttrs = {
  metadata?: { price_id?: string };
  refunded?: boolean;
  status?:
    | "incomplete"
    | "incomplete_expired"
    | "trialing"
    | "active"
    | "past_due"
    | "canceled"
    | "unpaid"
    | "paused";
  items?: { data?: Array<{ price?: { id?: string } }> };
  trial_end?: number;
};

/**
 * Checks if a customer has purchased a pro subscription
 * by querying the Supabase Stripe tables
 */
export async function customerPurchasedProFromSupabase(
  customer_id: string
): Promise<CustomerPurchasedProResponse> {
  try {
    const supabase = await createSupabaseServiceRole();
    let subscriptionType: SubscriptionType = "none";
    let current_period_end: Date | undefined;
    let trial_end_date: Date | undefined;
    let hasLifetime = false;
    let activeSubscriptionId: string | undefined;

    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME!;

    // First check for lifetime purchase
    // Check charges for one-time lifetime purchase
    const { data: charges, error: chargesError } = await supabase
      .schema("stripe_tables")
      .from("stripe_charges")
      .select("*")
      .eq("customer", customer_id)
      .eq("status", "succeeded")
      .order("created", { ascending: false })
      .limit(100);

    console.log("charges", charges);

    if (chargesError) {
      console.error("Error querying stripe_charges:", chargesError);
      return {
        success: false,
        subscription: "none",
        error: chargesError,
      };
    }

    // Look for lifetime purchase in charges
    for (const charge of charges || []) {
      const attrs = charge.attrs as StripeAttrs | null;
      if (attrs?.metadata?.price_id === lifetimePriceId && !attrs.refunded) {
        hasLifetime = true;
        subscriptionType = "lifetime";
        break;
      }
    }

    // Check for active subscriptions (even if we found a lifetime purchase)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .schema("stripe_tables")
      .from("stripe_subscriptions")
      .select("*")
      .eq("customer", customer_id)
      .order("current_period_end", { ascending: false });

    console.log("subscriptions", subscriptions);

    if (subscriptionsError) {
      console.error("Error querying stripe_subscriptions:", subscriptionsError);
      return {
        success: false,
        subscription: "none",
        error: subscriptionsError,
      };
    }

    // Get subscription details from the subscriptions
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
    const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL!;

    let hasActiveSubscription = false;
    let activeSubscriptionType: "monthly" | "annual" | undefined;

    for (const subscription of subscriptions || []) {
      // Skip canceled or incomplete subscriptions
      const attrs = subscription.attrs as StripeAttrs | null;

      switch (attrs?.status) {
        case "active":
        case "trialing":
        case "past_due":
          break;
        default:
          continue;
      }

      // Check subscription items
      const items = attrs?.items?.data || [];
      for (const item of items) {
        const priceId = item.price?.id;
        if (priceId === monthlyPriceId || priceId === annualPriceId) {
          // Consider active subscriptions - those that are active, trialing, or past_due
          // These are statuses where the customer still has access to the service
          hasActiveSubscription = true;
          activeSubscriptionType =
            priceId === monthlyPriceId ? "monthly" : "annual";
          activeSubscriptionId = subscription.id || undefined;

          // Set expiration date
          if (subscription.current_period_end) {
            current_period_end = new Date(subscription.current_period_end);
          }

          // Check for trial end date
          const trialEnd = attrs?.trial_end;
          if (trialEnd) {
            trial_end_date = new Date(trialEnd * 1000);
          }

          break;
        }
      }

      if (hasActiveSubscription) break;
    }

    // If the user has both lifetime and an active subscription, we should cancel the subscription
    if (hasLifetime && hasActiveSubscription && activeSubscriptionId) {
      // Initiate subscription cancellation process
      await cancelSubscription(customer_id, activeSubscriptionId);
    }

    // If user has lifetime, that takes precedence over any subscription
    if (hasLifetime) {
      subscriptionType = "lifetime";
    }
    // Otherwise, use the active subscription type if any
    else if (hasActiveSubscription && activeSubscriptionType) {
      subscriptionType = activeSubscriptionType;
    }

    return {
      success: true,
      subscription: subscriptionType,
      trial_end_date,
      subscription_expiration: current_period_end,
    };
  } catch (error) {
    console.error("Error checking customer subscription:", error);
    return {
      success: false,
      subscription: "none",
      error,
    };
  }
}
