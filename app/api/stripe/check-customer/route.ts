/**
 * @fileoverview Stripe customer existence and history check API endpoint
 * 
 * This endpoint checks if a Stripe customer exists for a given email address
 * and provides information about their transaction history and subscription status.
 * Used to determine if a customer is eligible for trials or special offers.
 * 
 * @module api/stripe/check-customer
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

/**
 * Stripe client instance initialized with secret key from environment variables
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief POST endpoint to check customer existence and history
 * 
 * Searches for Stripe customers by email and checks their transaction history
 * (payment intents, invoices) and active subscription status. Returns whether
 * the customer exists, has prior transactions, and has active subscriptions.
 * 
 * Request body (JSON):
 * - email: Customer email address to check (required)
 * 
 * Responses:
 * 
 * 200 OK - Customer exists with history:
 * ```json
 * {
 *   "exists": true,
 *   "hasPriorTransactions": true,
 *   "hasActiveSubscription": true
 * }
 * ```
 * 
 * 200 OK - Customer exists, no history:
 * ```json
 * {
 *   "exists": true,
 *   "hasPriorTransactions": false,
 *   "hasActiveSubscription": false
 * }
 * ```
 * 
 * 200 OK - Customer does not exist:
 * ```json
 * {
 *   "exists": false,
 *   "hasPriorTransactions": false,
 *   "hasActiveSubscription": false
 * }
 * ```
 * 
 * 400 Bad Request - Missing email:
 * ```json
 * {
 *   "exists": false,
 *   "hasPriorTransactions": false,
 *   "hasActiveSubscription": false,
 *   "error": "Email is required"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "exists": false,
 *   "hasPriorTransactions": false,
 *   "hasActiveSubscription": false,
 *   "error": "Failed to check customer"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with email
 * @returns NextResponse with customer existence and history information
 * @note Checks up to 10 customers with the same email (handles duplicates)
 * @note Checks payment intents, invoices, and subscriptions for transaction history
 * @note Active subscriptions include both "active" and "trialing" statuses
 * 
 * @example
 * ```typescript
 * // POST /api/stripe/check-customer
 * // Body: { email: "user@example.com" }
 * // Returns: { exists: true, hasPriorTransactions: true, hasActiveSubscription: false }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email }: { email: string } = body;

    if (!email) {
      return NextResponse.json(
        {
          exists: false,
          hasPriorTransactions: false,
          hasActiveSubscription: false,
          error: "Email is required",
        },
        { status: 400 }
      );
    }

    const result = await checkExistingCustomer(email);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error checking customer:", error);
    return NextResponse.json(
      {
        exists: false,
        hasPriorTransactions: false,
        hasActiveSubscription: false,
        error:
          error instanceof Error ? error.message : "Failed to check customer",
      },
      { status: 500 }
    );
  }
}

/**
 * @brief Checks if a customer exists in Stripe and their transaction history
 * 
 * Searches for Stripe customers by email and examines their payment history
 * (payment intents and invoices) and subscription status. Returns comprehensive
 * information about the customer's existence and purchase history.
 * 
 * @param email Customer email address to search for
 * @returns Object with customer existence, transaction history, and subscription status
 * @note Searches up to 10 customers with the same email (handles duplicate customers)
 * @note Checks payment intents and invoices for transaction history
 * @note Active subscriptions include "active" and "trialing" statuses
 * @note Returns false for all fields on errors to avoid blocking legitimate operations
 * 
 * @example
 * ```typescript
 * const result = await checkExistingCustomer("user@example.com");
 * // Returns: { exists: true, hasPriorTransactions: true, hasActiveSubscription: false }
 * ```
 */
async function checkExistingCustomer(email: string): Promise<{
  exists: boolean;
  hasPriorTransactions: boolean;
  hasActiveSubscription: boolean;
  error?: string;
}> {
  try {
    // Search for existing customers with this email
    const customers = await stripe.customers.list({
      email: email,
      limit: 10, // Get up to 10 customers with this email
    });

    if (customers.data.length === 0) {
      return {
        exists: false,
        hasPriorTransactions: false,
        hasActiveSubscription: false,
      };
    }

    let hasPriorTransactions = false;
    let hasActiveSubscription = false;

    // Check each customer for transactions and subscriptions
    for (const customer of customers.data) {
      // Check for payment intents (completed purchases)
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customer.id,
        limit: 1,
      });

      if (paymentIntents.data.length > 0) {
        // Check if any payment intents are successful
        const successfulPayments = paymentIntents.data.filter(
          (pi) => pi.status === "succeeded"
        );
        if (successfulPayments.length > 0) {
          hasPriorTransactions = true;
        }
      }

      // Check for invoices (subscription billing)
      const invoices = await stripe.invoices.list({
        customer: customer.id,
        limit: 1,
      });

      if (invoices.data.length > 0) {
        // Check if any invoices are paid
        const paidInvoices = invoices.data.filter(
          (invoice) => invoice.status === "paid"
        );
        if (paidInvoices.length > 0) {
          hasPriorTransactions = true;
        }
      }

      // Check for active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length > 0) {
        hasActiveSubscription = true;
        hasPriorTransactions = true; // Active subscription implies prior transaction
      }

      // Check for trialing subscriptions
      const trialingSubscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "trialing",
        limit: 1,
      });

      if (trialingSubscriptions.data.length > 0) {
        hasActiveSubscription = true;
        // Trialing might not have prior payment, so don't set hasPriorTransactions here
      }
    }

    return {
      exists: true,
      hasPriorTransactions,
      hasActiveSubscription,
    };
  } catch (error) {
    console.error("Error in checkExistingCustomer:", error);
    return {
      exists: false,
      hasPriorTransactions: false,
      hasActiveSubscription: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
