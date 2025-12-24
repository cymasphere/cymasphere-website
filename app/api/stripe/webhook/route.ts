/**
 * @fileoverview Stripe webhook handler API endpoint
 * 
 * This endpoint receives and processes Stripe webhook events. Validates webhook
 * signatures for security, extracts customer information from events, and updates
 * user subscription status in the database. Handles all Stripe event types that
 * may affect subscription status (payments, subscriptions, invoices, etc.).
 * 
 * @module api/stripe/webhook
 */

"use server";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { updateUserProStatus } from "@/utils/subscriptions/check-subscription";

/**
 * Stripe client instance initialized with secret key from environment variables
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief Extracts customer ID from any Stripe event object
 * 
 * Attempts to extract the customer ID from a Stripe event's data object.
 * Handles both string customer IDs and customer objects with nested IDs.
 * 
 * @param event Stripe webhook event object
 * @returns Customer ID string if found, null otherwise
 * @note Works with any event type that has a customer field
 * 
 * @example
 * ```typescript
 * const customerId = extractCustomerId(stripeEvent);
 * // Returns: "cus_abc123" or null
 * ```
 */
function extractCustomerId(event: Stripe.Event): string | null {
  const obj = event.data.object;

  // Check if the object has a customer field
  if ("customer" in obj && obj.customer) {
    return typeof obj.customer === "string" ? obj.customer : obj.customer.id;
  }

  return null;
}

/**
 * @brief Finds user ID in database by Stripe customer ID
 * 
 * Searches for a user profile by Stripe customer ID. First attempts direct
 * lookup by customer_id field. If not found, retrieves customer email from
 * Stripe and searches by email, then updates the profile with the customer_id
 * for future lookups.
 * 
 * @param customerId Stripe customer ID to search for
 * @returns User ID (UUID) if found, null otherwise
 * @note Falls back to email lookup if customer_id not found in database
 * @note Updates customer_id in profile if found via email lookup
 * 
 * @example
 * ```typescript
 * const userId = await findUserIdByCustomerId("cus_abc123");
 * // Returns: "uuid" or null
 * ```
 */
async function findUserIdByCustomerId(
  customerId: string
): Promise<string | null> {
  const supabase = await createSupabaseServiceRole();

  // First try to find by customer_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("customer_id", customerId)
    .single();

  if (profile) {
    return profile.id;
  }

  // If not found, try to get customer email from Stripe and find by email
  try {
    const customer = await stripe.customers.retrieve(customerId);
    if (typeof customer === "object" && !customer.deleted && customer.email) {
      const { data: profileByEmail } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customer.email)
        .single();

      if (profileByEmail) {
        // Update customer_id for future lookups
        await supabase
          .from("profiles")
          .update({ customer_id: customerId })
          .eq("id", profileByEmail.id);

        return profileByEmail.id;
      }
    }
  } catch (error) {
    console.error("Error retrieving customer from Stripe:", error);
  }

  return null;
}

/**
 * @brief POST endpoint to handle Stripe webhook events
 * 
 * Receives and processes Stripe webhook events. Validates webhook signature
 * for security, extracts customer information, finds the associated user,
 * and refreshes their subscription status. Handles all event types that may
 * affect subscription status.
 * 
 * Request headers:
 * - stripe-signature: Stripe webhook signature for verification (required)
 * 
 * Request body:
 * - Raw webhook event payload from Stripe (JSON string)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "status": "success",
 *   "event": "checkout.session.completed"
 * }
 * ```
 * 
 * 200 OK - No customer ID in event:
 * ```json
 * {
 *   "status": "success",
 *   "event": "payment_intent.created"
 * }
 * ```
 * 
 * 400 Bad Request - Invalid signature:
 * ```json
 * {
 *   "error": "Invalid signature"
 * }
 * ```
 * 
 * 200 OK - Processing error:
 * ```json
 * {
 *   "status": "error",
 *   "error": "Error message"
 * }
 * ```
 * 
 * @param request Next.js request object containing webhook payload and signature
 * @returns NextResponse with processing status
 * @note Webhook signature is verified using STRIPE_WEBHOOK_SECRET
 * @note Subscription status is refreshed using centralized updateUserProStatus function
 * @note Events without customer IDs are accepted but skipped
 * @note All Stripe event types are supported
 * 
 * @example
 * ```typescript
 * // POST /api/stripe/webhook
 * // Headers: { "stripe-signature": "..." }
 * // Body: Raw Stripe webhook event JSON
 * // Returns: { status: "success", event: "checkout.session.completed" }
 * ```
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get("stripe-signature") as string;
  let event: Stripe.Event;

  try {
    const body = await request.text();
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook signature verification failed:", errorMessage);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const dateTime = new Date(event.created * 1000).toISOString();

  try {
    console.log("Processing Stripe event:", event.type, "at", dateTime);

    // Extract customer ID from event
    const customerId = extractCustomerId(event);

    if (!customerId) {
      console.log("No customer ID found in event, skipping");
      return NextResponse.json({ status: "success", event: event.type });
    }

    // Find user by customer ID
    const userId = await findUserIdByCustomerId(customerId);

    // If user exists, refresh subscription status using centralized function
    if (userId) {
      console.log(
        `Refreshing subscription for user ${userId} (customer: ${customerId})`
      );
      const result = await updateUserProStatus(userId);
      console.log(
        `Subscription updated: ${result.subscription} (${result.source})`
      );
    }

    return NextResponse.json({ status: "success", event: event.type });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ status: "error", error });
  }
}
