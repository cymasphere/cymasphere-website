/**
 * @fileoverview Classifies Stripe subscription prices as Cymasphere monthly or annual plans.
 * Matches current env price IDs, optional legacy ID lists, and recurring billing interval
 * so grandfathered subscriptions stay recognized after price changes.
 * @module utils/stripe/classify-recurring-plan
 */

/** Cymasphere recurring subscription tier derived from a Stripe price or item. */
export type RecurringPlanType = "monthly" | "annual";

/** Minimal Stripe Price shape for classification (API or mirrored attrs). */
export type StripeRecurringPriceShape = {
  id?: string | null;
  type?: string | null;
  recurring?: {
    interval?: string | null;
    interval_count?: number | null;
  } | null;
};

/** Minimal Stripe subscription item shape (API or mirrored attrs). */
export type StripeSubscriptionItemShape = {
  price?: StripeRecurringPriceShape | null;
  plan?: {
    id?: string | null;
    interval?: string | null;
    interval_count?: number | null;
  } | null;
};

let cachedLegacyMonthlyIds: Set<string> | null = null;
let cachedLegacyAnnualIds: Set<string> | null = null;

/**
 * @brief Parses a comma-separated env var into a set of Stripe price IDs.
 * @param envKey Environment variable name (e.g. STRIPE_LEGACY_PRICE_IDS_MONTHLY).
 * @returns Set of trimmed non-empty price IDs.
 */
function parseLegacyPriceIds(envKey: string): Set<string> {
  const raw = process.env[envKey]?.trim();
  if (!raw) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean),
  );
}

/**
 * @brief Loads current and optional legacy Cymasphere price IDs from env.
 * @returns Known monthly/annual price ID sets for explicit matching.
 */
function getKnownPriceIds(): {
  monthly: string;
  annual: string;
  legacyMonthly: Set<string>;
  legacyAnnual: Set<string>;
} {
  cachedLegacyMonthlyIds ??= parseLegacyPriceIds(
    "STRIPE_LEGACY_PRICE_IDS_MONTHLY",
  );
  cachedLegacyAnnualIds ??= parseLegacyPriceIds("STRIPE_LEGACY_PRICE_IDS_ANNUAL");

  return {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY?.trim() ?? "",
    annual: process.env.STRIPE_PRICE_ID_ANNUAL?.trim() ?? "",
    legacyMonthly: cachedLegacyMonthlyIds,
    legacyAnnual: cachedLegacyAnnualIds,
  };
}

/**
 * @brief Maps Stripe recurring interval to Cymasphere plan type.
 * @param interval Stripe interval (`month` | `year`).
 * @param intervalCount Billing cadence multiplier (only `1` is supported).
 * @returns `monthly`, `annual`, or null when not a standard recurring plan.
 */
function intervalToPlanType(
  interval: string | null | undefined,
  intervalCount?: number | null,
): RecurringPlanType | null {
  const count = intervalCount ?? 1;
  if (count !== 1) {
    return null;
  }
  if (interval === "month") {
    return "monthly";
  }
  if (interval === "year") {
    return "annual";
  }
  return null;
}

/**
 * @brief Classifies a Stripe Price as Cymasphere monthly or annual.
 * @description Resolution order: current env price IDs, optional legacy ID lists,
 * then recurring interval (`month` / `year`) for grandfathered or future price IDs.
 * @param price Stripe Price object or mirrored attrs fragment.
 * @returns Plan type or null when the price is not a Cymasphere recurring subscription.
 * @note One-time (lifetime) prices are excluded via `type !== "one_time"` guard on interval fallback.
 * @example
 * ```typescript
 * classifyRecurringPlanFromPrice({ id: "price_old", recurring: { interval: "month" } });
 * // "monthly"
 * ```
 */
export function classifyRecurringPlanFromPrice(
  price: StripeRecurringPriceShape | null | undefined,
): RecurringPlanType | null {
  if (!price?.id) {
    return null;
  }

  const { monthly, annual, legacyMonthly, legacyAnnual } = getKnownPriceIds();

  if (price.id === monthly) {
    return "monthly";
  }
  if (price.id === annual) {
    return "annual";
  }
  if (legacyMonthly.has(price.id)) {
    return "monthly";
  }
  if (legacyAnnual.has(price.id)) {
    return "annual";
  }

  if (price.type === "one_time") {
    return null;
  }

  return intervalToPlanType(
    price.recurring?.interval,
    price.recurring?.interval_count,
  );
}

/**
 * @brief Classifies a subscription line item (price and/or legacy plan object).
 * @param item Stripe SubscriptionItem or mirrored attrs item.
 * @returns Plan type or null.
 * @note Mirrored `stripe_tables` rows often include `plan.interval` when `price.recurring` is sparse.
 */
export function classifyRecurringPlanFromSubscriptionItem(
  item: StripeSubscriptionItemShape | null | undefined,
): RecurringPlanType | null {
  if (!item) {
    return null;
  }

  const fromPrice = classifyRecurringPlanFromPrice(item.price ?? undefined);
  if (fromPrice) {
    return fromPrice;
  }

  return intervalToPlanType(item.plan?.interval, item.plan?.interval_count);
}

/**
 * @brief Whether a Stripe subscription status still grants Cymasphere access.
 * @param status Stripe subscription status string.
 * @returns True for active, trialing, or past_due.
 */
export function isActiveSubscriptionStatus(
  status: string | null | undefined,
): boolean {
  return (
    status === "active" || status === "trialing" || status === "past_due"
  );
}

/**
 * @brief Clears cached legacy price ID sets (for tests).
 */
export function resetLegacyPriceIdCacheForTests(): void {
  cachedLegacyMonthlyIds = null;
  cachedLegacyAnnualIds = null;
}
