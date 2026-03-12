/**
 * @fileoverview Stripe subscription setup API for in-app subscription checkout.
 *
 * Creates a Stripe Subscription with payment_behavior: default_incomplete and returns
 * the first invoice's PaymentIntent client_secret so the client can collect payment
 * on-site. Handles trial eligibility, promo codes, and duplicate subscription prevention.
 *
 * For 7-day trials without a payment method, sets trial_settings.end_behavior
 * .missing_payment_method to "cancel" so Stripe cancels the subscription at trial end
 * instead of creating an invoice. This prevents billing/charge failure emails.
 *
 * @module api/stripe/subscription-setup
 */

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import Stripe from "stripe";
import {
  findOrCreateCustomer,
  hasCustomerHadTrial,
} from "@/utils/stripe/actions";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import { PlanType } from "@/types/stripe";
import { inviteUserByEmailAndRefreshProStatus } from "@/app/actions/checkout";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief Returns plan name for metadata/tracking (e.g. monthly_6, annual_59).
 */
async function getPlanName(
  priceId: string,
  planType: PlanType,
): Promise<string> {
  try {
    const price = await stripe.prices.retrieve(priceId);
    const amount = (price.unit_amount || 0) / 100;
    if (planType === "monthly") return `monthly_${amount}`;
    if (planType === "annual") return `annual_${amount}`;
    return `${planType}_${amount}`;
  } catch {
    return `${planType}_unknown`;
  }
}

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

const VALID_SUB_PLANS: PlanType[] = ["monthly", "annual"];

