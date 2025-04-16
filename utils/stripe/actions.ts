"use server";

import Stripe from "stripe";
import { SubscriptionType } from "@/utils/supabase/types";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type PlanType = "monthly" | "annual" | "lifetime";

export interface PriceData {
  id: string;
  type: PlanType;
  amount: number;
  currency: string;
  interval?: string;
  name: string;
  discount?: {
    percent_off?: number;
    amount_off?: number;
    currency?: string;
    name: string;
    id: string;
    promotion_code?: string; // Promotion code ID to apply in checkout
    promotion_display?: string; // Promotion display name to show to the user
  };
}

/**
 * Server action to initiate checkout process
 * @param planType The selected plan type
 * @param email Optional user email
 * @param promotionCode Optional promotion code to apply
 * @param collectPaymentMethod Whether to collect payment method during checkout (extends trial)
 */
export async function initiateCheckout(
  planType: PlanType,
  email?: string,
  customerId?: string,
  promotionCode?: string,
  collectPaymentMethod: boolean = false
): Promise<{ url: string | null; error?: string }> {
  try {
    let resolved_customer_id: string | undefined;

    // If email is provided, find or create customer
    if (!customerId && email) {
      resolved_customer_id = await findOrCreateCustomer(email);
    } else if (customerId) {
      resolved_customer_id = customerId;
    }
    // Create checkout session with or without customer ID
    return await createCheckoutSession(
      resolved_customer_id,
      planType,
      promotionCode,
      collectPaymentMethod
    );
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Fetches all plan prices for the product
 * @returns Object containing the prices for each plan type
 */
export async function getPrices(): Promise<{
  prices: Record<PlanType, PriceData>;
  error?: string;
}> {
  try {
    // Get the price IDs from environment variables
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
    const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL!;
    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME!;

    // Fetch prices from Stripe
    const [monthlyPrice, annualPrice, lifetimePrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId, { expand: ["product"] }),
      stripe.prices.retrieve(annualPriceId, { expand: ["product"] }),
      stripe.prices.retrieve(lifetimePriceId, { expand: ["product"] }),
    ]);

    // Fetch active promotions/coupons
    const promotions = await stripe.promotionCodes.list({
      active: true,
      limit: 10,
      expand: ["data.coupon"],
    });

    // console.log(JSON.stringify(promotions));

    // Find the best applicable discount
    // Get the first active promotion with the highest percent_off or amount_off
    const getActivePromotion = () => {
      if (!promotions.data.length) return undefined;

      // Sort by percent_off (descending), then by amount_off (descending)
      const sortedPromotions = [...promotions.data].sort((a, b) => {
        // Compare percent_off first (higher is better)
        const percentOffA = a.coupon?.percent_off || 0;
        const percentOffB = b.coupon?.percent_off || 0;
        if (percentOffA !== percentOffB) {
          return percentOffB - percentOffA;
        }

        // If percent_off is the same, compare amount_off
        const amountOffA = a.coupon?.amount_off || 0;
        const amountOffB = b.coupon?.amount_off || 0;
        return amountOffB - amountOffA;
      });

      // Return the best promotion
      const bestPromotion = sortedPromotions[0];
      if (!bestPromotion || !bestPromotion.coupon) return undefined;

      return {
        id: bestPromotion.id,
        name: bestPromotion.coupon.name || "Special Offer",
        percent_off: bestPromotion.coupon.percent_off || undefined,
        amount_off: bestPromotion.coupon.amount_off || undefined,
        currency: bestPromotion.coupon.currency || undefined,
        promotion_code: bestPromotion.id, // Save promotion code ID
        promotion_display: bestPromotion.coupon.name || "Special Offer",
      };
    };

    // Get the best active promotion
    const activePromotion = getActivePromotion();

    // Get product name
    const productName =
      (monthlyPrice.product as Stripe.Product).name || "Pro Plan";

    // Format response
    const prices: Record<PlanType, PriceData> = {
      monthly: {
        id: monthlyPrice.id,
        type: "monthly",
        amount: monthlyPrice.unit_amount || 0,
        currency: monthlyPrice.currency,
        interval: monthlyPrice.recurring?.interval,
        name: `${productName} (Monthly)`,
        discount: activePromotion,
      },
      annual: {
        id: annualPrice.id,
        type: "annual",
        amount: annualPrice.unit_amount || 0,
        currency: annualPrice.currency,
        interval: annualPrice.recurring?.interval,
        name: `${productName} (Annual)`,
        discount: activePromotion,
      },
      lifetime: {
        id: lifetimePrice.id,
        type: "lifetime",
        amount: lifetimePrice.unit_amount || 0,
        currency: lifetimePrice.currency,
        name: `${productName} (Lifetime)`,
        discount: activePromotion,
      },
    };

    return { prices };
  } catch (error) {
    console.error("Error fetching prices:", error);
    return {
      prices: {
        monthly: {
          id: "",
          type: "monthly",
          amount: 8,
          currency: "usd",
          name: "Monthly",
        },
        annual: {
          id: "",
          type: "annual",
          amount: 69,
          currency: "usd",
          name: "Annual",
        },
        lifetime: {
          id: "",
          type: "lifetime",
          amount: 150,
          currency: "usd",
          name: "Lifetime",
        },
      },
      error: error instanceof Error ? error.message : "Failed to fetch prices",
    };
  }
}

