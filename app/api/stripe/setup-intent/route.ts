/**
 * @fileoverview Creates a SetupIntent so the client can collect a payment method
 * without creating a subscription or charging. After the user confirms the
 * SetupIntent, the frontend calls subscription-setup or payment-intent with
 * the resulting payment_method id to create the subscription or charge.
 *
 * @module api/stripe/setup-intent
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { findOrCreateCustomer } from "@/utils/stripe/actions";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/**
 * @brief POST endpoint to create a SetupIntent (no subscription created).
 *
 * First resolves Stripe customer by the email entered (find-or-create), then checks for an
 * existing active/trialing subscription. If one exists, returns 400 with ACTIVE_SUBSCRIPTION_EXISTS
 * so the client can prompt the user to log in. Otherwise creates and returns a SetupIntent.
 * Request body: { email? } (email required for guests; logged-in users may omit and use account email).
 * Returns: { success: true, clientSecret } or { success: false, error, message }.
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
    const { email }: { email?: string } = body;

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

    let resolvedCustomerId = await findOrCreateCustomer(checkoutEmail);

    // Before setting up payment: check if this customer already has an active subscription
    const subscriptions = await stripe.subscriptions.list({
      customer: resolvedCustomerId,
      status: "all",
      limit: 10,
    });
    const activeSubscriptions = subscriptions.data.filter(
      (s) => s.status === "active" || s.status === "trialing",
    );
    if (activeSubscriptions.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "ACTIVE_SUBSCRIPTION_EXISTS",
          message:
            "You already have an active subscription. Please log in to your account to manage it.",
        },
        { status: 400 },
      );
    }

    const createSetupIntentWithCustomer = async (customerId: string) => {
      // Card-only avoids automatic_payment_methods (Link/wallets) edge cases with off_session + Payment Element confirm.
      return stripe.setupIntents.create({
        customer: customerId,
        usage: "off_session",
        payment_method_types: ["card"],
      });
    };

    let setupIntent: Stripe.SetupIntent;
    try {
      setupIntent = await createSetupIntentWithCustomer(resolvedCustomerId);
    } catch (firstErr) {
      const msg = firstErr instanceof Error ? firstErr.message : "";
      const code = (firstErr as { code?: string })?.code;
      const isNoSuchCustomer =
        (msg.includes("No such customer") || code === "resource_missing") &&
        !!checkoutEmail;
      if (isNoSuchCustomer && checkoutEmail) {
        resolvedCustomerId = await findOrCreateCustomer(checkoutEmail);
        setupIntent = await createSetupIntentWithCustomer(resolvedCustomerId);
      } else {
        throw firstErr;
      }
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

    return NextResponse.json({
      success: true,
      clientSecret: setupIntent.client_secret,
    });
  } catch (error) {
    console.error("SetupIntent error:", error);
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
