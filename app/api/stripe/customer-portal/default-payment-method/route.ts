/**
 * @fileoverview Returns a safe summary of the signed-in user's default Stripe payment method.
 * @module api/stripe/customer-portal/default-payment-method
 *
 * Resolves the default payment method from the active/trialing subscription first, then
 * falls back to the customer's invoice_settings default. Card details are non-sensitive
 * (brand, last4, expiry).
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const STRIPE_UNAVAILABLE_MSG =
  "Payment service is temporarily unavailable. Please try again later.";

/** @brief Serializable payment method summary for the billing UI. */
type DefaultPaymentMethodSummary =
  | {
      kind: "card";
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    }
  | { kind: "other"; label: string };

/**
 * @brief Maps a Stripe PaymentMethod to a client-safe shape.
 * @param pm Retrieved Stripe PaymentMethod
 * @returns Summary or null if unsupported / missing details
 */
function toSummary(pm: Stripe.PaymentMethod): DefaultPaymentMethodSummary | null {
  if (pm.type === "card" && pm.card) {
    return {
      kind: "card",
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    };
  }
  if (pm.type === "us_bank_account" && pm.us_bank_account) {
    const bank = pm.us_bank_account;
    const name = bank.bank_name ?? "Bank account";
    return {
      kind: "other",
      label: bank.last4 ? `${name} ····${bank.last4}` : name,
    };
  }
  if (pm.type === "link" && pm.link?.email) {
    return { kind: "other", label: `Link (${pm.link.email})` };
  }
  return { kind: "other", label: pm.type.replace(/_/g, " ") };
}

/**
 * @brief GET: default payment method for the authenticated user's Stripe customer.
 *
 * @returns **200** `{ success: true, paymentMethod: DefaultPaymentMethodSummary | null }`
 * @returns **401** `{ success: false, error: "Unauthorized" }` when not signed in
 * @returns **503** when Stripe is not configured
 *
 * @example
 * ```json
 * { "success": true, "paymentMethod": { "kind": "card", "brand": "visa", "last4": "4242", "expMonth": 12, "expYear": 2030 } }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    if (!process.env.STRIPE_SECRET_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: STRIPE_UNAVAILABLE_MSG },
        { status: 503 },
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

    const clientIp = getClientIp(request);
    if (!checkRateLimit(`default-pm:${user.id}:${clientIp}`, 40, 60)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id")
      .eq("id", user.id)
      .single();

    const customerId = profile?.customer_id as string | null;
    if (!customerId) {
      return NextResponse.json({
        success: true,
        paymentMethod: null,
      });
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

    let paymentMethodId: string | null = null;
    if (activeOrTrialing.length > 0) {
      const dpm = activeOrTrialing[0].default_payment_method;
      paymentMethodId =
        typeof dpm === "string" ? dpm : (dpm?.id ?? null);
    }

    if (!paymentMethodId) {
      const customer = await stripe.customers.retrieve(customerId, {
        expand: ["invoice_settings.default_payment_method"],
      });
      if (!customer.deleted) {
        const inv = customer.invoice_settings?.default_payment_method;
        if (inv && typeof inv !== "string") {
          paymentMethodId = inv.id;
        } else if (typeof inv === "string") {
          paymentMethodId = inv;
        }
      }
    }

    if (!paymentMethodId) {
      return NextResponse.json({
        success: true,
        paymentMethod: null,
      });
    }

    const pm = await stripe.paymentMethods.retrieve(paymentMethodId);
    const summary = toSummary(pm);

    return NextResponse.json({
      success: true,
      paymentMethod: summary,
    });
  } catch (error) {
    console.error("Default payment method GET error:", error);
    const msg =
      error instanceof Error ? error.message : "Failed to load payment method";
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