/**
 * Creates a Stripe checkout session for the selected plan
 * @param customerId Optional Stripe customer ID
 * @param planType The selected plan type (monthly, annual or lifetime)
 * @param promotionCode Optional promotion code to apply
 * @param collectPaymentMethod Whether to collect payment method during checkout (extends trial)
 * @returns Checkout session URL
 */
export async function createCheckoutSession(
  customerId: string | undefined,
  planType: PlanType,
  promotionCode?: string,
  collectPaymentMethod: boolean = false
): Promise<{ url: string | null; error?: string }> {
  try {
    let priceId: string;
    let mode: "payment" | "subscription";

    // Choose the correct price ID based on plan type
    switch (planType) {
      case "monthly":
        priceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
        mode = "subscription";
        break;
      case "annual":
        priceId = process.env.STRIPE_PRICE_ID_ANNUAL!;
        mode = "subscription";
        break;
      case "lifetime":
        priceId = process.env.STRIPE_PRICE_ID_LIFETIME!;
        mode = "payment";
        break;
      default:
        throw new Error("Invalid plan type");
    }

    const return_url = `${process.env.NEXT_PUBLIC_SITE_URL}/api/checkout-result?session_id={CHECKOUT_SESSION_ID}`;
    // Create checkout session with optional customer ID
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: return_url,
      cancel_url: return_url,
      // allow_promotion_codes: true, // Allow manual coupon entry
    };

    // Add customer ID if available
    if (customerId) {
      sessionConfig.customer = customerId;
    }

    // Apply promotion code if provided
    if (promotionCode) {
      sessionConfig.discounts = [{ promotion_code: promotionCode }];
    } else {
      sessionConfig.allow_promotion_codes = true;
    }

    // Set up trial configuration with different durations
    const basicTrialDays = 7; // 7-day trial when not collecting payment info
    const extendedTrialDays = 14; // 14-day trial when collecting payment info

    // Add trial period for subscription plans (not applicable to lifetime purchases)
    if (mode === "subscription") {
      if (collectPaymentMethod) {
        // If collecting payment method, provide extended trial
        sessionConfig.subscription_data = {
          trial_period_days: extendedTrialDays,
        };
        // Always collect payment method
        sessionConfig.payment_method_collection = "always";
      } else {
        // Basic trial without requiring payment method
        sessionConfig.subscription_data = {
          trial_period_days: basicTrialDays,
        };
        // Make payment method optional
        sessionConfig.payment_method_collection = "if_required";
      }
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return { url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      url: null,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}

/**
 * Finds a customer by email or creates a new one if not found
 * @param email Customer email to search for
 * @returns The customer ID
 */
export async function findOrCreateCustomer(email: string): Promise<string> {
  try {
    // Search for existing customers with this email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    // If a customer exists, return their ID
    if (customers.data.length > 0) {
      return customers.data[0].id;
    }

    // Otherwise create a new customer
    const customer = await stripe.customers.create({
      email,
    });

    return customer.id;
  } catch (error) {
    console.error("Error finding or creating customer:", error);
    throw error;
  }
}

export type CustomerPurchasedProResponse = {
  success: boolean;
  subscription: SubscriptionType;
  trial_end_date?: Date; // Unix timestamp when trial ends
  subscription_expiration?: Date; // Unix timestamp when subscription expires
  error?: Error | unknown;
};

export async function cancelSubscription(
  customerId: string,
  subscriptionId: string
): Promise<{ success: boolean; error?: Error | unknown }> {
  try {
    console.log(
      `Cancelling subscription ${subscriptionId} for customer ${customerId} who upgraded to lifetime`
    );

    // Cancel the subscription immediately
    await stripe.subscriptions.cancel(subscriptionId, {
      invoice_now: false, // Don't generate a final invoice
      prorate: false, // Prorate any unused time
    });

    console.log(`Successfully cancelled subscription ${subscriptionId}`);
    return { success: true };
  } catch (error) {
    console.error(`Failed to cancel subscription ${subscriptionId}:`, error);
    return { success: false, error: error as Error };
  }
}

/**
 * Fetches the result of a checkout session by ID
 * @param sessionId The Stripe checkout session ID
 * @returns Session details including status, subscription, and customer info
 */
export async function getCheckoutSessionResult(sessionId: string): Promise<{
  success: boolean;
  status: string;
  customerId?: string;
  customerEmail?: string;
  subscriptionId?: string;
  paymentStatus?: string;
  mode?: string;
  hasTrialPeriod?: boolean;
  subscription?: Stripe.Subscription | string;
  error?: string;
}> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "subscription", "payment_intent"],
    });

    // Handle the customer field which can be string ID or expanded Customer object
    let customerId: string | undefined;
    let customerEmail: string | undefined;

    if (session.customer) {
      if (typeof session.customer === "string") {
        customerId = session.customer;
      } else if ("id" in session.customer) {
        customerId = session.customer.id;
        // Only access email if it's a full Customer object (not DeletedCustomer)
        if (!session.customer.deleted && "email" in session.customer) {
          customerEmail = session.customer.email || undefined;
        }
      }
    }

    // Handle subscription field
    let subscriptionId: string | undefined;
    let hasTrialPeriod: boolean = false;
    let subscription: Stripe.Subscription | string | undefined = undefined;
    
    if (session.subscription) {
      subscription = session.subscription;
      subscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
          
      // Check if the subscription includes a trial period
      if (typeof session.subscription !== "string") {
        hasTrialPeriod = !!session.subscription.trial_end;
      }
    }

    // Handle payment_intent field
    let paymentStatus: string | undefined;
    if (session.payment_intent && typeof session.payment_intent !== "string") {
      paymentStatus = session.payment_intent.status;
    }

    return {
      success: true,
      status: session.status || "unknown",
      customerId,
      customerEmail,
      subscriptionId,
      paymentStatus,
      mode: session.mode || undefined,
      hasTrialPeriod,
      subscription,
    };
  } catch (error) {
    console.error("Error fetching checkout session:", error);
    return {
      success: false,
      status: "error",
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Gets the upcoming invoice for a customer to show accurate first charge amount
 */
export async function getUpcomingInvoice(customerId: string | null) {
  try {
    if (!customerId) {
      return { amount: null, error: "No customer ID provided" };
    }

    const upcomingInvoice = await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });

    return {
      amount: upcomingInvoice.amount_due / 100,
      error: null,
      due_date: upcomingInvoice.due_date
        ? new Date(upcomingInvoice.due_date * 1000)
        : null,
    };
  } catch (error: unknown) {
    console.error("Error fetching upcoming invoice:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { amount: null, error: errorMessage };
  }
}

/**
 * Updates a customer's subscription to a new plan type
 * @param customerId The Stripe customer ID
 * @param planType The new plan type to change to (monthly or annual only)
 * @returns Object indicating success and any errors
 */
export async function updateSubscription(
  customerId: string,
  planType: "monthly" | "annual"
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!customerId) {
      return { success: false, error: "Missing customer ID" };
    }

    // Get price ID for the new plan
    let priceId: string;
    switch (planType) {
      case "monthly":
        priceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
        break;
      case "annual":
        priceId = process.env.STRIPE_PRICE_ID_ANNUAL!;
        break;
      default:
        return {
          success: false,
          error: "Invalid plan type for subscription update",
        };
    }

    // Find the customer's active subscriptions
    const active_sub = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 1,
    });
    const trialing_sub = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 1,
    });

    if (!active_sub.data.length && !trialing_sub.data.length) {
      return { success: false, error: "No active subscription found" };
    }

    const subscription = active_sub.data.length
      ? active_sub.data[0]
      : trialing_sub.data[0];

    const subscriptionId = subscription.id;

    const updateParams: Stripe.SubscriptionUpdateParams = {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
    };

    await stripe.subscriptions.update(subscriptionId, updateParams);

    return { success: true };
  } catch (error) {
    console.error("Error updating subscription:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unexpected error occurred",
    };
  }
}

