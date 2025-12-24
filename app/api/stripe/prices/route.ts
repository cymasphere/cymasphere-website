/**
 * @fileoverview Stripe pricing information API endpoint
 * 
 * This endpoint retrieves current pricing information for all available plans
 * (monthly, annual, lifetime) from Stripe. Returns formatted price data including
 * amounts, currencies, intervals, and product names. Includes fallback pricing
 * in case of Stripe API errors.
 * 
 * @module api/stripe/prices
 */

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { PlanType, PriceData, PricesResponse } from "@/types/stripe";

/**
 * Stripe client instance initialized with secret key from environment variables
 */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/**
 * @brief GET endpoint to retrieve all plan pricing information
 * 
 * Fetches pricing data for monthly, annual, and lifetime plans from Stripe.
 * Retrieves prices with expanded product information and formats the response
 * with plan details. Returns fallback pricing if Stripe API calls fail.
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "prices": {
 *     "monthly": {
 *       "id": "price_xxx",
 *       "type": "monthly",
 *       "amount": 600,
 *       "currency": "usd",
 *       "interval": "month",
 *       "name": "Pro Plan (Monthly)"
 *     },
 *     "annual": {
 *       "id": "price_yyy",
 *       "type": "annual",
 *       "amount": 5900,
 *       "currency": "usd",
 *       "interval": "year",
 *       "name": "Pro Plan (Annual)"
 *     },
 *     "lifetime": {
 *       "id": "price_zzz",
 *       "type": "lifetime",
 *       "amount": 14900,
 *       "currency": "usd",
 *       "name": "Pro Plan (Lifetime)"
 *     }
 *   }
 * }
 * ```
 * 
 * 500 Internal Server Error - Fallback pricing:
 * ```json
 * {
 *   "success": false,
 *   "prices": {
 *     "monthly": { "id": "", "type": "monthly", "amount": 0, "currency": "usd", "name": "Monthly Plan" },
 *     "annual": { "id": "", "type": "annual", "amount": 0, "currency": "usd", "name": "Annual Plan" },
 *     "lifetime": { "id": "", "type": "lifetime", "amount": 0, "currency": "usd", "name": "Lifetime Plan" }
 *   },
 *   "error": "Failed to fetch prices"
 * }
 * ```
 * 
 * @returns NextResponse with pricing data for all plans
 * @note Prices are retrieved in parallel for performance
 * @note Product information is expanded to get product names
 * @note Returns fallback pricing (zero amounts) if Stripe API fails
 * @note Amounts are in cents (e.g., 600 = $6.00)
 * 
 * @example
 * ```typescript
 * // GET /api/stripe/prices
 * // Returns: { success: true, prices: { monthly: {...}, annual: {...}, lifetime: {...} } }
 * ```
 */
export async function GET(): Promise<NextResponse<PricesResponse>> {
  try {
    // Get the price IDs from environment variables
    const monthlyPriceId = process.env.STRIPE_PRICE_ID_MONTHLY!;
    const annualPriceId = process.env.STRIPE_PRICE_ID_ANNUAL!;
    const lifetimePriceId = process.env.STRIPE_PRICE_ID_LIFETIME!;

    // Fetch prices from Stripe
    const [monthlyPrice, annualPrice, lifetimePrice] = await Promise.all([
      stripe.prices.retrieve(monthlyPriceId, { expand: ["product"] }),
      stripe.prices.retrieve(annualPriceId, { expand: ["product"] }),
      stripe.prices.retrieve(lifetimePriceId, { expand: ["product"] }),
    ]);

    // Get product name
    const productName =
      (monthlyPrice.product as Stripe.Product).name || "Pro Plan";

    // Format response
    const prices: Record<PlanType, PriceData> = {
      monthly: {
        id: monthlyPrice.id,
        type: "monthly",
        amount: monthlyPrice.unit_amount || 0,
        currency: monthlyPrice.currency,
        interval: monthlyPrice.recurring?.interval,
        name: `${productName} (Monthly)`,
      },
      annual: {
        id: annualPrice.id,
        type: "annual",
        amount: annualPrice.unit_amount || 0,
        currency: annualPrice.currency,
        interval: annualPrice.recurring?.interval,
        name: `${productName} (Annual)`,
      },
      lifetime: {
        id: lifetimePrice.id,
        type: "lifetime",
        amount: lifetimePrice.unit_amount || 0,
        currency: lifetimePrice.currency,
        name: `${productName} (Lifetime)`,
      },
    };

    return NextResponse.json({
      success: true,
      prices,
    });
  } catch (error) {
    console.error("Error fetching prices:", error);

    // Return fallback prices in case of error
    const fallbackPrices: Record<PlanType, PriceData> = {
      monthly: {
        id: "",
        type: "monthly",
        amount: 0,
        currency: "usd",
        name: "Monthly Plan",
      },
      annual: {
        id: "",
        type: "annual",
        amount: 0,
        currency: "usd",
        name: "Annual Plan",
      },
      lifetime: {
        id: "",
        type: "lifetime",
        amount: 0,
        currency: "usd",
        name: "Lifetime Plan",
      },
    };

    return NextResponse.json(
      {
        success: false,
        prices: fallbackPrices,
        error:
          error instanceof Error ? error.message : "Failed to fetch prices",
      },
      { status: 500 }
    );
  }
}
