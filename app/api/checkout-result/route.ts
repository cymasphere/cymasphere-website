/**
 * @fileoverview Validates a completed Stripe Checkout Session and redirects to success or canceled.
 * Uses centralized verifyCheckoutArtifact (same rules as post-purchase) to avoid incomplete sessions.
 *
 * @module api/checkout-result
 */

import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { verifyCheckoutArtifact } from "@/utils/checkout/verify-checkout-completion";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(
      new URL("/checkout-canceled?error=missing_session_id", request.url),
    );
  }

  try {
    const verified = await verifyCheckoutArtifact({ sessionId });

    if (!verified.ok) {
      return NextResponse.redirect(
        new URL(
          `/checkout-canceled?error=${encodeURIComponent(verified.error)}`,
          request.url,
        ),
      );
    }

    const isSignedUp =
      verified.sessionMetadata?.is_signed_up === "true" ||
      verified.sessionMetadata?.is_signed_up === "True";

    const isLifetime = verified.mode === "payment";
    const params = new URLSearchParams({
      isSignedUp: String(isSignedUp),
      isTrial: String(verified.isTrial),
      isLifetime: String(isLifetime),
      session_id: sessionId,
    });

    if (verified.value != null) {
      params.append("value", String(verified.value));
      params.append("currency", verified.currency);
    }

    const userId = verified.sessionMetadata?.user_id;
    if (verified.isTrial && userId) {
      try {
        const { updateUserProStatus } = await import(
          "@/utils/subscriptions/check-subscription"
        );
        await updateUserProStatus(userId, { skipEmail: true });
        console.log(
          `[Checkout Result] Refreshed subscription status for user ${userId} after trial signup`,
        );
      } catch (error) {
        console.error(
          "[Checkout Result] Error refreshing subscription status:",
          error,
        );
      }
    }

    return NextResponse.redirect(
      new URL(`/checkout-success?${params.toString()}`, request.url),
    );
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.redirect(
      new URL("/checkout-canceled?error=server_error", request.url),
    );
  }
}