/**
 * Checks if a Stripe customer with the given email exists and has prior transactions or active subscriptions
 * @param email Customer email to check
 * @returns Object indicating if customer exists, has prior transactions, and has an active subscription
 */
export async function checkExistingCustomer(email: string): Promise<{ 
  exists: boolean; 
  hasPriorTransactions: boolean;
  hasActiveSubscription: boolean; 
  error?: string 
}> {
  try {
    // Search for existing customers with this email
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    // If no customer exists, return false for all flags
    if (customers.data.length === 0) {
      return { exists: false, hasPriorTransactions: false, hasActiveSubscription: false };
    }

    const customerId = customers.data[0].id;

    // Get customer's subscriptions to check if they're already subscribed
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    // Check for any payments (invoice or charge history)
    const charges = await stripe.charges.list({
      customer: customerId,
      limit: 10,
    });

    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit: 10
    });

    // Check if customer has any prior transactions (completed charges or paid invoices)
    const hasPriorTransactions = 
      charges.data.some(charge => charge.paid) || 
      invoices.data.some(invoice => invoice.paid) ||
      subscriptions.data.some(sub => sub.status === 'trialing' || sub.status === 'active' || sub.status === 'past_due');

    // Check if they have an active subscription
    const hasActiveSubscription = 
      subscriptions.data.some(sub => sub.status === 'active' || sub.status === 'trialing');

    // Return the customer status information
    return {
      exists: true,
      hasPriorTransactions,
      hasActiveSubscription
    };
  } catch (error) {
    console.error("Error checking existing customer:", error);
    return { 
      exists: false, 
      hasPriorTransactions: false,
      hasActiveSubscription: false, 
      error: error instanceof Error ? error.message : "An unexpected error occurred" 
    };
  }
}
