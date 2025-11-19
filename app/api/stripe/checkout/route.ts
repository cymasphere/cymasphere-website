import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PlanType } from "@/types/stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { randomUUID } from "crypto";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * Map price_id to plan name for Meta tracking
 * Returns format: monthly_6, annual_59, lifetime_149
 */
async function getPlanName(priceId: string, planType: PlanType): Promise<string> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    const amount = (price.unit_amount || 0) / 100; // Convert cents to dollars
    
    if (planType === "monthly") {
      return `monthly_${amount}`;
    } else if (planType === "annual") {
      return `annual_${amount}`;
    } else if (planType === "lifetime") {
      return `lifetime_${amount}`;
    }
    
    return `${planType}_${amount}`;
  } catch (error) {
    console.error("Error fetching price for plan name:", error);
    return `${planType}_unknown`;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      planType,
      email,
      customerId,
      collectPaymentMethod = false,
    }: {
      planType: PlanType;
      email?: string;
      customerId?: string;
      collectPaymentMethod?: boolean;
    } = body;

    let resolved_customer_id: string | undefined;
    let needsDatabaseUpdate = false;

    // If email is provided, find or create customer
    if (!customerId && email) {
      resolved_customer_id = await findOrCreateCustomer(email);
    } else if (customerId) {
      // Validate that the customer exists in Stripe
      try {
        await stripe.customers.retrieve(customerId);
        resolved_customer_id = customerId;
      } catch (error: any) {
        // Customer doesn't exist in Stripe, try to find/create using email
        console.warn(`Customer ${customerId} not found in Stripe, attempting to find/create using email`);
        if (email) {
          resolved_customer_id = await findOrCreateCustomer(email);
          console.log(`Found/created customer using email: ${resolved_customer_id}`);
          // Mark that we need to update the database with the new customer_id
          needsDatabaseUpdate = true;
        } else {
          // No email available, return error
          return NextResponse.json({
            url: null,
            error: `No such customer: '${customerId}'. Please provide an email address.`,
          }, { status: 400 });
        }
      }
    }

    // Update database with new customer_id if needed (for logged-in users)
    if (needsDatabaseUpdate && resolved_customer_id && customerId) {
      try {
        const supabase = await createSupabaseServiceRole();
        await supabase
          .from("profiles")
          .update({ customer_id: resolved_customer_id })
          .eq("customer_id", customerId);
        console.log(`Updated database: replaced ${customerId} with ${resolved_customer_id}`);
      } catch (error) {
        console.error("Error updating customer_id in database:", error);
        // Continue with checkout even if database update fails
      }
    }

    // Check if customer has had a trial before
    if (resolved_customer_id) {
      try {
        const hasHadTrial = await hasCustomerHadTrial(resolved_customer_id);

        // If customer has had a trial and we're trying to give them another trial, return error
        if (hasHadTrial && !collectPaymentMethod && planType !== "lifetime") {
          return NextResponse.json({
            url: null,
            error: "TRIAL_USED_BEFORE",
            message:
              "You've already used a trial before. Please provide payment information to proceed.",
            hasHadTrial: true,
          });
        }
      } catch (error) {
        console.error("Error checking trial history:", error);
        // Continue with checkout even if trial check fails
      }
    }

    // Determine if user is signed up (has a customerId, meaning they're logged in)
    const isSignedUp = !!customerId;

    // Create checkout session with or without customer ID
    const result = await createCheckoutSession(
      resolved_customer_id,
      planType,
      collectPaymentMethod,
      isSignedUp
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
 * Checks if a customer has previously had a trial subscription
 */
async function hasCustomerHadTrial(customerId: string): Promise<boolean> {
  try {
    // Get all subscriptions for this customer
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 100,
    });

    // Check if any subscription had a trial period
    return subscriptions.data.some(
      (sub) =>
        sub.trial_start !== null ||
        sub.trial_end !== null ||
        sub.status === "trialing"
    );
  } catch (error) {
    console.error("Error checking customer trial history:", error);
    // If we can't check, assume they haven't had a trial to be safe
    return false;
  }
}

/**
 * Creates a Stripe checkout session for the selected plan
 */
async function createCheckoutSession(
  customerId: string | undefined,
  planType: PlanType,
  collectPaymentMethod: boolean = false,
  isSignedUp: boolean = false
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

    // Check if customer has previously had a trial
    let hasHadTrial = false;
    try {
      hasHadTrial = await hasCustomerHadTrial(customerId);
    } catch (error) {
      console.error("Error checking trial history in createCheckoutSession:", error);
      // Continue with checkout even if trial check fails
    }

    // Determine mode based on plan type
    let mode: "subscription" | "payment";
    let subscriptionData:
      | Stripe.Checkout.SessionCreateParams.SubscriptionData
      | undefined = undefined;

    if (planType === "lifetime") {
      // Lifetime is a one-time payment
      mode = "payment";
    } else {
      // All other plans are subscriptions
      mode = "subscription";

      // Only add trial if customer hasn't had one before
      if (!hasHadTrial) {
        subscriptionData = {
          trial_period_days: collectPaymentMethod ? 14 : 7, // Extended trial if collecting payment method
        };
      }
      // If customer has had a trial before, no trial_period_days - they'll be charged immediately
    }

    // Get user_id and email from Supabase if customer_id is available
    let userId: string | undefined;
    let userEmail: string | undefined;
    
    if (customerId) {
      try {
        const supabase = await createSupabaseServiceRole();
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email")
          .eq("customer_id", customerId)
          .single();
        
        if (profile) {
          userId = profile.id;
          userEmail = profile.email;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Continue without user data
      }
    }

    // Get plan name for Meta tracking with trial period
    let planName = await getPlanName(priceId, planType);
    
    // Add trial period to plan name for better tracking
    if (mode === "subscription" && subscriptionData?.trial_period_days) {
      planName = `${planName}_trial${subscriptionData.trial_period_days}`;
    }
    
    // Generate event_id for deduplication
    const eventId = randomUUID();

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
        plan_name: planName,
        customer_id: customerId,
        collect_payment_method: collectPaymentMethod.toString(),
        is_signed_up: isSignedUp.toString(),
        ...(userId && { user_id: userId }),
        ...(userEmail && { email: userEmail }),
        event_id: eventId,
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

    // Set payment method collection based on collectPaymentMethod flag and trial history
    if (mode === "subscription") {
      // If customer has had a trial before, always require payment method
      // Otherwise, use the collectPaymentMethod flag
      const requiresPaymentMethod = hasHadTrial || collectPaymentMethod;
      sessionParams.payment_method_collection = requiresPaymentMethod
        ? "always"
        : "if_required";
    }

    // Enable entering promotion codes on the Checkout page
    sessionParams.allow_promotion_codes = true;

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
