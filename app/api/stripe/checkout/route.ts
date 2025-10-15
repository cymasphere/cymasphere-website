import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PlanType } from "@/types/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planType,
      email,
      customerId,
      promotionCode,
      collectPaymentMethod = false,
    }: {
      planType: PlanType;
      email?: string;
      customerId?: string;
      promotionCode?: string;
      collectPaymentMethod?: boolean;
    } = body;

    let resolved_customer_id: string | undefined;

    // If email is provided, find or create customer
    if (!customerId && email) {
      resolved_customer_id = await findOrCreateCustomer(email);
    } else if (customerId) {
      resolved_customer_id = customerId;
    }

    // Create checkout session with or without customer ID
    const result = await createCheckoutSession(
      resolved_customer_id,
      planType,
      promotionCode,
      collectPaymentMethod
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      {
        url: null,
        error:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * Finds or creates a customer in Stripe
 */
async function findOrCreateCustomer(email: string): Promise<string> {
  try {
    // Search for existing customer
    const existingCustomers = await stripe.customers.list({
      email: email,
      limit: 1,
    });

    if (existingCustomers.data.length > 0) {
      return existingCustomers.data[0].id;
    }

    // Create new customer
    const newCustomer = await stripe.customers.create({
      email: email,
    });

    return newCustomer.id;
  } catch (error) {
    console.error("Error finding/creating customer:", error);
    throw error;
  }
}

/**
 * Creates a Stripe checkout session for the selected plan
 */
async function createCheckoutSession(
  customerId: string | undefined,
  planType: PlanType,
  promotionCode?: string,
  collectPaymentMethod: boolean = false
): Promise<{ url: string | null; error?: string }> {
  try {
    // Return error if customer ID is not provided
    if (!customerId) {
      return { url: null, error: "Customer ID is required for checkout" };
    }

    // Get price IDs from environment variables
    const priceIds = {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY!,
      annual: process.env.STRIPE_PRICE_ID_ANNUAL!,
      lifetime: process.env.STRIPE_PRICE_ID_LIFETIME!,
    };

    const priceId = priceIds[planType];
    if (!priceId) {
      return { url: null, error: `Invalid plan type: ${planType}` };
    }

    // Determine mode and setup based on plan type and collectPaymentMethod
    let mode: "subscription" | "payment" | "setup";
    let setupIntentData: any = undefined;
    let subscriptionData: any = undefined;

    if (planType === "lifetime") {
      // Lifetime is a one-time payment
      mode = "payment";
    } else if (collectPaymentMethod) {
      // For trial with payment method collection, use setup mode
      mode = "setup";
      setupIntentData = {
        metadata: {
          plan_type: planType,
          customer_id: customerId,
        },
      };
    } else {
      // Regular subscription mode
      mode = "subscription";
      subscriptionData = {
        trial_period_days: 7, // Default 7-day trial
      };
    }

    // Build session parameters with proper URL fallbacks
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";
    console.log("🔧 Creating checkout session with base URL:", baseUrl);

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      mode,
      success_url: `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout-canceled`,
      metadata: {
        plan_type: planType,
        customer_id: customerId,
        collect_payment_method: collectPaymentMethod.toString(),
      },
    };

    // Add line items for payment and subscription modes
    if (mode === "payment" || mode === "subscription") {
      sessionParams.line_items = [
        {
          price: priceId,
          quantity: 1,
        },
      ];
    }

    // Add subscription data if applicable
    if (subscriptionData) {
      sessionParams.subscription_data = subscriptionData;
    }

    // Add setup intent data if applicable
    if (setupIntentData) {
      sessionParams.setup_intent_data = setupIntentData;
    }

    // Enable entering promotion codes on the Checkout page
    if (mode !== "setup") {
      sessionParams.allow_promotion_codes = true;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    return { url: session.url };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      url: null,
      error:
        error instanceof Error
          ? error.message
          : "Failed to create checkout session",
    };
  }
}
