/**
 * @fileoverview Active promotions retrieval API endpoint
 * 
 * This endpoint fetches currently active promotional campaigns from the
 * database. Filters promotions by active status, date range (PST timezone),
 * and optionally by plan type. Returns the highest priority active promotion.
 * 
 * @module api/promotions/active
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { isPSTDateAfterNow, isPSTDateBeforeNow } from '@/utils/timezoneUtils';

/**
 * @brief GET endpoint to retrieve active promotions
 * 
 * Fetches promotions that are currently active based on:
 * - active flag set to true
 * - Current date within start_date and end_date range (PST timezone)
 * - Optionally filtered by plan type (monthly, annual, lifetime)
 * 
 * Returns the highest priority active promotion. All date comparisons
 * are performed in PST timezone to ensure accurate promotion scheduling.
 * 
 * Query parameters:
 * - plan: Plan type to filter by - "monthly", "annual", or "lifetime" (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "promotion": {
 *     "id": "uuid",
 *     "name": "Summer Sale",
 *     "title": "25% Off",
 *     "active": true,
 *     "discount_type": "percentage",
 *     "discount_value": 25,
 *     "sale_price_monthly": 4.50,
 *     "sale_price_annual": 44.25,
 *     "sale_price_lifetime": 111.75
 *   },
 *   "count": 1
 * }
 * ```
 * 
 * 200 OK - No active promotions:
 * ```json
 * {
 *   "success": true,
 *   "promotion": null,
 *   "count": 0
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "error": "Failed to fetch promotions"
 * }
 * ```
 * 
 * @param request Next.js request object containing query parameters
 * @returns NextResponse with active promotion or null and count
 * @note Date comparisons use PST timezone for accurate scheduling
 * @note Returns highest priority promotion if multiple active
 * @note Filters by plan type if specified in query parameters
 * 
 * @example
 * ```typescript
 * // GET /api/promotions/active?plan=monthly
 * // Returns: { success: true, promotion: {...}, count: 1 }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plan = searchParams.get('plan');

    const supabase = await createClient();

    let query = supabase
      .from('promotions')
      .select('*')
      .eq('active', true)
      .order('priority', { ascending: false });

    // Filter by date range (current time must be within range or no range set)
    const now = new Date().toISOString();
    
    const { data: promotions, error } = await query;

    if (error) {
      console.error('Error fetching active promotions:', error);
      return NextResponse.json({ error: 'Failed to fetch promotions' }, { status: 500 });
    }

    // Filter by date and plan in JavaScript (more complex filtering)
    // All date comparisons are done in PST timezone
    const filtered = promotions?.filter(promo => {
      // Check date range in PST
      if (promo.start_date && isPSTDateAfterNow(promo.start_date)) {
        return false; // Not started yet (in PST)
      }
      if (promo.end_date && isPSTDateBeforeNow(promo.end_date)) {
        return false; // Already ended (in PST)
      }

      // Check plan if specified
      if (plan && !promo.applicable_plans?.includes(plan)) {
        return false;
      }

      return true;
    }) || [];

    // Return highest priority promotion
    const activePromotion = filtered.length > 0 ? filtered[0] : null;

    return NextResponse.json({
      success: true,
      promotion: activePromotion,
      count: filtered.length,
    });
  } catch (error) {
    console.error('Error in GET /api/promotions/active:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

