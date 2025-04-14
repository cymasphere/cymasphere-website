"use server";

import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCheckoutSessionResult } from "@/utils/stripe/actions";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  // If no session ID, redirect to error page
  if (!sessionId) {
    return NextResponse.redirect(
      new URL("/checkout-canceled?error=missing_session_id", request.url)
    );
  }

  try {
    // Get session details from Stripe
    const sessionResult = await getCheckoutSessionResult(sessionId);

    // If session retrieval failed, redirect to canceled page with error
    if (!sessionResult.success) {
      return NextResponse.redirect(
        new URL(
          `/checkout-canceled?error=${encodeURIComponent(
            sessionResult.error || "payment_verification_failed"
          )}`,
          request.url
        )
      );
    }

    // Check if payment was successful
    const isPaymentSuccessful =
      sessionResult.status === "complete" ||
      sessionResult.paymentStatus === "succeeded" ||
      sessionResult.paymentStatus === "paid";

    if (!isPaymentSuccessful) {
      return NextResponse.redirect(
        new URL(
          `/checkout-canceled?error=payment_incomplete&status=${sessionResult.status}`,
          request.url
        )
      );
    }

    // Check if a user exists with this customer ID
    let isSignedUp = false;
    if (sessionResult.customerId) {
      try {
        // Use direct Supabase client initialization with environment variables
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        
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
    return NextResponse.redirect(
      new URL(`/checkout-success?isSignedUp=${isSignedUp}`, request.url)
    );
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.redirect(
      new URL("/checkout-canceled?error=server_error", request.url)
    );
  }
}
