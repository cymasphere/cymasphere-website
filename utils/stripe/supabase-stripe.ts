"use server";

import { SubscriptionType } from "@/utils/supabase/types";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { cancelSubscription } from "./actions";
import Stripe from "stripe";

export type CustomerPurchasedProResponse = {
  success: boolean;
  subscription: SubscriptionType;
  trial_end_date?: Date;
  subscription_expiration?: Date;
  error?: Error | unknown;
};

// Type for Stripe metadata and nested properties
type StripeSubscriptionAttrs = {
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

    // First check for lifetime purchase directly from payment intents
    const { data: paymentIntents, error: piError } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_payment_intents")
      .select("*")
      .eq("customer", customer_id)
      .order("created", { ascending: false });

    if (piError) {
      console.error("Error querying payment intents:", piError);
      return {
        success: false,
        subscription: "none",
        error: piError,
      };
    }

    // Check payment intents for lifetime purchase
    for (const paymentIntent of paymentIntents) {
      const attrs =
        ((paymentIntent as any).attrs as {
          metadata?: { purchase_type?: string };
          status?: string;
          dispute?: unknown | null;
          refunded?: boolean;
        }) || {};

      if (attrs?.metadata?.purchase_type === "lifetime") {
        // If this is a lifetime purchase, check its status
        if (attrs.status === "succeeded" && !attrs.dispute && !attrs.refunded) {
          hasLifetime = true;
          subscriptionType = "lifetime";
        } else {
          // If this lifetime purchase was refunded or disputed, they no longer have lifetime access
          hasLifetime = false;
        }
      }
    }

    // Check for active subscriptions (even if we found a lifetime purchase)
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_subscriptions")
      .select("*")
      .eq("customer", customer_id)
      .order("current_period_end", { ascending: false });

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
      const attrs = (subscription as any).attrs as StripeSubscriptionAttrs | null;

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
          activeSubscriptionId = (subscription as any).id || undefined;

          // Set expiration date
          if ((subscription as any).current_period_end) {
            current_period_end = new Date((subscription as any).current_period_end);
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

/**
 * Interface for invoice data returned from the Supabase Stripe tables
 */
export interface InvoiceData {
  id: string;
  number?: string;
  amount: number;
  status: string;
  created: string;
  currency: string;
  pdf_url?: string;
  receipt_url?: string;
}

/**
 * Fetches invoice history for a customer from the Supabase Stripe tables
 * @param customerId The Stripe customer ID to fetch invoices for
 * @param limit Number of invoices to return (default: 10)
 */
export async function getCustomerInvoices(
  customerId: string | null,
  limit: number = 10
): Promise<{ invoices: InvoiceData[]; error: string | null }> {
  try {
    if (!customerId) {
      return { invoices: [], error: "No customer ID provided" };
    }

    // Create Supabase service role client to access the stripe_tables schema
    const { createSupabaseServiceRole } = await import(
      "@/utils/supabase/service"
    );
    const supabase = await createSupabaseServiceRole();

    // Query the stripe_invoices table for invoices belonging to this customer
    const { data, error } = await supabase
      .schema("stripe_tables" as any)
      .from("stripe_invoices")
      .select("*")
      .eq("customer", customerId)
      .order("period_end", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Error querying stripe_invoices:", error);
      return { invoices: [], error: error.message };
    }

    // Format the invoice data for the UI
    const invoices: InvoiceData[] = (data || []).map((invoice) => {
      const attrs = (invoice as any).attrs as {
        hosted_invoice_url?: string;
        invoice_pdf?: string;
        created?: number;
        number?: string;
      } | null;

      return {
        id: String((invoice as any).id || ""),
        number: attrs?.number,
        amount: ((invoice as any).total || 0) / 100, // Convert cents to dollars
        status: (invoice as any).status || "unknown",
        created: new Date(
          attrs?.created ? attrs.created * 1000 : Date.now()
        ).toISOString(),
        currency: (invoice as any).currency || "usd",
        pdf_url: attrs?.invoice_pdf,
        receipt_url: attrs?.hosted_invoice_url,
      };
    });

    return { invoices, error: null };
  } catch (error: unknown) {
    console.error("Error fetching customer invoices:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { invoices: [], error: errorMessage };
  }
}

/**
 * Deletes a user account by first canceling any active subscriptions,
 * then deleting their Supabase user account
 */
export async function deleteUserAccount(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  "use server";

  try {
    // Get the Stripe customer ID for this user
    const supabase = await createSupabaseServiceRole();

    // First, get the Stripe customer ID from the profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", userId)
      .single();

    if (profileError) {
      console.error("Error fetching profile:", profileError);
      return { success: false, error: "Could not find user profile" };
    }

    const stripeCustomerId = profile?.customer_id;

    if (stripeCustomerId) {
      // Get Stripe instance
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

      try {
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: stripeCustomerId,
          status: "all",
        });

        // Cancel all subscriptions that aren't already canceled
        for (const subscription of subscriptions.data) {
          if (subscription.status !== "canceled") {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(
              `Canceled subscription: ${subscription.id} for customer: ${stripeCustomerId}`
            );
          }
        }
      } catch (stripeError) {
        console.error("Error canceling subscriptions:", stripeError);
        // Do not continue with user deletion if subscription cancellation fails
        return {
          success: false,
          error: "Failed to cancel subscription. Account deletion aborted.",
        };
      }
    }

    // Delete the user from Supabase
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      return { success: false, error: "Failed to delete user account" };
    }

    return { success: true };
  } catch (error) {
    console.error("Error in deleteUserAccount:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
