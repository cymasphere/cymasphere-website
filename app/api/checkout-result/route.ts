"use server";

import { type NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCheckoutSessionResult } from "@/utils/stripe/actions";

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

    // Check if user is signed up from metadata (set when checkout is initiated)
    // If user was logged in when starting checkout, is_signed_up will be "true"
    const isSignedUp = sessionResult.metadata?.is_signed_up === "true";

    // Determine if this is a free trial
    // BULLETPROOF: Multiple redundant checks to ensure 100% accuracy
    let isTrial = false;
    let subscription: any = null;
    
    if (sessionResult.mode === "subscription") {
      // CHECK 1: Session subscription_data has trial_period_days (set when session was created)
      // This is the most reliable indicator from the session itself
      if (sessionResult.subscriptionData?.trial_period_days && sessionResult.subscriptionData.trial_period_days > 0) {
        isTrial = true;
        console.log(`[Checkout Result] Trial detected via subscription_data.trial_period_days: ${sessionResult.subscriptionData.trial_period_days}`);
      }
      
      // CHECK 2: hasTrialPeriod flag from getCheckoutSessionResult
      if (sessionResult.hasTrialPeriod === true) {
        isTrial = true;
        console.log(`[Checkout Result] Trial detected via hasTrialPeriod flag`);
      }
      
      // CHECK 3: Retrieve subscription and check trial_end (DEFINITIVE - most reliable)
      const subscriptionId = sessionResult.subscriptionId || 
        (typeof sessionResult.subscription === "string" 
          ? sessionResult.subscription 
          : sessionResult.subscription?.id);
      
      if (subscriptionId) {
        const { default: Stripe } = await import("stripe");
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
        
        try {
          subscription = await stripe.subscriptions.retrieve(subscriptionId, {
            expand: ["items.data.price"]
          });
          
          // DEFINITIVE CHECK: If subscription has trial_end, it's a trial
          // trial_end is set when subscription is created with trial_period_days
          // Even if trial_end is in the past, it means it HAD a trial
          // But for active trials, trial_end will be in the future
          const now = Math.floor(Date.now() / 1000);
          if (subscription.trial_end) {
            // If trial_end exists and is in the future, it's an active trial
            if (subscription.trial_end > now) {
              isTrial = true;
              console.log(`[Checkout Result] Trial detected via subscription.trial_end (active trial, ends in ${Math.floor((subscription.trial_end - now) / 86400)} days)`);
            } else {
              // Trial ended but subscription was created with trial - still mark as trial for historical accuracy
              // But this shouldn't happen for new checkouts - only for old subscriptions
              isTrial = true;
              console.log(`[Checkout Result] Trial detected via subscription.trial_end (expired trial)`);
            }
          }
          
          // CHECK 4: Status is explicitly "trialing"
          if (subscription.status === "trialing") {
            isTrial = true;
            console.log(`[Checkout Result] Trial detected via subscription.status: trialing`);
          }
          
          // CHECK 5: trial_start exists (indicates trial was set up)
          if (subscription.trial_start) {
            isTrial = true;
            console.log(`[Checkout Result] Trial detected via subscription.trial_start`);
          }
        } catch (error) {
          console.error("[Checkout Result] Error retrieving subscription:", error);
          // If retrieval fails, rely on subscription_data and hasTrialPeriod checks
          // Don't set isTrial to false if we already detected it via other methods
          if (!isTrial && !sessionResult.subscriptionData?.trial_period_days && !sessionResult.hasTrialPeriod) {
            isTrial = false;
            console.log(`[Checkout Result] Trial detection failed - subscription retrieval error and no other indicators`);
          }
        }
      } else {
        // No subscription ID available - rely on session data only
        console.log(`[Checkout Result] No subscription ID available, using session data only`);
        if (!isTrial && !sessionResult.subscriptionData?.trial_period_days && !sessionResult.hasTrialPeriod) {
          isTrial = false;
        }
      }
      
      // CHECK 6: If mode is subscription and amount_total is 0/null, it's likely a trial
      // This is a safety net for edge cases
      if (!isTrial && (sessionResult.amountTotal === 0 || sessionResult.amountTotal === null || sessionResult.amountTotal === undefined)) {
        // Only use this as a fallback if we have subscription data indicating trial
        if (sessionResult.subscriptionData?.trial_period_days || sessionResult.hasTrialPeriod) {
          isTrial = true;
          console.log(`[Checkout Result] Trial detected via amount_total check (no payment collected)`);
        }
      }
    }

    // Log trial detection for debugging
    console.log(`[Checkout Result] Trial Detection:`, {
      mode: sessionResult.mode,
      hasTrialPeriod: sessionResult.hasTrialPeriod,
      subscriptionId: sessionResult.subscriptionId,
      subscriptionStatus: subscription?.status || 'N/A',
      trial_end: subscription?.trial_end || 'N/A',
      trial_start: subscription?.trial_start || 'N/A',
      isTrial: isTrial
    });

    // Get subscription value and currency for dataLayer tracking
    let subscriptionValue: number | undefined;
    let subscriptionCurrency: string | undefined;

    // Use the subscription we already retrieved above
    if (sessionResult.mode === "subscription" && subscription) {
      // Get the amount from the subscription (only if not a trial)
      if (!isTrial && subscription.items?.data?.[0]?.price) {
        subscriptionValue =
          (subscription.items.data[0].price.unit_amount || 0) / 100; // Convert cents to dollars
        subscriptionCurrency = subscription.currency?.toUpperCase() || "USD";
      }
    } else if (sessionResult.mode === "payment") {
      // For one-time payments (lifetime), we need to get amount_total from the session
      // The session object should have amount_total, but we need to retrieve it with the session
      // For now, we'll let the frontend fetch it via the session details API
    }

    // Determine if this is a lifetime purchase (one-time payment)
    const isLifetime = sessionResult.mode === "payment";

    // Get value for lifetime purchases
    if (isLifetime && sessionResult.amountTotal) {
      subscriptionValue = sessionResult.amountTotal / 100; // Convert cents to dollars
      subscriptionCurrency = sessionResult.currency?.toUpperCase() || "USD";
    }

    // If this is a subscription with a trial, immediately refresh subscription status
    // This helps avoid race conditions where the plugin checks before webhook processes
    if (isTrial && subscription) {
      try {
        const userId = sessionResult.metadata?.user_id;

        if (userId) {
          // Import and call subscription check to update profile immediately
          const { updateUserProStatus } = await import(
            "@/utils/subscriptions/check-subscription"
          );
          await updateUserProStatus(userId);
          console.log(
            `[Checkout Result] Refreshed subscription status for user ${userId} after trial signup`
          );
        }
      } catch (error) {
        console.error(
          "[Checkout Result] Error refreshing subscription status:",
          error
        );
        // Don't fail the redirect if this fails - webhook will handle it
      }
    }

    // Build redirect URL with all necessary parameters
    const params = new URLSearchParams({
      isSignedUp: isSignedUp.toString(),
      isTrial: isTrial.toString(),
      isLifetime: isLifetime.toString(),
      session_id: sessionId,
    });

    if (subscriptionValue !== undefined && subscriptionCurrency) {
      params.append("value", subscriptionValue.toString());
      params.append("currency", subscriptionCurrency);
    }

    // Payment successful, redirect to success page with appropriate parameters
    return NextResponse.redirect(
      new URL(`/checkout-success?${params.toString()}`, request.url)
    );
  } catch (error) {
    console.error("Error processing checkout:", error);
    return NextResponse.redirect(
      new URL("/checkout-canceled?error=server_error", request.url)
    );
  }
}
