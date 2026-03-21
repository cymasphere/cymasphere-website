/**
 * @fileoverview Stripe checkout session creation API endpoint
 *
 * This endpoint creates Stripe checkout sessions for subscription and one-time payments.
 * Handles customer creation/lookup, trial period management, duplicate subscription prevention,
 * lifetime purchase validation, automatic promotion code application, and payment method
 * collection requirements. Supports both logged-in users (with customer_id) and guest
 * checkouts (with email only).
 *
 * @module api/stripe/checkout
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { PlanType } from "@/types/stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import { hasCustomerPurchasedLifetime } from "@/utils/stripe/actions";
import { randomUUID } from "crypto";

/**
 * Stripe client instance initialized with secret key from environment variables
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief Maps Stripe price ID to plan name format for Meta conversion tracking
 *
 * Retrieves the price from Stripe and formats it as a plan name string for
 * Meta pixel event tracking. Format: monthly_6, annual_59, lifetime_149
 *
 * @param priceId Stripe price ID to retrieve
 * @param planType Plan type identifier (monthly, annual, lifetime)
 * @returns Formatted plan name string for tracking
 * @note Returns fallback format if price retrieval fails
 *
 * @example
 * ```typescript
 * const planName = await getPlanName("price_123", "monthly");
 * // Returns: "monthly_6" (if price is $6.00)
 * ```
 */
