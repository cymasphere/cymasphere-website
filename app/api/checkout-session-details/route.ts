"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * API endpoint to get checkout session details for dataLayer tracking
 * Returns JSON instead of redirecting
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.json(
      { error: "Missing session_id parameter" },
      { status: 400 }
    );
  }

  try {
    // Retrieve the session directly to get amount_total for one-time payments
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "payment_intent", "customer"],
    });

    // Extract customer ID and email
    let customerId: string | null = null;
    let customerEmail: string | null = null;
    if (session.customer) {
      if (typeof session.customer === "string") {
        customerId = session.customer;
      } else {
        customerId = session.customer.id;
        // Get email from customer object if available
        if (!session.customer.deleted && "email" in session.customer) {
          customerEmail = session.customer.email || null;
        }
      }
    }

    // If we have customer ID but no email, try to retrieve customer
    if (customerId && !customerEmail) {
      try {
        const customer = await stripe.customers.retrieve(customerId);
        if (typeof customer === "object" && !customer.deleted && customer.email) {
          customerEmail = customer.email;
        }
      } catch (error) {
        console.error("Error retrieving customer email:", error);
      }
    }

    // Extract value and currency
    let value: number | null = null;
    let currency: string = "USD";
    let isTrial = false;

    if (session.mode === "subscription") {
      // BULLETPROOF: Multiple checks for trial detection
      
      // CHECK 1: Session subscription_data has trial_period_days
      if (session.subscription_data?.trial_period_days && session.subscription_data.trial_period_days > 0) {
        isTrial = true;
        console.log(`[Checkout Session Details] Trial detected via subscription_data.trial_period_days: ${session.subscription_data.trial_period_days}`);
      }
      
      // CHECK 2: Check subscription object if available
      if (session.subscription) {
        const subscription =
          typeof session.subscription === "string"
            ? await stripe.subscriptions.retrieve(session.subscription, {
                expand: ["items.data.price"]
              })
            : session.subscription;

        // Check if subscription has a trial - check trial_end, trial_start, or status
        const hasTrialEnd = !!subscription.trial_end;
        const hasTrialStart = !!subscription.trial_start;
        const isTrialingStatus = subscription.status === "trialing";
        
        if (hasTrialEnd || hasTrialStart || isTrialingStatus) {
          isTrial = true;
          console.log(`[Checkout Session Details] Trial detected via subscription: trial_end=${hasTrialEnd}, trial_start=${hasTrialStart}, status=${subscription.status}`);
        }

        // Get value only if NOT a trial
        if (!isTrial && subscription.items?.data?.[0]?.price) {
          value = (subscription.items.data[0].price.unit_amount || 0) / 100;
          currency = subscription.currency?.toUpperCase() || "USD";
        }
      }
      
      // CHECK 3: If amount_total is 0/null and subscription_data has trial_period_days, it's a trial
      if (!isTrial && (session.amount_total === 0 || session.amount_total === null) && session.subscription_data?.trial_period_days) {
        isTrial = true;
        console.log(`[Checkout Session Details] Trial detected via amount_total check (no payment collected)`);
      }
    } else if (session.mode === "payment" && session.amount_total) {
      // For one-time payments (lifetime), use amount_total
      value = session.amount_total / 100; // Convert cents to dollars
      currency = session.currency?.toUpperCase() || "USD";
      isTrial = false; // Lifetime purchases are never trials
    }

    return NextResponse.json({
      success: true,
      value,
      currency,
      isTrial,
      mode: session.mode, // 'payment' for lifetime, 'subscription' for recurring
      customerId, // Customer ID from the checkout session
      customerEmail, // Customer email from the checkout session
    });
  } catch (error) {
    console.error("Error fetching checkout session details:", error);
    return NextResponse.json(
      { error: "Failed to fetch session details" },
      { status: 500 }
    );
  }
}
