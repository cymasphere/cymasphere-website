/**
 * @fileoverview Set the current user's subscription to cancel at period end (in-app).
 * @module api/stripe/customer-portal/cancel-subscription
 *
 * Requires auth. Resolves customer_id and active subscription, then updates
 * subscription with cancel_at_period_end: true.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST handler: set cancel_at_period_end on user's active subscription.
 * @returns { success, currentPeriodEnd } or error.
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
          error: "No active subscription found to cancel.",
        },
        { status: 400 },
      );
    }

    const subscriptionId = activeOrTrialing[0].id;
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    const currentPeriodEnd =
      subscription && typeof subscription === "object" && "current_period_end" in subscription
        ? new Date((subscription as { current_period_end: number }).current_period_end * 1000).toISOString()
        : null;

    return NextResponse.json({
      success: true,
      currentPeriodEnd,
    });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to cancel subscription";
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
