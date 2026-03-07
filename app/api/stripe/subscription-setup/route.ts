/**
 * @fileoverview Stripe subscription setup API for in-app subscription checkout.
 *
 * Creates a Stripe Subscription with payment_behavior: default_incomplete and returns
 * the first invoice's PaymentIntent client_secret so the client can collect payment
 * on-site with CardElement and confirmCardPayment (nnaudio pattern). Handles trial
 * eligibility, promo codes, and duplicate subscription prevention.
 *
 * @module api/stripe/subscription-setup
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  findOrCreateCustomer,
  hasCustomerHadTrial,
} from "@/utils/stripe/actions";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import { PlanType } from "@/types/stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

const VALID_SUB_PLANS: PlanType[] = ["monthly", "annual"];

/**
 * @brief POST endpoint to create a subscription and return first invoice PaymentIntent
 *
 * Request body: { planType, email?, customerId?, promotionCode?, collectPaymentMethod?, isPlanChange? }
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
      customerId,
      promotionCode,
      collectPaymentMethod = false,
      isPlanChange = false,
    }: {
      planType: string;
      email?: string;
      customerId?: string;
      promotionCode?: string;
      collectPaymentMethod?: boolean;
      isPlanChange?: boolean;
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

    let resolvedCustomerId: string | undefined;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        resolvedCustomerId = customerId;
      } catch {
        if (email) {
          resolvedCustomerId = await findOrCreateCustomer(email);
        } else {
          return NextResponse.json(
            {
              success: false,
              error: "No such customer. Please provide an email address.",
            },
            { status: 400 },
          );
        }
      }
    } else if (email?.trim()) {
      resolvedCustomerId = await findOrCreateCustomer(email.trim());
    } else if (user?.email) {
      resolvedCustomerId = await findOrCreateCustomer(user.email);
    }

    if (!resolvedCustomerId) {
      return NextResponse.json(
        { success: false, error: "Email or customer ID is required." },
        { status: 400 },
      );
    }

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

    if (!isPlanChange) {
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
      if (promo?.coupon) {
        couponId =
          typeof promo.coupon === "string" ? promo.coupon : promo.coupon.id;
      }
    }

    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: resolvedCustomerId,
      items: [{ price: priceId }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
      },
      expand: [
        "latest_invoice",
        "latest_invoice.payments",
        "latest_invoice.payments.data.payment.payment_intent",
      ],
      metadata: {
        plan_type: planType,
        user_id: user?.id ?? "anonymous",
      },
    };
    if (couponId) subscriptionParams.coupon = couponId;
    if (trialDays != null) subscriptionParams.trial_period_days = trialDays;

    const subscription = await stripe.subscriptions.create(subscriptionParams);

    const latestInvoice = subscription.latest_invoice as Stripe.Invoice | null;
    const firstPayment = latestInvoice?.payments?.data?.[0];
    const paymentRef = firstPayment?.payment?.payment_intent;
    const paymentIntent =
      typeof paymentRef === "object" && paymentRef !== null
        ? paymentRef
        : typeof paymentRef === "string"
          ? await stripe.paymentIntents.retrieve(paymentRef)
          : undefined;

    if (!paymentIntent?.client_secret) {
      return NextResponse.json(
        { success: false, error: "Failed to create subscription payment." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      subscriptionId: subscription.id,
      type: "subscription",
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
