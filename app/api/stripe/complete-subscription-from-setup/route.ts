/**
 * @fileoverview Completes subscription creation after Stripe redirect (e.g. 3DS).
 * @module api/stripe/complete-subscription-from-setup
 *
 * When the user completes confirmSetup with 3DS, Stripe redirects to checkout-success
 * with setup_intent and redirect_status. This endpoint retrieves the SetupIntent,
 * gets the payment_method, and creates the subscription via the same logic as
 * subscription-setup (so the subscription is created only when payment/setup actually succeeded).
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST endpoint to create a subscription using a completed SetupIntent.
 *
 * Request body: { setupIntentId, planType, email, promotionCode?, collectPaymentMethod?, isPlanChange? }
 * Retrieves SetupIntent, verifies status is succeeded, gets payment_method, then forwards
 * to subscription-setup with paymentMethodId so the subscription is created server-side.
 *
 * @param request Next.js request with JSON body
 * @returns NextResponse with success and subscriptionId or error
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
      );
    }

    const body = await request.json();
    const {
      setupIntentId,
      planType,
      email,
      customerId,
      promotionCode,
      collectPaymentMethod = false,
      isPlanChange = false,
    }: {
      setupIntentId?: string;
      planType?: string;
      email?: string;
      customerId?: string;
      promotionCode?: string;
      collectPaymentMethod?: boolean;
      isPlanChange?: boolean;
    } = body;

    if (!setupIntentId?.trim() || !planType || !email?.trim()) {
      return NextResponse.json(
        {
          success: false,
          error: "setupIntentId, planType, and email are required.",
        },
        { status: 400 },
      );
    }

    const validPlans = ["monthly", "annual"];
    if (!validPlans.includes(planType)) {
      return NextResponse.json(
        {
          success: false,
          error: "planType must be monthly or annual.",
        },
        { status: 400 },
      );
    }

    const setupIntent = await stripe.setupIntents.retrieve(
      setupIntentId.trim(),
    );
    if (setupIntent.status !== "succeeded") {
      return NextResponse.json(
        {
          success: false,
          error:
            "SetupIntent has not succeeded yet. Please complete authentication.",
        },
        { status: 400 },
      );
    }

    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;
    if (!paymentMethodId) {
      return NextResponse.json(
        { success: false, error: "No payment method on SetupIntent." },
        { status: 400 },
      );
    }

    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (request.nextUrl?.origin ?? "http://localhost:3000");
    const res = await fetch(`${baseUrl}/api/stripe/subscription-setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planType,
        email: email.trim(),
        customerId: customerId ?? undefined,
        promotionCode: promotionCode?.trim() || undefined,
        collectPaymentMethod,
        isPlanChange,
        paymentMethodId,
      }),
    });
    const data = await res.json();

    if (!data.success) {
      return NextResponse.json(
        {
          success: false,
          error: data.error ?? data.message ?? "Subscription creation failed",
        },
        { status: res.status >= 400 ? res.status : 500 },
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: data.subscriptionId,
      type: "subscription",
    });
  } catch (error) {
    console.error("Complete subscription from setup error:", error);
    const msg =
      error instanceof Error ? error.message : "Subscription creation failed";
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
