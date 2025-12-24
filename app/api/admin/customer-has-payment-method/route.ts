/**
 * @fileoverview Admin API endpoint to check if customer has payment method
 * 
 * This endpoint checks whether a Stripe customer has any payment methods
 * on file. Used by admin interface to verify customer payment capability.
 * Requires admin authentication.
 * 
 * @module api/admin/customer-has-payment-method
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { checkAdmin } from '@/app/actions/user-management';
import Stripe from 'stripe';

/**
 * @brief GET endpoint to check if a customer has payment methods
 * 
 * Queries Stripe to determine if a customer has any payment methods saved,
 * including checking both the payment methods list and the default payment
 * method on the customer object.
 * 
 * Query parameters:
 * - customerId: Stripe customer ID to check (required)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "hasPaymentMethod": true
 * }
 * ```
 * 
 * 400 Bad Request - Missing customerId:
 * ```json
 * {
 *   "error": "customerId is required"
 * }
 * ```
 * 
 * 401 Unauthorized - Not admin:
 * ```json
 * {
 *   "error": "Unauthorized"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "error": "Failed to check payment method",
 *   "details": "Error message"
 * }
 * ```
 * 
 * @param request Next.js request object containing query parameters
 * @returns NextResponse with payment method status or error
 * @note Requires admin authentication
 * @note Checks both payment methods list and default payment method
 * 
 * @example
 * ```typescript
 * // GET /api/admin/customer-has-payment-method?customerId=cus_abc123
 * // Returns: { success: true, hasPaymentMethod: true }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check admin authorization
    if (!(await checkAdmin(supabase))) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'customerId is required' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Check if customer has any payment methods on file
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      limit: 1,
    });

    // Also check if customer has a default payment method set
    const customer = await stripe.customers.retrieve(customerId);
    const hasDefaultPaymentMethod = customer.deleted ? false : !!customer.invoice_settings?.default_payment_method;

    const hasPaymentMethod = paymentMethods.data.length > 0 || hasDefaultPaymentMethod;

    return NextResponse.json({
      success: true,
      hasPaymentMethod,
    });
  } catch (error) {
    console.error('Error checking payment method:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check payment method',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

