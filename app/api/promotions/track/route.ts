/**
 * @fileoverview Promotion analytics tracking API endpoint
 * 
 * This endpoint tracks promotion views and conversions for analytics.
 * Increments view counts or conversion counts with revenue tracking using
 * Supabase RPC functions. Used for measuring promotion effectiveness.
 * 
 * @module api/promotions/track
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

/**
 * @brief POST endpoint to track promotion views or conversions
 * 
 * Records promotion engagement metrics:
 * - Views: Increments view count for a promotion
 * - Conversions: Increments conversion count and tracks revenue
 * 
 * Uses Supabase RPC functions (increment_promotion_view and
 * increment_promotion_conversion) for atomic database updates.
 * 
 * Request body (JSON):
 * - promotion_id: Promotion ID to track (required)
 * - type: Tracking type - "view" or "conversion" (required)
 * - value: Conversion value/revenue in dollars (optional, for conversions only)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true
 * }
 * ```
 * 
 * 400 Bad Request - Missing fields:
 * ```json
 * {
 *   "error": "promotion_id and type required"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "error": "Failed to track view" | "Failed to track conversion"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with tracking data
 * @returns NextResponse with success status or error
 * @note Uses Supabase RPC functions for atomic database updates
 * @note Conversion value is optional and defaults to 0
 * 
 * @example
 * ```typescript
 * // POST /api/promotions/track
 * // Body: { promotion_id: "uuid", type: "view" }
 * // Returns: { success: true }
 * 
 * // POST /api/promotions/track
 * // Body: { promotion_id: "uuid", type: "conversion", value: 59.00 }
 * // Returns: { success: true }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { promotion_id, type, value } = body;

    if (!promotion_id || !type) {
      return NextResponse.json(
        { error: 'promotion_id and type required' },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    if (type === 'view') {
      // Increment view count
      const { error } = await supabase.rpc('increment_promotion_view', {
        promotion_id,
      });

      if (error) {
        console.error('Error tracking promotion view:', error);
        return NextResponse.json(
          { error: 'Failed to track view' },
          { status: 500 }
        );
      }
    } else if (type === 'conversion') {
      // Increment conversion count and revenue
      const { error } = await supabase.rpc('increment_promotion_conversion', {
        promotion_id,
        conversion_value: value || 0,
      });

      if (error) {
        console.error('Error tracking promotion conversion:', error);
        return NextResponse.json(
          { error: 'Failed to track conversion' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error('Error in POST /api/promotions/track:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

