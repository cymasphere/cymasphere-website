/**
 * @fileoverview Cymasphere list, sale, and compare-at (strikethrough) pricing constants.
 * @module lib/pricing
 * @note Charge amounts on checkout come from Stripe price IDs in env; these are UI/admin anchors.
 */

import type { TFunction } from "i18next";
import type { PlanType } from "@/types/stripe";

/** @brief Current sale prices (what customers pay without an extra promotion). */
export const CYMASPHERE_SALE_PRICES_USD: Record<PlanType, number> = {
  monthly: 9,
  annual: 89,
  lifetime: 199,
};

/** @brief Standard retail prices shown as strikethrough when no promotion overrides them. */
export const CYMASPHERE_RETAIL_PRICES_USD: Record<PlanType, number> = {
  monthly: 12,
  annual: 119,
  lifetime: 499,
};

/** @brief Short pricing blurbs for chat FAQ fallbacks by locale code. */
export const CHAT_PRICING_RESPONSES: Record<string, string> = {
  en: "Cymasphere keeps pricing simple—Monthly $9, Yearly $89, Lifetime $199. Which option best fits how you plan to use Cymasphere?",
  es: "Cymasphere mantiene los precios simples: Mensual $9, Anual $89, De por vida $199. ¿Cuál opción se ajusta mejor a tu forma de usar Cymasphere?",
  fr: "Cymasphere maintient les prix simples : Mensuel $9, Annuel $89, À vie $199. Quelle option correspond le mieux à votre utilisation de Cymasphere ?",
  de: "Cymasphere hält die Preise einfach: Monatlich $9, Jährlich $89, Lebenslang $199. Welche Option passt am besten zu deiner Nutzung von Cymasphere ?",
  pt: "Cymasphere mantém os preços simples: Mensal $9, Anual $89, Vitalício $199. Qual opção se ajusta melhor à sua forma de usar Cymasphere ?",
  ja: "Cymasphereはシンプルな価格設定です: 月額 $9、年額 $89、生涯 $199。どのオプションがあなたのCymasphere使用方法に最適ですか ?",
  it: "Cymasphere mantiene i prezzi semplici: Mensile $9, Annuale $89, A vita $199. Quale opzione si adatta meglio al tuo utilizzo di Cymasphere ?",
  tr: "Cymasphere fiyatlandırmayı basit tutar: Aylık $9, Yıllık $89, Ömür boyu $199. Hangi seçenek Cymasphere'i nasıl kullanmayı planladığınıza en uygun ?",
  zh: "Cymasphere 保持简单的定价:月度 $9、年度 $89、终身 $199。哪个选项最适合您计划使用 Cymasphere 的方式 ?",
};

/** @brief RAG / support copy block for Cymasphere plan pricing. */
export const RAG_PRICING_BLOCK = `- **Monthly billing**: $${CYMASPHERE_SALE_PRICES_USD.monthly}.00/month (list $${CYMASPHERE_RETAIL_PRICES_USD.monthly}/month) — pay month-to-month, cancel anytime
- **Yearly billing**: $${CYMASPHERE_SALE_PRICES_USD.annual}.00/year (list $${CYMASPHERE_RETAIL_PRICES_USD.annual}/year) — best value for subscribers
- **Lifetime**: $${CYMASPHERE_SALE_PRICES_USD.lifetime}.00 one-time (list $${CYMASPHERE_RETAIL_PRICES_USD.lifetime}) — lifetime access and updates`;

/**
 * @brief Percent saved vs paying the monthly price for 12 months (rounded).
 * @returns Whole-number percent, e.g. 18 for $9/mo vs $89/yr.
 */
export function getAnnualSavingsPercentRounded(): number {
  const monthlyAnnualized = CYMASPHERE_SALE_PRICES_USD.monthly * 12;
  const annual = CYMASPHERE_SALE_PRICES_USD.annual;
  if (monthlyAnnualized <= annual) return 0;
  return Math.round(
    ((monthlyAnnualized - annual) / monthlyAnnualized) * 100,
  );
}

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

/**
 * @brief Builds fallback PriceData when Stripe is unavailable.
 * @param planType - Billing plan type.
 * @returns Price data with sale and compare-at amounts in cents.
 */
export function getFallbackPriceData(planType: PlanType) {
  return {
    id: "",
    type: planType,
    amount: CYMASPHERE_SALE_PRICES_USD[planType] * 100,
    compareAtAmount: CYMASPHERE_RETAIL_PRICES_USD[planType] * 100,
    currency: "usd" as const,
    name:
      planType === "monthly"
        ? "Monthly Plan"
        : planType === "annual"
          ? "Annual Plan"
          : "Lifetime Plan",
  };
}
