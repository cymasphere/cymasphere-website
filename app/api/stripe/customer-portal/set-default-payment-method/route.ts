/**
 * @fileoverview Set the default payment method for the current user's subscription.
 * @module api/stripe/customer-portal/set-default-payment-method
 *
 * Requires auth. Accepts paymentMethodId from a confirmed SetupIntent, verifies it belongs
 * to the customer, sets invoice_settings.default_payment_method, and updates every active
 * or trialing subscription’s default_payment_method so billing UI and renewals stay aligned.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import { listActiveTrialingSubscriptionsNewestFirst } from "@/utils/stripe/active-subscriptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST handler: set default payment method on user's subscription.
 * @param request Body: { paymentMethodId: string }
 * @returns { success } or error.
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
    const paymentMethodId =
      typeof body?.paymentMethodId === "string" ? body.paymentMethodId.trim() : null;
    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: "paymentMethodId is required." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.customer_id as string | null;
    if (!customerId) {
      return NextResponse.json(
        { success: false, error: "No customer account found." },
        { status: 400 },
      );
    }

    const activeOrTrialing =
      await listActiveTrialingSubscriptionsNewestFirst(stripe, customerId);
    if (activeOrTrialing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active subscription found.",
        },
        { status: 400 },
      );
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const pmCustomer =
      typeof pm.customer === "string" ? pm.customer : pm.customer?.id;
    if (pmCustomer !== customerId) {
      return NextResponse.json(
        {
          success: false,
          error:
            "This payment method does not belong to your account. Complete the card form again.",
        },
        { status: 400 },
      );
    }

    await stripe.customers.update(customerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    });

    await Promise.all(
      activeOrTrialing.map((sub) =>
        stripe.subscriptions.update(sub.id, {
          default_payment_method: paymentMethodId,
        }),
      ),
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Set default payment method error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to update payment method";
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
