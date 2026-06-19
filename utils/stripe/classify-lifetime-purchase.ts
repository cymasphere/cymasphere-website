/**
 * @fileoverview Detects Cymasphere lifetime purchases from Stripe metadata and price IDs.
 * Supports current env lifetime price, legacy ID lists, and standard purchase metadata
 * so lifetime access survives lifetime price migrations.
 * @module utils/stripe/classify-lifetime-purchase
 */

/** Stripe object metadata that marks a lifetime purchase. */
export type LifetimePurchaseMetadata = {
  purchase_type?: string | null;
  is_lifetime?: string | null;
  price_id?: string | null;
};

let cachedLifetimePriceIds: Set<string> | null = null;

/**
 * @brief Parses comma-separated Stripe price IDs from an env var.
 * @param envKey Environment variable name.
 * @returns Set of trimmed price IDs.
 */
function parsePriceIdsFromEnv(envKey: string): Set<string> {
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
 * @brief Loads all known Cymasphere lifetime Stripe price IDs from env.
 * @returns Set including current, LIFETIME_PRICE_ID_2, and STRIPE_LEGACY_PRICE_IDS_LIFETIME.
 */
export function getKnownLifetimePriceIds(): Set<string> {
  if (cachedLifetimePriceIds) {
    return cachedLifetimePriceIds;
  }

  const ids = new Set<string>();
  for (const key of [
    "STRIPE_PRICE_ID_LIFETIME",
    "LIFETIME_PRICE_ID_2",
    "STRIPE_LEGACY_PRICE_IDS_LIFETIME",
  ]) {
    for (const id of parsePriceIdsFromEnv(key)) {
      ids.add(id);
    }
  }

  cachedLifetimePriceIds = ids;
  return ids;
}

/**
 * @brief Whether Stripe metadata marks a Cymasphere lifetime purchase.
 * @param metadata Stripe PaymentIntent, Invoice, or Checkout metadata.
 * @returns True when `purchase_type` is `lifetime` or `is_lifetime` is `true`.
 */
export function hasLifetimePurchaseMetadata(
  metadata: LifetimePurchaseMetadata | null | undefined,
): boolean {
  if (!metadata) {
    return false;
  }
  return (
    metadata.purchase_type === "lifetime" || metadata.is_lifetime === "true"
  );
}

/**
 * @brief Whether a Stripe price ID is a known Cymasphere lifetime price.
 * @param priceId Stripe Price id (`price_…`).
 * @returns True when the id is in env-configured lifetime price lists.
 */
export function isKnownLifetimePriceId(priceId: string | null | undefined): boolean {
  if (!priceId) {
    return false;
  }
  return getKnownLifetimePriceIds().has(priceId);
}

/**
 * @brief Whether a mirrored or API PaymentIntent attrs payload is a succeeded lifetime purchase.
 * @param attrs PaymentIntent JSON with metadata and status fields.
 * @returns True for succeeded, non-refunded lifetime purchases.
 */
export function isLifetimeSucceededPaymentIntent(
  attrs: {
    metadata?: LifetimePurchaseMetadata | null;
    status?: string | null;
    dispute?: unknown | null;
    refunded?: boolean | null;
  } | null | undefined,
): boolean {
  if (!attrs || !hasLifetimePurchaseMetadata(attrs.metadata ?? undefined)) {
    return false;
  }
  return (
    attrs.status === "succeeded" && !attrs.dispute && !attrs.refunded
  );
}

/**
 * @brief Extracts a Stripe price id from an invoice line item.
 * @param line Stripe invoice line (API or expanded mirror shape).
 * @returns Price id when present.
 */
function priceIdFromInvoiceLine(line: unknown): string | undefined {
  if (!line || typeof line !== "object") {
    return undefined;
  }
  const price = (line as { price?: { id?: string | null } | string | null }).price;
  if (typeof price === "string") {
    return price;
  }
  if (price && typeof price === "object" && typeof price.id === "string") {
    return price.id;
  }
  return undefined;
}

/**
 * @brief Whether an invoice line references a known lifetime price.
 * @param lines Stripe invoice line items with optional nested price id.
 * @returns True when any line uses a configured lifetime price ID.
 */
export function invoiceLinesHaveKnownLifetimePrice(
  lines: ReadonlyArray<unknown>,
): boolean {
  return lines.some((line) => isKnownLifetimePriceId(priceIdFromInvoiceLine(line)));
}

/**
 * @brief Whether a paid Stripe invoice represents a Cymasphere lifetime purchase.
 * @param invoice Stripe invoice with metadata and line items.
 * @returns True for lifetime metadata or known lifetime price IDs on lines.
 */
export function isLifetimePaidInvoice(invoice: {
  metadata?: LifetimePurchaseMetadata | null;
  lines?: { data?: ReadonlyArray<unknown> };
}): boolean {
  if (hasLifetimePurchaseMetadata(invoice.metadata ?? undefined)) {
    return true;
  }
  return invoiceLinesHaveKnownLifetimePrice(invoice.lines?.data ?? []);
}

/**
 * @brief Clears cached lifetime price ID set (for tests).
 */
export function resetLifetimePriceIdCacheForTests(): void {
  cachedLifetimePriceIds = null;
}
