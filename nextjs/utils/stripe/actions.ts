"use server";

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type CustomerPurchasedProResponse = {
  success: boolean;
  is_pro: boolean;
  is_lifetime: boolean;
  subscription_expires_at?: number; // Unix timestamp when subscription expires
  error?: Error | unknown;
};

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
  promotionCode?: string,
  collectPaymentMethod: boolean = false
): Promise<{ url: string | null; error?: string }> {
  try {
    let customerId: string | undefined;

    // If email is provided, find or create customer
    if (email) {
      customerId = await findOrCreateCustomer(email);
    }

    // Create checkout session with or without customer ID
    return await createCheckoutSession(
      customerId,
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

    console.log(JSON.stringify(promotions));

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
          amount: 999,
          currency: "usd",
          name: "Monthly",
        },
        annual: {
          id: "",
          type: "annual",
          amount: 9999,
          currency: "usd",
          name: "Annual",
        },
        lifetime: {
          id: "",
          type: "lifetime",
          amount: 29999,
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

    // Create checkout session with optional customer ID
    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?checkout=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing?checkout=cancelled`,
      // allow_promotion_codes: true, // Allow manual coupon entry
    };

    // Add customer ID if available
    if (customerId) {
      sessionConfig.customer = customerId;
    } else {
      // For guest checkout, collect customer email
      sessionConfig.customer_creation = "always";
    }

    // Apply promotion code if provided
    if (promotionCode) {
      sessionConfig.discounts = [{ promotion_code: promotionCode }];
    }

    // Add trial period for subscription plans (not applicable to lifetime purchases)
    if (mode === "subscription") {
      // Set up trial configuration
      const basicTrialDays = 14; // 14-day trial by default
      const extendedTrialDays = 21; // 21-day trial with payment method

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

export async function customerPurchasedPro(
  customer_id: string
): Promise<CustomerPurchasedProResponse> {
  try {
    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME!;
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
    const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL!;

    // Check for one-time purchase
    const charges = await stripe.charges.list({
      customer: customer_id,
      limit: 100,
    });

    // Find if any charge contains the one-time purchase product
    let oneTimePurchase = false;

    for (const charge of charges.data) {
      // Check if this charge is for the one-time purchase product
      if (charge.metadata && charge.metadata.price_id === lifetimePriceId) {
        if (charge.refunded) {
          break;
        } else {
          oneTimePurchase = true;
          break;
        }
      }
    }

    if (oneTimePurchase) {
      return { success: true, is_pro: true, is_lifetime: true };
    }

    // Check for subscription purchases
    const subscriptions = await stripe.subscriptions.list({
      customer: customer_id,
      status: "active",
    });

    // Find if any subscription contains either of the subscription products
    let hasActiveSubscription = false;
    let expirationTimestamp: number | undefined;

    for (const subscription of subscriptions.data) {
      // Check if this subscription contains one of our products
      for (const item of subscription.items.data) {
        const priceId = item.price.id;
        if (priceId === monthlyPriceId || priceId === annualPriceId) {
          hasActiveSubscription = true;
          expirationTimestamp = subscription.current_period_end;
          break;
        }
      }
      if (hasActiveSubscription) break;
    }

    return {
      success: true,
      is_pro: hasActiveSubscription,
      is_lifetime: false,
      subscription_expires_at: expirationTimestamp,
    };
  } catch (error) {
    return {
      success: false,
      is_pro: false,
      is_lifetime: false,
      error,
    };
  }
}
