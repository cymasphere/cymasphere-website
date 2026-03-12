/**
 * @fileoverview Create a SetupIntent for the current user to update their payment method in-app.
 * @module api/stripe/customer-portal/update-payment-method
 *
 * Requires auth. Resolves customer_id from profile, ensures user has an active Stripe subscription,
 * creates a SetupIntent for that customer, returns client_secret for the Payment Element.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST handler: create SetupIntent for in-app payment method update.
 * @returns { clientSecret } for Stripe Elements, or error.
 */
export async function POST(request: Request) {
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

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "active",
      limit: 5,
    });
    const trialing = await stripe.subscriptions.list({
      customer: customerId,
      status: "trialing",
      limit: 5,
    });
    const activeOrTrialing = [
      ...subscriptions.data,
      ...trialing.data.filter(
        (s) => !subscriptions.data.some((a) => a.id === s.id),
      ),
    ];
    if (activeOrTrialing.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No active subscription found to update payment method for.",
        },
        { status: 400 },
      );
    }

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      usage: "off_session",
      automatic_payment_methods: { enabled: true },
    });

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("Update payment method SetupIntent error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to create setup intent";
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
