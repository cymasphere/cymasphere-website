/**
 * @fileoverview Remove cancel-at-period-end from the current user's subscription (in-app).
 * @module api/stripe/customer-portal/reactivate-subscription
 *
 * Requires auth. Resolves customer_id and subscription set to cancel, then updates
 * subscription with cancel_at_period_end: false.
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST handler: set cancel_at_period_end to false on user's subscription.
 * @returns { success } or error.
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
      limit: 10,
    });
    const toReactivate = subscriptions.data.find(
      (s) => s.cancel_at_period_end === true,
    );
    if (!toReactivate) {
      return NextResponse.json(
        {
          success: false,
          error: "No subscription scheduled for cancellation found.",
        },
        { status: 400 },
      );
    }

    await stripe.subscriptions.update(toReactivate.id, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reactivate subscription error:", error);
    const msg =
      error instanceof Error
        ? error.message
        : "Failed to reactivate subscription";
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