/**
 * @brief POST endpoint to create a subscription and return first invoice PaymentIntent
 *
 * Request body: { planType, email?, promotionCode?, collectPaymentMethod?, isPlanChange?, paymentMethodId? }
 * Customer is always resolved by email (find-or-create).
 * Returns: { success: true, clientSecret, paymentIntentId, subscriptionId } or error.
 *
 * @param request Next.js request with JSON body
 * @returns NextResponse with clientSecret or error
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp, 10, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const {
      planType,
      email,
      firstName,
      lastName,
      customerId: bodyCustomerId,
      promotionCode,
      collectPaymentMethod = false,
      isPlanChange = false,
      paymentMethodId,
    }: {
      planType: string;
      email?: string;
      firstName?: string;
      lastName?: string;
      /** When set, use this Stripe customer ID and skip findOrCreateCustomer lookup. */
      customerId?: string;
      promotionCode?: string;
      collectPaymentMethod?: boolean;
      isPlanChange?: boolean;
      /** When set, subscription is created with this payment method (no clientSecret returned). Call after SetupIntent confirm. */
      paymentMethodId?: string;
    } = body;

    if (!planType || !VALID_SUB_PLANS.includes(planType as PlanType)) {
      return NextResponse.json(
        {
          success: false,
          error: "planType must be monthly or annual for subscription setup.",
        },
        { status: 400 },
      );
    }

    const priceIds: Record<string, string | undefined> = {
      monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
      annual: process.env.STRIPE_PRICE_ID_ANNUAL,
    };
    const priceId = priceIds[planType];
    if (!priceId) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const checkoutEmail =
      (typeof email === "string" && email.trim() ? email.trim() : null) ??
      user?.email ??
      null;
    if (!checkoutEmail) {
      return NextResponse.json(
        { success: false, error: "Email is required." },
        { status: 400 },
      );
    }

    const customerName =
      [firstName?.trim(), lastName?.trim()].filter(Boolean).join(" ") ||
      undefined;
    const resolvedCustomerId =
      typeof bodyCustomerId === "string" && bodyCustomerId.trim()
        ? bodyCustomerId.trim()
        : await findOrCreateCustomer(checkoutEmail, customerName);

    if (user?.id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("customer_id")
        .eq("id", user.id)
        .single();
      if (!profile?.customer_id) {
        await supabase
          .from("profiles")
          .update({ customer_id: resolvedCustomerId })
          .eq("id", user.id);
      }
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: resolvedCustomerId,
      status: "all",
      limit: 100,
    });
    const active = subscriptions.data.filter(
      (sub) =>
        sub.status === "active" ||
        sub.status === "trialing" ||
        sub.status === "past_due",
    );

    if (isPlanChange) {
      // Backend-derived: plan change is only valid when customer has exactly one active subscription.
      if (active.length !== 1) {
        return NextResponse.json(
          {
            success: false,
            error: "INVALID_PLAN_CHANGE",
            message:
              active.length === 0
                ? "No active subscription found. Start a new subscription from the pricing page."
                : "Multiple active subscriptions found. Please contact support or manage your subscription in the billing portal.",
          },
          { status: 400 },
        );
      }
    } else {
      if (active.length > 0) {
        return NextResponse.json(
          {
            success: false,
            error: "ACTIVE_SUBSCRIPTION_EXISTS",
            message:
              "You already have an active subscription. Please manage your existing subscription or wait for it to expire before creating a new one.",
          },
          { status: 400 },
        );
      }
    }

    let hasHadTrial = false;
    try {
      hasHadTrial = await hasCustomerHadTrial(resolvedCustomerId);
    } catch {
      // default false
    }

    if (hasHadTrial && !collectPaymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: "TRIAL_USED_BEFORE",
          message:
            "You've already used a trial before. Please provide payment information to proceed.",
          hasHadTrial: true,
        },
        { status: 400 },
      );
    }

    const shouldGiveTrial = !isPlanChange && !hasHadTrial;
    const trialDays = shouldGiveTrial
      ? collectPaymentMethod
        ? 14
        : 7
      : undefined;

    let couponId: string | undefined;
    if (promotionCode?.trim()) {
      const code = promotionCode.trim();
      const list = await stripe.promotionCodes.list({
        code: code,
        active: true,
        limit: 1,
      });
      const promo = list.data[0];
      const couponRef =
        promo?.promotion?.coupon ?? (promo as { coupon?: string })?.coupon;
      if (couponRef) {
        couponId =
          typeof couponRef === "string"
            ? couponRef
            : (couponRef as { id: string }).id;
      }
    }

    const planName = await getPlanName(priceId, planType as PlanType);
    const resolvedEmail =
      (typeof email === "string" && email.trim() ? email.trim() : null) ??
      user?.email ??
      null;
    const eventId = randomUUID();

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: resolvedCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        ...(paymentMethodId ? { default_payment_method: paymentMethodId } : {}),
      },
      expand: paymentMethodId
        ? ["latest_invoice"]
        : [
            "latest_invoice",
            "latest_invoice.confirmation_secret",
            "pending_setup_intent",
          ],
      metadata: {
        plan_type: planType,
        plan_name:
          trialDays != null ? `${planName}_trial${trialDays}` : planName,
        user_id: user?.id ?? "anonymous",
        event_id: eventId,
        ...(resolvedEmail && { email: resolvedEmail }),
      },
    };
    if (couponId) subscriptionParams.discounts = [{ coupon: couponId }];
    if (trialDays != null) subscriptionParams.trial_period_days = trialDays;

    // 7-day trial without payment method: cancel at trial end so Stripe does not
    // create an invoice or send billing/charge failure emails.
    const is7DayNoCard = trialDays === 7 && !collectPaymentMethod;
    if (is7DayNoCard) {
      (
        subscriptionParams as Stripe.SubscriptionCreateParams & {
          trial_settings?: {
            end_behavior?: { missing_payment_method?: string };
          };
        }
      ).trial_settings = {
        end_behavior: {
          missing_payment_method: "cancel",
        },
      };
    }

    const now = new Date();
    const hourKey = `${now.getUTCFullYear()}${String(now.getUTCMonth() + 1).padStart(2, "0")}${String(now.getUTCDate()).padStart(2, "0")}${String(now.getUTCHours()).padStart(2, "0")}`;
    const subscriptionIdempotencyKey = `sub_${resolvedCustomerId}_${planType}_${hourKey}`.substring(
      0,
      255,
    );

    const subscription = await stripe.subscriptions.create(subscriptionParams, {
      idempotencyKey: subscriptionIdempotencyKey,
    });

    // Invite and refresh pro status for ALL successful subscription creations (not just paymentMethodId path).
    // Makes the invite reliable and server-side regardless of redirect/inline flow.
    let inviteSent = false;
    if (resolvedEmail?.trim()) {
      try {
        await inviteUserByEmailAndRefreshProStatus(
          resolvedEmail.trim(),
          firstName?.trim(),
          lastName?.trim(),
        );
        inviteSent = true;
      } catch (inviteErr) {
        console.error(
          "[subscription-setup] Invite after subscription creation:",
          inviteErr,
        );
      }
    }

    if (paymentMethodId) {
      return NextResponse.json({
        success: true,
        subscriptionId: subscription.id,
        type: "subscription",
        inviteSent,
      });
    }

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const confirmationSecret = latestInvoice?.confirmation_secret;
    let clientSecret: string | null =
      typeof confirmationSecret === "object" && confirmationSecret !== null
        ? confirmationSecret.client_secret
        : null;

    if (
      !clientSecret &&
      latestInvoice &&
      typeof latestInvoice === "object" &&
      latestInvoice.id
    ) {
      const invoiceId = latestInvoice.id;
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
      });
      const pi = (invoice as { payment_intent?: string | { client_secret?: string } }).payment_intent;
      if (typeof pi === "object" && pi !== null && pi.client_secret) {
        clientSecret = pi.client_secret;
      } else if (typeof pi === "string") {
        const intent = await stripe.paymentIntents.retrieve(pi);
        clientSecret = intent.client_secret;
      }
    }

    let intentType: "payment_intent" | "setup_intent" = "payment_intent";

    if (!clientSecret) {
      const pendingSetupIntent = subscription.pending_setup_intent;
      if (pendingSetupIntent) {
        const setupIntent =
          typeof pendingSetupIntent === "string"
            ? await stripe.setupIntents.retrieve(pendingSetupIntent)
            : pendingSetupIntent;
        if (setupIntent.client_secret) {
          clientSecret = setupIntent.client_secret;
          intentType = "setup_intent";
        }
      }
    }

    if (!clientSecret) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This subscription could not be set up for payment. If you chose a free trial with no card, try starting from the pricing page again and select an option that collects payment.",
        },
        { status: 500 },
      );
    }

    if (intentType === "payment_intent" && resolvedEmail) {
      const paymentIntentId = clientSecret.split("_secret_")[0];
      if (paymentIntentId?.startsWith("pi_")) {
        try {
          await stripe.paymentIntents.update(paymentIntentId, {
            receipt_email: resolvedEmail,
          });
        } catch {
          // non-fatal; receipt may still be sent from customer email
        }
      }
    }

    return NextResponse.json({
      success: true,
      clientSecret,
      intentType,
      paymentIntentId:
        intentType === "payment_intent"
          ? (clientSecret.split("_secret_")[0] ?? undefined)
          : undefined,
      subscriptionId: subscription.id,
      type: "subscription",
      inviteSent,
    });
  } catch (error) {
    console.error("Subscription setup error:", error);
    const msg =
      error instanceof Error ? error.message : "Subscription setup failed";
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
