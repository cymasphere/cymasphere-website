/**
 * @fileoverview Cymasphere list and compare-at (strikethrough) pricing constants.
 * @module lib/pricing
 * @note Actual charge amounts come from Stripe price IDs in env; these are retail anchors for UI.
 */

import type { TFunction } from "i18next";
import type { PlanType } from "@/types/stripe";

/** @brief Standard retail prices shown as strikethrough when no promotion overrides them. */
export const CYMASPHERE_RETAIL_PRICES_USD: Record<PlanType, number> = {
  monthly: 12,
  annual: 89,
  lifetime: 499,
};

/**
 * @brief Parses Stripe price metadata compare-at amount (cents) into dollars.
 * @param metadata - Stripe price metadata object.
 * @returns Compare-at amount in major currency units, or undefined.
 */
export function parseCompareAtFromMetadata(
  metadata: Record<string, string> | null | undefined,
): number | undefined {
  const raw = metadata?.compare_at_amount;
  if (!raw) return undefined;
  const cents = Number.parseInt(raw, 10);
  if (!Number.isFinite(cents) || cents <= 0) return undefined;
  return cents / 100;
}

/**
 * @brief Formats a strikethrough price label for display.
 * @param amountDollars - Amount in USD major units.
 * @param planType - Billing plan type.
 * @param t - i18next translate function.
 * @returns Formatted string e.g. "$12/month" or "$499".
 */
export function formatCompareAtPrice(
  amountDollars: number,
  planType: PlanType,
  t: TFunction,
): string {
  const value = `$${Math.round(amountDollars)}`;
  if (planType === "monthly") {
    return `${value}${t("pricing.perMonth", { defaultValue: "/month" })}`;
  }
  if (planType === "annual") {
    return `${value}${t("pricing.perYear", { defaultValue: "/year" })}`;
  }
  return value;
}

/**
 * @brief Resolves compare-at dollars for a plan (Stripe metadata wins, then static retail).
 * @param planType - Billing plan type.
 * @param compareAtFromStripe - Optional compare-at from Stripe price metadata (dollars).
 * @returns Compare-at amount in major currency units.
 */
export function getCompareAtDollars(
  planType: PlanType,
  compareAtFromStripe?: number,
): number {
  return compareAtFromStripe ?? CYMASPHERE_RETAIL_PRICES_USD[planType];
}
