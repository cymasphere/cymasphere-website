/**
 * @fileoverview Stripe coupon management API endpoint
 * 
 * This endpoint handles deletion of Stripe coupons. Requires admin authentication
 * and deletes the coupon from Stripe. Used for managing promotional codes and
 * discount coupons in the system.
 * 
 * @module api/stripe/coupons/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/utils/supabase/server';

/**
 * Stripe client instance with specific API version
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
});

/**
 * @brief DELETE endpoint to delete a Stripe coupon
 * 
 * Deletes a coupon from Stripe by ID. Requires admin authentication.
 * Validates user is an admin before allowing deletion.
 * 
 * Route parameters:
 * - id: Stripe coupon ID to delete (from URL path)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "message": "Coupon deleted successfully"
 * }
 * ```
 * 
 * 400 Bad Request - Missing coupon ID:
 * ```json
 * {
 *   "error": "Coupon ID required"
 * }
 * ```
 * 
 * 400 Bad Request - Stripe deletion error:
 * ```json
 * {
 *   "success": false,
 *   "error": "No such coupon: 'coupon_xxx'"
 * }
 * ```
 * 
 * 401 Unauthorized - Not authenticated:
 * ```json
 * {
 *   "error": "Unauthorized"
 * }
 * ```
 * 
 * 403 Forbidden - Not admin:
 * ```json
 * {
 *   "error": "Forbidden"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "success": false,
 *   "error": "Internal server error"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @param params Route parameters containing coupon ID
 * @returns NextResponse with success status or error
 * @note Requires admin authentication
 * @note Coupon deletion is permanent and cannot be undone
 * 
 * @example
 * ```typescript
 * // DELETE /api/stripe/coupons/coupon_abc123
 * // Returns: { success: true, message: "Coupon deleted successfully" }
 * ```
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id: couponId } = await params;

    if (!couponId) {
      return NextResponse.json({ error: 'Coupon ID required' }, { status: 400 });
    }

    // Delete the coupon from Stripe
    try {
      await stripe.coupons.del(couponId);
      
      return NextResponse.json({
        success: true,
        message: 'Coupon deleted successfully',
      });
    } catch (stripeError: any) {
      console.error('Stripe error deleting coupon:', stripeError);
      return NextResponse.json({
        success: false,
        error: stripeError.message || 'Failed to delete coupon from Stripe',
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error in DELETE /api/stripe/coupons:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

