/**
 * @fileoverview Custom hook for handling Stripe checkout session initiation.
 * @module hooks/useCheckout
 * @description Provides a centralized checkout hook for creating Stripe checkout sessions,
 * handling payment method collection, trial status, and plan changes. Used by both
 * PricingSection and BillingPage to ensure consistency.
 */

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { PlanType } from "@/types/stripe";

/**
 * @brief Trial option when starting a subscription trial from pricing.
 */
export type TrialOption = "7day" | "14day";

/**
 * @brief Params passed to onInlineCheckout when inline checkout is requested.
 */
export interface InlineCheckoutParams {
  planType: PlanType;
  collectPaymentMethod: boolean;
  isPlanChange: boolean;
  /** When starting a trial from pricing: 7-day (no card) or 14-day (card required). */
  trialOption?: TrialOption;
}

/**
 * @brief Options for configuring the checkout hook.
 * @description Allows customization of error handling and optional inline checkout (no redirect).
 */
interface UseCheckoutOptions {
  onError?: (error: string) => void;
  /** When set, clicking checkout opens the form inline (e.g. in a modal) instead of navigating to /checkout. */
  onInlineCheckout?: (params: InlineCheckoutParams) => void;
}

/**
 * @brief Return type for the useCheckout hook.
 * @description Defines the shape of the return value, including checkout initiation
 * function, loading state, and error state.
 */
interface UseCheckoutReturn {
  initiateCheckout: (
    planType: PlanType,
    options?: {
      collectPaymentMethod?: boolean;
      willProvideCard?: boolean;
      hasHadTrial?: boolean;
      email?: string;
      isPlanChange?: boolean;
      trialOption?: TrialOption;
    },
  ) => Promise<{ success: boolean; error?: string }>;
  isLoading: boolean;
  error: string | null;
}

/**
 * @brief Centralized checkout hook for handling Stripe checkout sessions.
 * @description Creates Stripe checkout sessions with proper payment method collection
 * logic based on trial status, plan type, and user state. Handles redirects and error states.
 * @param {UseCheckoutOptions} [options={}] - Optional configuration for error handling.
 * @returns {UseCheckoutReturn} Object containing checkout initiation function, loading state, and error state.
 * @note Used by both PricingSection and BillingPage to ensure consistency.
 * @note For lifetime plans, always requires payment method.
 * @note Priority for payment method collection: hasHadTrial > willProvideCard > collectPaymentMethod.
 * @example
 * const { initiateCheckout, isLoading, error } = useCheckout({
 *   onError: (err) => console.error(err)
 * });
 * await initiateCheckout('monthly', { willProvideCard: true });
 */
export function useCheckout(
  options: UseCheckoutOptions = {},
): UseCheckoutReturn {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiateCheckout = useCallback(
    async (
      planType: PlanType,
      checkoutOptions?: {
        collectPaymentMethod?: boolean;
        willProvideCard?: boolean;
        hasHadTrial?: boolean;
        email?: string;
        isPlanChange?: boolean;
        trialOption?: TrialOption;
      },
    ): Promise<{ success: boolean; error?: string }> => {
      // Reset error state
      setError(null);
      setIsLoading(true);

      try {
        // If user is logged in and has a subscription, redirect to dashboard
        // UNLESS this is a plan change (allow existing subscribers to change plans)
        if (
          user?.profile &&
          user.profile.subscription !== "none" &&
          !checkoutOptions?.isPlanChange
        ) {
          router.push("/dashboard");
          return { success: false, error: "User already has a subscription" };
        }

        // Determine if we need to collect payment method
        // Priority: hasHadTrial > willProvideCard > collectPaymentMethod
        let collectPaymentMethod = false;
        if (checkoutOptions?.hasHadTrial === true) {
          // If user has had a trial, always require payment method
          collectPaymentMethod = true;
        } else if (checkoutOptions?.willProvideCard !== undefined) {
          // Use the willProvideCard setting if provided
          collectPaymentMethod = checkoutOptions.willProvideCard;
        } else if (checkoutOptions?.collectPaymentMethod !== undefined) {
          // Fall back to explicit collectPaymentMethod
          collectPaymentMethod = checkoutOptions.collectPaymentMethod;
        }

        // For lifetime plans, always require payment method
        if (planType === "lifetime") {
          collectPaymentMethod = true;
        }

        const isPlanChange = checkoutOptions?.isPlanChange ?? false;
        const trialOption = checkoutOptions?.trialOption;
        if (options.onInlineCheckout) {
          options.onInlineCheckout({
            planType,
            collectPaymentMethod,
            isPlanChange,
            trialOption,
          });
          return { success: true };
        }
        // Navigate to in-app checkout page (email and promo collected on the page)
        const params = new URLSearchParams();
        params.set("plan", planType);
        if (collectPaymentMethod) params.set("collectPaymentMethod", "true");
        if (isPlanChange) params.set("isPlanChange", "true");
        router.push(`/checkout?${params.toString()}`);
        return { success: true };
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "An unexpected error occurred";
        console.error("Checkout error:", err);
        setError(errorMsg);
        if (options.onError) {
          options.onError(errorMsg);
        }
        return { success: false, error: errorMsg };
      } finally {
        setIsLoading(false);
      }
    },
    [user, router, options],
  );

  return {
    initiateCheckout,
    isLoading,
    error,
  };
}
