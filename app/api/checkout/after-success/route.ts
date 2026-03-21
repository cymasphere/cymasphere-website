/**
 * @fileoverview Rate-limited POST endpoint to finalize checkout: verifies Stripe session/PI/SI,
 * then either refreshes pro status for the logged-in user or invites + refreshes for guests.
 * Replaces client-callable server actions for security.
 *
 * @module api/checkout/after-success
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";
import { verifyCheckoutArtifact } from "@/utils/checkout/verify-checkout-completion";
import { inviteUserByEmailAndRefreshProStatus } from "@/utils/checkout/post-purchase";
import { updateUserProStatus } from "@/utils/subscriptions/check-subscription";

/**
 * @brief POST: verify checkout artifact and run invite or refresh.
 *
 * Request JSON:
 * - Exactly one of: session_id, payment_intent_id, setup_intent_id
 * - Optional: first_name, last_name (guest invite)
 *
 * Responses:
 * - 200: { success, kind, subscription?, expiration?, customerEmail?, analytics? }
 * - 400: verification failed
 * - 403: authenticated user does not own Stripe customer on artifact
 * - 429: rate limited
 * - 503: subscription still provisioning (retryable)
 */
export async function POST(request: NextRequest) {
  const clientIp = getClientIp(request);
  if (!checkRateLimit(clientIp, 20, 60)) {
    return NextResponse.json(
      { success: false, error: "Too many requests. Please try again later." },
      { status: 429 },
    );
  }

  let body: {
    session_id?: string;
    payment_intent_id?: string;
    setup_intent_id?: string;
    first_name?: string;
    last_name?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const sessionId = body.session_id?.trim() || undefined;
  const paymentIntentId = body.payment_intent_id?.trim() || undefined;
  const setupIntentId = body.setup_intent_id?.trim() || undefined;

  let verified;
  try {
    verified = await verifyCheckoutArtifact({
      sessionId,
      paymentIntentId,
      setupIntentId,
    });
  } catch (err) {
    console.error("[after-success] Stripe verify error:", err);
    return NextResponse.json(
      {
        success: false,
        error: "STRIPE_UNAVAILABLE",
        message: "Could not verify checkout with Stripe. Please try again.",
      },
      { status: 503 },
    );
  }

  if (!verified.ok) {
    const status =
      verified.retryable && verified.error === "SUBSCRIPTION_PENDING"
        ? 503
        : 400;
    return NextResponse.json(
      {
        success: false,
        error: verified.error,
        retryable: verified.retryable ?? false,
      },
      { status },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const analytics = {
    isTrial: verified.isTrial,
    value: verified.value,
    currency: verified.currency,
    mode: verified.mode,
  };

  if (user?.id) {
    if (!verified.customerId) {
      return NextResponse.json(
        {
          success: false,
          error: "NO_STRIPE_CUSTOMER",
          message: "Checkout could not be tied to a Stripe customer.",
        },
        { status: 400 },
      );
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("customer_id, email")
      .eq("id", user.id)
      .single();

    const profileCustomerId = profile?.customer_id ?? null;
    const userEmail = user.email?.toLowerCase().trim() ?? null;
    const stripeEmail = verified.customerEmail;

    const customerMatches =
      profileCustomerId != null &&
      verified.customerId === profileCustomerId;
    const emailMatches =
      stripeEmail != null &&
      userEmail != null &&
      stripeEmail === userEmail;

    if (profileCustomerId) {
      if (!customerMatches && !emailMatches) {
        return NextResponse.json(
          {
            success: false,
            error: "CHECKOUT_CUSTOMER_MISMATCH",
            message:
              "This purchase belongs to a different billing profile than your account.",
          },
          { status: 403 },
        );
      }
    } else if (!emailMatches) {
      return NextResponse.json(
        {
          success: false,
          error: "CHECKOUT_EMAIL_MISMATCH",
          message:
            "Sign in with the same email you used at checkout, or wait for your account to finish linking.",
        },
        { status: 403 },
      );
    }

    const result = await updateUserProStatus(user.id, { skipEmail: true });

    return NextResponse.json({
      success: true,
      kind: "logged_in_refreshed" as const,
      subscription: result.subscription,
      expiration: result.subscriptionExpiration?.toISOString() ?? null,
      customerEmail: verified.customerEmail,
      analytics,
    });
  }

  if (!verified.customerEmail) {
    return NextResponse.json(
      {
        success: false,
        error: "NO_CUSTOMER_EMAIL",
      },
      { status: 400 },
    );
  }

  const invite = await inviteUserByEmailAndRefreshProStatus(
    verified.customerEmail,
    body.first_name,
    body.last_name,
  );

  if (!invite.success) {
    return NextResponse.json(
      {
        success: false,
        error: invite.error ?? "Invite failed",
      },
      { status: 400 },
    );
  }

  return NextResponse.json({
    success: true,
    kind: "guest_invited" as const,
    userId: invite.userId,
    subscription: invite.subscription,
    expiration: invite.expiration ?? null,
    customerEmail: verified.customerEmail,
    analytics,
  });
}
