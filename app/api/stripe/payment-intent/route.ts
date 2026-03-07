/**
 * @fileoverview Stripe Payment Intent creation API for in-app lifetime checkout
 *
 * Creates a Payment Intent for lifetime plan purchases so payment can be
 * collected on-site with Stripe Elements (no redirect to Stripe). Reuses
 * customer lookup, lifetime duplicate check, and rate limiting from checkout.
 *
 * @module api/stripe/payment-intent
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import {
  findOrCreateCustomer,
  hasCustomerPurchasedLifetime,
} from "@/utils/stripe/actions";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST endpoint to create a Payment Intent for lifetime plan
 *
 * Request body: { planType: "lifetime", email?: string, customerId?: string, savePaymentMethod?: boolean }
 * Returns: { success: true, clientSecret, paymentIntentId } or error with status 400/503.
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
      savePaymentMethod = false,
      promotionCode,
    }: {
      planType: string;
      email?: string;
      customerId?: string;
      savePaymentMethod?: boolean;
      promotionCode?: string;
    } = body;

    if (planType !== "lifetime") {
      return NextResponse.json(
        {
          success: false,
          error: "Only lifetime plan is supported for this endpoint.",
        },
        { status: 400 },
      );
    }

    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME;
    if (!lifetimePriceId) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    let stripeCustomerId: string | undefined;

    if (customerId) {
      try {
        await stripe.customers.retrieve(customerId);
        stripeCustomerId = customerId;
      } catch {
        if (email) {
          stripeCustomerId = await findOrCreateCustomer(email);
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
    } else if (email) {
      stripeCustomerId = await findOrCreateCustomer(email);
    } else if (user?.email) {
      stripeCustomerId = await findOrCreateCustomer(user.email);
    }

    if (!stripeCustomerId) {
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
          .update({ customer_id: stripeCustomerId })
          .eq("id", user.id);
      }
    }

    const hasLifetime = await hasCustomerPurchasedLifetime(stripeCustomerId);
    if (hasLifetime) {
      return NextResponse.json(
        {
          success: false,
          error: "LIFETIME_ALREADY_PURCHASED",
          message:
            "You already have a lifetime license! To purchase another license (for example, as a gift), please create a new account using a different email address.",
          hasLifetime: true,
        },
        { status: 400 },
      );
    }

    const price = await stripe.prices.retrieve(lifetimePriceId);
    let amount = price.unit_amount ?? 0;
    const currency = (price.currency as "usd") || "usd";
    if (amount < 50) {
      return NextResponse.json(
        { success: false, error: "Invalid lifetime price configuration." },
        { status: 503 },
      );
    }

    if (promotionCode?.trim()) {
      const code = promotionCode.trim();
      const list = await stripe.promotionCodes.list({
        code: code,
        active: true,
        limit: 1,
      });
      const promo = list.data[0];
      if (promo?.coupon) {
        const coupon =
          typeof promo.coupon === "string"
            ? await stripe.coupons.retrieve(promo.coupon)
            : promo.coupon;
        if (coupon.valid) {
          if (coupon.percent_off != null) {
            amount = Math.round((amount * (100 - coupon.percent_off)) / 100);
          } else if (
            coupon.amount_off != null &&
            coupon.currency === currency
          ) {
            amount = Math.max(50, amount - coupon.amount_off);
          }
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      customer: stripeCustomerId,
      setup_future_usage: savePaymentMethod ? "off_session" : undefined,
      metadata: {
        purchase_type: "lifetime",
        plan_type: "lifetime",
        user_id: user?.id ?? "anonymous",
      },
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to create payment intent";
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
