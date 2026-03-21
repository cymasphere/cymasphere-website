/**
 * @fileoverview Read-only checkout details for analytics (no PII). Verifies the Stripe
 * artifact is in a completed/succeeded state before returning amounts. Use POST
 * /api/checkout/after-success for invite flows and customer email.
 *
 * @module api/checkout-session-details
 *
 * Query: exactly one of session_id, payment_intent_id, setup_intent_id.
 * Response never includes customerId or customerEmail (PII).
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyCheckoutArtifact } from "@/utils/checkout/verify-checkout-completion";

/**
 * @brief GET handler returning non-sensitive fields only.
 * @param request - Request with search params
 * @returns JSON { success, value, currency, isTrial, mode } or error
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");
  const paymentIntentId = searchParams.get("payment_intent_id");
  const setupIntentId = searchParams.get("setup_intent_id");

  let verified;
  try {
    verified = await verifyCheckoutArtifact({
      sessionId,
      paymentIntentId,
      setupIntentId,
    });
  } catch (err) {
    console.error("[checkout-session-details] Stripe verify error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "STRIPE_UNAVAILABLE",
      },
      { status: 503 },
    );
  }

  if (!verified.ok) {
    const status = verified.retryable ? 503 : 400;
    return NextResponse.json(
      {
        success: false,
        error: verified.error,
        retryable: verified.retryable ?? false,
      },
      { status },
    );
  }

  const modeOut =
    verified.mode === "setup"
      ? "setup"
      : verified.mode === "payment"
        ? "payment"
        : "subscription";

  return NextResponse.json({
    success: true,
    value: verified.value,
    currency: verified.currency,
    isTrial: verified.isTrial,
    mode: modeOut,
  });
}
