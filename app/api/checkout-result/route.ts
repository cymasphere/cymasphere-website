"use server";

import { type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { getCheckoutSessionResult } from "@/utils/stripe/actions";

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

    // Check if user exists with this customer ID in Supabase
    let userExists = false;

    if (sessionResult.customerId) {
      // Create supabase client
      const supabase = await createClient();

      // Query Supabase to check if a user profile exists with this customer ID
      const { data, error: supabaseError } = await supabase
        .from("profiles")
        .select("id")
        .eq("customer_id", sessionResult.customerId)
        .maybeSingle();

      if (supabaseError) {
        console.error("Supabase query error:", supabaseError);
      } else if (data) {
        userExists = true;
      }
    }

    // Redirect to success page with all needed information
    const successUrl = `/checkout-success?session_id=${sessionId}&user_exists=${userExists}`;

    if (sessionResult.customerEmail) {
      return redirect(
        `${successUrl}&email=${encodeURIComponent(sessionResult.customerEmail)}`
      );
    }

    return redirect(successUrl);
  } catch (error) {
    console.error("Error processing checkout:", error);
    return redirect("/checkout-canceled?error=server_error");
  }
}