async function getPlanName(
  priceId: string,
  planType: PlanType,
): Promise<string> {
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

/**
 * @brief POST endpoint to create a Stripe checkout session
 *
 * Creates a Stripe checkout session for subscription or one-time payment plans.
 * Handles customer creation/lookup, validates trial eligibility, prevents duplicate
 * subscriptions and lifetime purchases, applies automatic promotions, and configures
 * payment method collection requirements. Supports both logged-in users and guest checkouts.
 *
 * Request body (JSON):
 * - planType: Plan type - "monthly", "annual", or "lifetime" (required)
 * - email: User's email address (required if customerId not provided)
 * - customerId: Existing Stripe customer ID (optional, for logged-in users)
 * - collectPaymentMethod: Whether to require payment method upfront (default: false)
 * - isPlanChange: Whether this is a plan change for existing subscription (default: false)
 *
 * Responses:
 *
 * 200 OK - Success:
 * ```json
 * {
 *   "url": "https://checkout.stripe.com/pay/cs_test_..."
 * }
 * ```
 *
 * 400 Bad Request - Missing customer ID and email:
 * ```json
 * {
 *   "url": null,
 *   "error": "No such customer: 'cus_xxx'. Please provide an email address."
 * }
 * ```
 *
 * 400 Bad Request - Trial already used:
 * ```json
 * {
 *   "url": null,
 *   "error": "TRIAL_USED_BEFORE",
 *   "message": "You've already used a trial before. Please provide payment information to proceed.",
 *   "hasHadTrial": true
 * }
 * ```
 *
 * 400 Bad Request - Lifetime already purchased:
 * ```json
 * {
 *   "url": null,
 *   "error": "LIFETIME_ALREADY_PURCHASED",
 *   "message": "You already have a lifetime license! To purchase another license (for example, as a gift), please create a new account using a different email address.",
 *   "hasLifetime": true
 * }
 * ```
 *
 * 400 Bad Request - Active subscription exists:
 * ```json
 * {
 *   "url": null,
 *   "error": "ACTIVE_SUBSCRIPTION_EXISTS",
 *   "message": "You already have an active subscription. Please manage your existing subscription or wait for it to expire before creating a new one.",
 *   "hasActiveSubscription": true,
 *   "activeSubscriptionIds": ["sub_xxx"]
 * }
 * ```
 *
 * 500 Internal Server Error - Checkout session creation failed:
 * ```json
 * {
 *   "url": null,
 *   "error": "Failed to create checkout session"
 * }
 * ```
 *
 * @param request Next.js request object containing JSON body with checkout parameters
 * @returns NextResponse with checkout URL or error
 * @note Maximum 1 trial per customer (enforced for non-lifetime plans)
 * @note Maximum 1 lifetime purchase per customer (enforced)
 * @note Maximum 1 active subscription per customer (enforced for non-lifetime plans)
 * @note Automatic promotion codes are applied if active promotion exists in database
 * @note Trial period: 7 days (default) or 14 days (if collectPaymentMethod is true)
 * @note Plan changes never include trial periods
 *
 * @example
 * ```typescript
 * // POST /api/stripe/checkout
 * // Body: { planType: "monthly", email: "user@example.com", collectPaymentMethod: false }
 * // Returns: { url: "https://checkout.stripe.com/pay/cs_test_..." }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp, 10, 60)) {
      return NextResponse.json(
        { url: null, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    // Parse JSON request body
    const body = await request.json();
    const {
      planType,
      email,
      customerId,
      collectPaymentMethod = false,
      isPlanChange = false,
      embedded = false,
    }: {
      planType: PlanType;
      email?: string;
      customerId?: string;
      collectPaymentMethod?: boolean;
      isPlanChange?: boolean;
      embedded?: boolean;
    } = body;

    if (customerId?.trim()) {
      const supabaseAuth = await createClient();
      const {
        data: { user },
      } = await supabaseAuth.auth.getUser();
      if (!user?.id) {
        return NextResponse.json(
          {
            url: null,
            error: "Unauthorized",
            message: "Sign in to continue checkout with your saved billing profile.",
          },
          { status: 401 },
        );
      }
      const cid = customerId.trim();
      const { data: profileRow } = await supabaseAuth
        .from("profiles")
        .select("customer_id")
        .eq("id", user.id)
        .single();
      if (profileRow?.customer_id && profileRow.customer_id !== cid) {
        return NextResponse.json(
          {
            url: null,
            error: "FORBIDDEN",
            message:
              "The billing profile does not match your account. Refresh the page or contact support.",
          },
          { status: 403 },
        );
      }
      if (!profileRow?.customer_id) {
        try {
          const cust = await stripe.customers.retrieve(cid);
          const stripeEmail =
            typeof cust === "object" &&
            cust &&
            !("deleted" in cust && cust.deleted) &&
            "email" in cust &&
            cust.email
              ? cust.email.toLowerCase().trim()
              : null;
          const userEmail = user.email?.toLowerCase().trim() ?? null;
          if (!stripeEmail || !userEmail || stripeEmail !== userEmail) {
            return NextResponse.json(
              {
                url: null,
                error: "FORBIDDEN",
                message:
                  "Stripe customer does not match your account email. Use checkout email that matches your login.",
              },
              { status: 403 },
            );
          }
        } catch {
          return NextResponse.json(
            {
              url: null,
              error: "Invalid customer",
              message: "Could not verify billing profile.",
            },
            { status: 400 },
          );
        }
      }
    }

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
      } catch (error: unknown) {
        // Customer doesn't exist in Stripe, try to find/create using email
        console.warn(
          `Customer ${customerId} not found in Stripe, attempting to find/create using email`,
        );
        if (email) {
          resolved_customer_id = await findOrCreateCustomer(email);
          console.log(
            `Found/created customer using email: ${resolved_customer_id}`,
          );
          // Mark that we need to update the database with the new customer_id
          needsDatabaseUpdate = true;
        } else {
          // No email available, return error
          return NextResponse.json(
            {
              url: null,
              error: `No such customer: '${customerId}'. Please provide an email address.`,
            },
            { status: 400 },
          );
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
        console.log(
          `Updated database: replaced ${customerId} with ${resolved_customer_id}`,
        );
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
        return NextResponse.json(
          {
            url: null,
            error: "BILLING_VERIFY_UNAVAILABLE",
            message:
              "We could not verify trial eligibility. Please try again in a moment.",
          },
          { status: 503 },
        );
      }
    }

    // CRITICAL: Check if customer already has a lifetime purchase
    if (resolved_customer_id && planType === "lifetime") {
      try {
        const hasLifetime =
          await hasCustomerPurchasedLifetime(resolved_customer_id);

        if (hasLifetime) {
          console.warn(
            `⚠️ Customer ${resolved_customer_id} already has lifetime access. Blocking duplicate purchase.`,
          );
          return NextResponse.json(
            {
              url: null,
              error: "LIFETIME_ALREADY_PURCHASED",
              message:
                "You already have a lifetime license! To purchase another license (for example, as a gift), please create a new account using a different email address.",
              hasLifetime: true,
            },
            { status: 400 },
          );
        }
      } catch (error) {
        console.error("Error checking lifetime purchase history:", error);
        return NextResponse.json(
          {
            url: null,
            error: "BILLING_VERIFY_UNAVAILABLE",
            message:
              "We could not verify purchase history. Please try again in a moment.",
          },
          { status: 503 },
        );
      }
    }

    // CRITICAL: Check if customer already has an active subscription (prevents duplicates)
    // For plan changes, backend derives validity: only allow if customer has exactly one active subscription.
    if (resolved_customer_id && planType !== "lifetime") {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: resolved_customer_id,
          status: "all",
          limit: 100,
        });

        const activeSubscriptions = subscriptions.data.filter(
          (sub) =>
            sub.status === "active" ||
            sub.status === "trialing" ||
            sub.status === "past_due",
        );

        if (isPlanChange) {
          if (activeSubscriptions.length !== 1) {
            return NextResponse.json(
              {
                url: null,
                error:
                  activeSubscriptions.length === 0
                    ? "INVALID_PLAN_CHANGE"
                    : "ACTIVE_SUBSCRIPTION_EXISTS",
                message:
                  activeSubscriptions.length === 0
                    ? "No active subscription found. Start a new subscription from the pricing page."
                    : "Multiple active subscriptions found. Please manage your subscription in the billing portal.",
              },
              { status: 400 },
            );
          }
        } else if (activeSubscriptions.length > 0) {
          console.warn(
            `⚠️ Customer ${resolved_customer_id} already has ${activeSubscriptions.length} active subscription(s). Blocking duplicate subscription creation.`,
          );
          return NextResponse.json(
            {
              url: null,
              error: "ACTIVE_SUBSCRIPTION_EXISTS",
              message:
                "You already have an active subscription. Please manage your existing subscription or wait for it to expire before creating a new one.",
              hasActiveSubscription: true,
              activeSubscriptionIds: activeSubscriptions.map((sub) => sub.id),
            },
            { status: 400 },
          );
        }
      } catch (error) {
        console.error("Error checking for active subscriptions:", error);
        return NextResponse.json(
          {
            url: null,
            error: "BILLING_VERIFY_UNAVAILABLE",
            message:
              "We could not verify subscription status. Please try again in a moment.",
          },
          { status: 503 },
        );
      }
    }

    // Determine if user is signed up (has a customerId, meaning they're logged in)
    const isSignedUp = !!customerId;

    // Create checkout session with or without customer ID
    const result = await createCheckoutSession(
      resolved_customer_id,
      planType,
      collectPaymentMethod,
      isSignedUp,
      isPlanChange,
      embedded,
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
      { status: 500 },
    );
  }
}

/**
 * @brief Finds or creates a Stripe customer by email address
 *
 * Searches for an existing Stripe customer with the given email. If found,
 * returns the customer ID. If not found, creates a new customer with
 * idempotency protection to prevent duplicate creation from concurrent requests.
 * Handles race conditions and retries on creation failures.
 *
 * @param email Customer email address (will be normalized to lowercase)
 * @returns Stripe customer ID
 * @note Email is normalized (lowercase, trimmed) to prevent duplicates
 * @note Uses hour-based idempotency keys to prevent race conditions
 * @note Retries lookup on creation failures to handle concurrent requests
 * @note This is a duplicate of the function in utils/stripe/actions.ts - consider importing instead
 *
 * @example
 * ```typescript
 * const customerId = await findOrCreateCustomer("user@example.com");
 * // Returns: "cus_abc123" (existing or newly created)
 * ```
 */
async function findOrCreateCustomer(email: string): Promise<string> {
  try {
    // Normalize email: lowercase and trim to prevent duplicates from case differences
    const normalizedEmail = email.toLowerCase().trim();

    // Search for existing customers with this email
    const existingCustomers = await stripe.customers.list({
      email: normalizedEmail,
      limit: 10, // Get more results to handle potential duplicates
    });

    if (existingCustomers.data.length > 0) {
      // If there are multiple customers with the same email, log a warning
      if (existingCustomers.data.length > 1) {
        console.warn(
          `Found ${existingCustomers.data.length} Stripe customers with email ${normalizedEmail}. Using the most recent one.`,
        );
      }
      return existingCustomers.data[0].id;
    }

    // Create new customer with hour-based idempotency key to prevent race conditions
    // Key includes current hour so failed attempts can be retried after an hour
    // All signups within the same hour use the same key, preventing duplicates from spam clicking
    const now = new Date();
    const hourKey = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}`;
    const idempotencyKey = `cust_${normalizedEmail.replace(/[^a-z0-9]/g, "_")}_${hourKey}`;

    try {
      const newCustomer = await stripe.customers.create(
        {
          email: normalizedEmail,
        },
        {
          idempotencyKey: idempotencyKey.substring(0, 255), // Stripe has 255 char limit
        },
      );

      return newCustomer.id;
    } catch (createError: unknown) {
      // If customer creation fails, it could be due to:
      // 1. Idempotency key collision (another request is creating the same customer)
      // 2. Network/API error
      // 3. Customer was created between our check and create (race condition)

      // Always retry the lookup - another process may have created the customer
      // Wait a brief moment to allow concurrent request to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      const retryCustomers = await stripe.customers.list({
        email: normalizedEmail,
        limit: 1,
      });

      if (retryCustomers.data.length > 0) {
        console.log(
          `Customer found on retry after creation error: ${retryCustomers.data[0].id}`,
        );
        return retryCustomers.data[0].id;
      }

      const stripeErr = createError as {
        code?: string;
        type?: string;
      };
      // If retry also fails, check for specific error codes
      if (
        stripeErr.code === "idempotency_key_in_use" ||
        stripeErr.type === "StripeIdempotencyError"
      ) {
        // Idempotency key collision - wait a bit longer and retry lookup
        await new Promise((resolve) => setTimeout(resolve, 500));
        const finalRetry = await stripe.customers.list({
          email: normalizedEmail,
          limit: 1,
        });
        if (finalRetry.data.length > 0) {
          return finalRetry.data[0].id;
        }
      }

      // If all retries fail, throw the original error
      throw createError;
    }
  } catch (error) {
    console.error("Error finding/creating customer:", error);
    throw error;
  }
}

/**
 * @brief Checks if a customer has previously used a trial subscription
 *
 * Queries all subscriptions for the customer and checks if any subscription
 * had a trial period (trial_start, trial_end, or status "trialing").
 * Used to enforce the one-trial-per-customer policy.
 *
 * @param customerId Stripe customer ID to check
 * @returns True if customer has had a trial before, false otherwise
 * @note Returns false on errors to avoid blocking legitimate purchases
 *
 * @example
 * ```typescript
 * const hadTrial = await hasCustomerHadTrial("cus_abc123");
 * // Returns: true if customer has used a trial, false otherwise
 * ```
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
        sub.status === "trialing",
    );
  } catch (error) {
    console.error("Error checking customer trial history:", error);
    // If we can't check, assume they haven't had a trial to be safe
    return false;
  }
}

/**
 * @brief Creates a Stripe checkout session for the selected plan
 *
 * Creates a Stripe checkout session with appropriate configuration based on
 * plan type, trial eligibility, and payment method requirements. Handles
 * subscription and one-time payment modes, applies automatic promotions,
 * configures trial periods, and sets up success/cancel URLs.
 *
 * @param customerId Stripe customer ID (required)
 * @param planType Plan type - "monthly", "annual", or "lifetime"
 * @param collectPaymentMethod Whether to require payment method upfront (default: false)
 * @param isSignedUp Whether user is logged in (default: false)
 * @param isPlanChange Whether this is a plan change (default: false)
 * @returns Object with checkout URL or error message
 * @note Lifetime plans use "payment" mode, others use "subscription" mode
 * @note Trial periods: 7 days (default) or 14 days (if collectPaymentMethod is true)
 * @note Plan changes never include trial periods
 * @note Automatic promotion codes are applied if active promotion exists
 * @note Manual promotion codes are enabled if no auto-discount is applied
 *
 * @example
 * ```typescript
 * const result = await createCheckoutSession("cus_abc123", "monthly", false, true, false);
 * // Returns: { url: "https://checkout.stripe.com/pay/cs_test_..." }
 * ```
 */
async function createCheckoutSession(
  customerId: string | undefined,
  planType: PlanType,
  collectPaymentMethod: boolean = false,
  isSignedUp: boolean = false,
  isPlanChange: boolean = false,
  embedded: boolean = false,
): Promise<{
  url: string | null;
  clientSecret?: string | null;
  error?: string;
}> {
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

    // BULLETPROOF: Check if customer has previously had a trial
    let hasHadTrial = false;
    try {
      hasHadTrial = await hasCustomerHadTrial(customerId);
      console.log(
        `[createCheckoutSession] Customer ${customerId} hasHadTrial: ${hasHadTrial}`,
      );
    } catch (error) {
      console.error(
        "Error checking trial history in createCheckoutSession:",
        error,
      );
      // On error, default to false (allow trial) - better UX than blocking legitimate users
      // The hasCustomerHadTrial function already defaults to false on error
      hasHadTrial = false;
      console.warn(
        `[createCheckoutSession] Trial check failed, defaulting to hasHadTrial=false (will allow trial if eligible)`,
      );
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

      // BULLETPROOF: Multiple safeguards to prevent accidental trials
      // 1. NEVER add trial for plan changes
      // 2. NEVER add trial if customer has had one before
      // 3. ONLY add trial for new subscriptions from customers who never had a trial
      const shouldGiveTrial = !isPlanChange && !hasHadTrial;

      if (shouldGiveTrial) {
        const trialDays = collectPaymentMethod ? 14 : 7;
        subscriptionData = {
          trial_period_days: trialDays,
        };
        console.log(
          `[createCheckoutSession] Adding ${trialDays}-day trial for new subscription`,
        );
      } else {
        // BULLETPROOF: Explicitly log why trial is NOT being given
        if (isPlanChange) {
          console.log(
            `[createCheckoutSession] NO TRIAL: This is a plan change`,
          );
        } else if (hasHadTrial) {
          console.log(
            `[createCheckoutSession] NO TRIAL: Customer has had a trial before`,
          );
        }
        // No trial_period_days - they'll be charged immediately
      }
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
          userEmail = profile.email ?? undefined;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        // Continue without user data
      }
    }

    // CRITICAL: Always include email in metadata for webhook fallback lookup
    // If we don't have email from profile, get it from Stripe customer
    // This ensures webhook can always find the user even if customer_id isn't set in profile yet
    if (!userEmail && customerId) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        userEmail =
          typeof customer === "object" && !customer.deleted
            ? (customer.email ?? undefined)
            : undefined;
      } catch (error) {
        console.error("Error retrieving customer email:", error);
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

    const useEmbedded =
      embedded && (planType === "monthly" || planType === "annual");

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      payment_method_types: ["card"],
      mode,
      ...(useEmbedded
        ? {
            ui_mode: "embedded" as const,
            return_url: `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
          }
        : {
            success_url: `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${baseUrl}/checkout-canceled`,
          }),
      metadata: {
        plan_type: planType,
        plan_name: planName,
        customer_id: customerId,
        collect_payment_method: collectPaymentMethod.toString(),
        is_signed_up: isSignedUp.toString(),
        ...(userId && { user_id: userId }),
        ...(userEmail && { email: userEmail }), // Always include email if available for webhook fallback
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

    // Add payment_intent_data and invoice_creation for lifetime purchases to ensure metadata is set
    // This ensures metadata is on both payment intent AND invoice for all lifetime purchases.
    // Metadata schema is shared across all lifetime flows so downstream Supabase/Stripe utilities
    // can reliably detect lifetime access:
    // - purchase_type: "lifetime"
    // - plan_type: "lifetime"
    // - plan_name: formatted name with amount (e.g. lifetime_149 or lifetime_149_trial7)
    // - price_id: Stripe price identifier used for the charge
    // - user_id/email/event_id: copied from the Checkout Session metadata for correlation
    if (planType === "lifetime" && mode === "payment") {
      const lifetimeMetadata = {
        purchase_type: "lifetime",
        plan_type: planType,
        plan_name: planName,
        price_id: priceId,
        ...(userId && { user_id: userId }),
        ...(userEmail && { email: userEmail }),
        event_id: eventId,
      };

      sessionParams.payment_intent_data = {
        metadata: lifetimeMetadata,
      };
      // Also set metadata on invoice when it's created
      sessionParams.invoice_creation = {
        enabled: true,
        invoice_data: {
          metadata: lifetimeMetadata,
        },
      };
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

    // Auto-apply sale discount code if there's an active promotion from database
    let hasAutoDiscount = false;
    try {
      const supabase = await createSupabaseServiceRole();

      // Fetch all active promotions, then filter by plan and date in JavaScript
      // This is more reliable than using .contains() with array syntax
      const { data: promotions, error: promoError } = await supabase
        .from("promotions")
        .select("*")
        .eq("active", true)
        .order("priority", { ascending: false });

      if (promoError) {
        console.error("Error fetching promotions:", promoError);
        throw promoError;
      }

      if (promotions && promotions.length > 0) {
        const now = new Date();

        // Find the highest priority promotion that:
        // 1. Applies to this plan type
        // 2. Is within date range (or has no date restrictions)
        const activePromotion = promotions.find((promo) => {
          // Check if plan is applicable
          const planApplicable =
            promo.applicable_plans &&
            Array.isArray(promo.applicable_plans) &&
            promo.applicable_plans.includes(planType);

          if (!planApplicable) return false;

          // Check date range
          const startValid =
            !promo.start_date || new Date(promo.start_date) <= now;
          const endValid = !promo.end_date || new Date(promo.end_date) >= now;

          return startValid && endValid;
        });

        if (activePromotion && activePromotion.stripe_coupon_code) {
          // Validate that the coupon exists in Stripe before applying
          try {
            const coupon = await stripe.coupons.retrieve(
              activePromotion.stripe_coupon_code,
            );

            // Double-check coupon is valid
            if (!coupon.valid) {
              console.warn(
                `⚠️ Coupon ${activePromotion.stripe_coupon_code} exists but is not valid`,
              );
              throw new Error("Coupon is not valid");
            }

            // Coupon exists and is valid, safe to apply
            sessionParams.discounts = [
              {
                coupon: activePromotion.stripe_coupon_code,
              },
            ];
            hasAutoDiscount = true;
            console.log(
              `🎁 Auto-applying promotion coupon: ${activePromotion.stripe_coupon_code} for ${planType} plan`,
            );
            console.log(`📊 Promotion details:`, {
              name: activePromotion.name,
              title: activePromotion.title,
              discount_type: activePromotion.discount_type,
              discount_value: activePromotion.discount_value,
              priority: activePromotion.priority,
            });
          } catch (couponError: unknown) {
            // Coupon doesn't exist in Stripe or is invalid
            const couponMsg =
              couponError instanceof Error
                ? couponError.message
                : String(couponError);
            console.warn(
              `⚠️ Coupon ${activePromotion.stripe_coupon_code} not found or invalid in Stripe:`,
              couponMsg,
            );
            console.warn(
              `   Promotion: ${activePromotion.name} (${activePromotion.title})`,
            );
            // Continue without discount - user can still enter code manually
          }
        } else {
          console.log(
            `ℹ️ No active promotion found for ${planType} plan (checked ${promotions.length} active promotions)`,
          );
        }
      } else {
        console.log(`ℹ️ No active promotions in database`);
      }
    } catch (error) {
      console.error("Error in promotion lookup:", error);
      // Continue without discount if promotion lookup fails
    }

    // Only enable manual promotion codes if we're NOT auto-applying a discount
    // Stripe doesn't allow both allow_promotion_codes and discounts together
    if (!hasAutoDiscount) {
      sessionParams.allow_promotion_codes = true;
    }

    // Create the checkout session
    const session = await stripe.checkout.sessions.create(sessionParams);

    if (useEmbedded && session.client_secret) {
      return { url: null, clientSecret: session.client_secret };
    }
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
