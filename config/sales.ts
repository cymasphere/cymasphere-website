/**
 * Sales Configuration
 * 
 * ⚠️ DEPRECATED: This file is kept for backwards compatibility.
 * 
 * Please use the Admin Promotions Manager instead:
 * http://localhost:3000/admin/promotions
 * 
 * The new system is database-driven and supports:
 * - Multiple promotions
 * - Auto-creating Stripe coupons
 * - Date range management
 * - Performance tracking
 * - Instant updates (no restart needed)
 * 
 * Configure promotional sales and discount campaigns
 */

export interface SaleConfig {
  /** Is the sale currently active? */
  active: boolean;
  /** Sale name/identifier */
  name: string;
  /** Sale display title */
  title: string;
  /** Sale description */
  description?: string;
  /** Which plans does this sale apply to? */
  applicablePlans: ('monthly' | 'annual' | 'lifetime')[];
  /** Sale price overrides (in dollars) */
  salePrices?: {
    monthly?: number;
    annual?: number;
    lifetime?: number;
  };
  /** Stripe coupon/promotion code to auto-apply */
  stripeCouponCode?: string;
  /** Sale start date (optional) */
  startDate?: Date;
  /** Sale end date (optional) */
  endDate?: Date;
  /** Custom styling for the banner */
  theme?: {
    background: string;
    textColor: string;
    accentColor: string;
  };
}

/**
 * Black Friday Sale Configuration
 */
export const BLACK_FRIDAY_SALE: SaleConfig = {
  active: true, // Set to false to disable the sale
  name: 'black_friday_2025',
  title: '🔥 Black Friday Sale',
  description: 'Lifetime access for just $99 - Save $150!',
  applicablePlans: ['lifetime'],
  salePrices: {
    lifetime: 99, // Sale price: $99 (normally $149, was $249)
  },
  stripeCouponCode: 'BLACKFRIDAY2025', // Create this in Stripe Dashboard
  startDate: new Date('2025-11-25'), // Black Friday
  endDate: new Date('2025-12-02'),   // Cyber Monday + 1 day
  theme: {
    background: 'linear-gradient(135deg, #FF6B6B, #FF0000)',
    textColor: '#FFFFFF',
    accentColor: '#FFD700',
  },
};

/**
 * Get the currently active sale (if any)
 */
export function getActiveSale(): SaleConfig | null {
  // Check if Black Friday sale is active and within date range
  if (BLACK_FRIDAY_SALE.active) {
    const now = new Date();
    
    // If dates are specified, check if we're within the sale period
    if (BLACK_FRIDAY_SALE.startDate && BLACK_FRIDAY_SALE.endDate) {
      if (now >= BLACK_FRIDAY_SALE.startDate && now <= BLACK_FRIDAY_SALE.endDate) {
        return BLACK_FRIDAY_SALE;
      }
      // Sale period has passed or not started yet
      return null;
    }
    
    // No date restrictions, sale is active
    return BLACK_FRIDAY_SALE;
  }
  
  return null;
}

/**
 * Check if a sale applies to a specific plan
 */
export function isSaleApplicableToPlan(plan: 'monthly' | 'annual' | 'lifetime'): boolean {
  const sale = getActiveSale();
  if (!sale) return false;
  
  return sale.applicablePlans.includes(plan);
}

/**
 * Get sale price for a plan (if applicable)
 */
export function getSalePrice(plan: 'monthly' | 'annual' | 'lifetime'): number | null {
  const sale = getActiveSale();
  if (!sale || !isSaleApplicableToPlan(plan)) return null;
  
  return sale.salePrices?.[plan] || null;
}

