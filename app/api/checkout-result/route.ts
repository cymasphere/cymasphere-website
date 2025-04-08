"use server";

import { type NextRequest } from "next/server";
import { redirect } from "next/navigation";
import { getCheckoutSessionResult } from "@/utils/stripe/actions";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  // If no session ID, redirect to error page
  if (!sessionId) {
    return redirect("/checkout-canceled?error=missing_session_id");
  }

  try {
    // Get session details from Stripe
    const sessionResult = await getCheckoutSessionResult(sessionId);

    // If session retrieval failed, redirect to canceled page with error
    if (!sessionResult.success) {
      return redirect(
        `/checkout-canceled?error=${encodeURIComponent(
          sessionResult.error || "payment_verification_failed"
        )}`
      );
    }

    // Check if payment was successful
    const isPaymentSuccessful =
      sessionResult.status === "complete" ||
      sessionResult.paymentStatus === "succeeded" ||
      sessionResult.paymentStatus === "paid";

    if (!isPaymentSuccessful) {
      return redirect(
        `/checkout-canceled?error=payment_incomplete&status=${sessionResult.status}`
      );
    }

    // Check if a user exists with this customer ID
    let isSignedUp = false;
    if (sessionResult.customerId) {
      try {
        const supabase = await createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select()
          .eq("customer_id", sessionResult.customerId)
          .maybeSingle();

        // If a profile was found, the user is signed up
        isSignedUp = !!profile;
      } catch (error) {
        console.error("Error checking user profile:", error);
        // Continue with isSignedUp = false on error
      }
    }

    // Payment successful, redirect to success page with appropriate parameter
    return redirect(`/checkout-success?isSignedUp=${isSignedUp}`);
  } catch (error) {
    console.error("Error processing checkout:", error);
    return redirect("/checkout-canceled?error=server_error");
  }
}
