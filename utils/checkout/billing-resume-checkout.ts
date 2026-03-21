/**
 * @fileoverview Builds `/billing` URLs to resume inline checkout after login.
 *
 * @module utils/checkout/billing-resume-checkout
 */

import type { PlanType } from "@/types/stripe";

/** @brief Trial mode query value for resume URL (matches `InlineCheckoutParams.trialOption`). */
export type BillingResumeTrialOption = "7day" | "14day";

/** @brief Plans allowed in resume-checkout query strings (must match checkout UI). */
export const BILLING_RESUME_VALID_PLANS: readonly PlanType[] = [
  "monthly",
  "annual",
  "lifetime",
];

/**
 * @brief Query string keys used on `/billing` to reopen the checkout modal after login.
 */
export const BILLING_RESUME_QUERY = {
  flag: "resumeCheckout",
  plan: "plan",
  collectPaymentMethod: "collectPaymentMethod",
  isPlanChange: "isPlanChange",
  trialOption: "trialOption",
} as const;

/**
 * @brief Normalized resume payload from `/billing?resumeCheckout=1&...`.
 */
export type ParsedBillingResumeCheckout = {
  planType: PlanType;
  collectPaymentMethod: boolean;
  isPlanChange: boolean;
  trialOption?: BillingResumeTrialOption;
};

/**
 * @brief True when the URL has the resume flag (used to detect malformed resume URLs).
 */
export function billingUrlHasResumeCheckoutFlag(
  searchParams: URLSearchParams,
): boolean {
  return searchParams.get(BILLING_RESUME_QUERY.flag) === "1";
}

/**
 * @brief Parses resume-checkout query params from the billing URL.
 * @param searchParams - Current URL search params (e.g. from `useSearchParams()`)
 * @returns Parsed options when `resumeCheckout=1` and `plan` is valid; otherwise null
 * @note Plan values are matched case-insensitively; unknown `trialOption` values are ignored.
 */
export function parseBillingResumeCheckoutQuery(
  searchParams: URLSearchParams,
): ParsedBillingResumeCheckout | null {
  if (searchParams.get(BILLING_RESUME_QUERY.flag) !== "1") {
    return null;
  }
  const rawPlan = searchParams.get(BILLING_RESUME_QUERY.plan)?.trim();
  if (!rawPlan) {
    return null;
  }
  const planLower = rawPlan.toLowerCase();
  if (!BILLING_RESUME_VALID_PLANS.includes(planLower as PlanType)) {
    return null;
  }
  const planType = planLower as PlanType;
  const collectPaymentMethod =
    searchParams.get(BILLING_RESUME_QUERY.collectPaymentMethod) === "true";
  const isPlanChange =
    searchParams.get(BILLING_RESUME_QUERY.isPlanChange) === "true";
  const trialRaw = searchParams
    .get(BILLING_RESUME_QUERY.trialOption)
    ?.trim()
    .toLowerCase();
  const trialOption: BillingResumeTrialOption | undefined =
    trialRaw === "7day" || trialRaw === "14day" ? trialRaw : undefined;
  return {
    planType,
    collectPaymentMethod,
    isPlanChange,
    ...(trialOption ? { trialOption } : {}),
  };
}

/**
 * @brief Builds a path like `/billing?resumeCheckout=1&plan=monthly&...` for post-login checkout.
 * @param planType - Selected plan
 * @param options - Flags matching the checkout the user started as a guest
 * @returns Path and query safe to pass through `encodeURIComponent` into `/login?redirect=`
 */
export function buildBillingResumeCheckoutPath(
  planType: PlanType,
  options: {
    collectPaymentMethod: boolean;
    isPlanChange: boolean;
    trialOption?: BillingResumeTrialOption;
  },
): string {
  const params = new URLSearchParams();
  params.set(BILLING_RESUME_QUERY.flag, "1");
  params.set(BILLING_RESUME_QUERY.plan, planType);
  if (options.collectPaymentMethod) {
    params.set(BILLING_RESUME_QUERY.collectPaymentMethod, "true");
  }
  if (options.isPlanChange) {
    params.set(BILLING_RESUME_QUERY.isPlanChange, "true");
  }
  if (options.trialOption) {
    params.set(BILLING_RESUME_QUERY.trialOption, options.trialOption);
  }
  return `/billing?${params.toString()}`;
}

/**
 * @brief Full login URL that returns the user to billing with checkout resumed.
 */
export function buildLoginUrlWithBillingResumeCheckout(
  planType: PlanType,
  options: {
    collectPaymentMethod: boolean;
    isPlanChange: boolean;
    trialOption?: BillingResumeTrialOption;
  },
): string {
  const resumePath = buildBillingResumeCheckoutPath(planType, options);
  return `/login?redirect=${encodeURIComponent(resumePath)}`;
}
