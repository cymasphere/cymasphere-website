/**
 * @fileoverview Reusable checkout form for subscription/lifetime plans.
 * @module components/checkout/EmbeddedCheckout
 *
 * Renders the same checkout UI as the standalone /checkout page: plan card,
 * email, promo (apply to commit a single active code, then Pay now uses that
 * code only), Continue, then Stripe PaymentElement + Pay now. Can be used
 * inline (e.g. in a modal) with onClose or on a full page with a back link.
 *
 * @example
 * // In a modal
 * <EmbeddedCheckout
 *   planType="monthly"
 *   collectPaymentMethod={true}
 *   isPlanChange={false}
 *   onClose={() => setShowCheckout(false)}
 * />
 *
 * @example
 * // Standalone page (no onClose = show "Back to pricing" link)
 * <EmbeddedCheckout planType={planType} collectPaymentMethod={...} isPlanChange={...} />
 */

"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { buildLoginUrlWithBillingResumeCheckout } from "@/utils/checkout/billing-resume-checkout";
import { ACCOUNT_EXISTS_REQUIRE_LOGIN } from "@/utils/checkout/guest-checkout-constants";
import { PlanType, PriceData } from "@/types/stripe";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";
import { FaCheckCircle } from "react-icons/fa";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatLoadingSpinner from "@/components/common/StatLoadingSpinner";

/** HMR re-evaluates modules; reuse one Promise so <Elements> never sees a new `stripe` prop on the same tree. */
const globalForStripe = globalThis as typeof globalThis & {
  __cymasphereStripePromise?: Promise<Stripe | null>;
};
const stripePromise =
  globalForStripe.__cymasphereStripePromise ??
  (globalForStripe.__cymasphereStripePromise = loadStripe(
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
  ));

/** Trial length when starting from pricing (matches `InlineCheckoutParams.trialOption`). */
export type TrialOption = "7day" | "14day";

/** Dark theme for Stripe Payment Element to match app (purple/dark background). */
const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#6c63ff",
    colorBackground: "#191724",
    colorText: "#e0e0e0",
    colorTextSecondary: "#b0b0b0",
    colorDanger: "#ef4444",
    borderRadius: "10px",
  },
};

const CymasphereLogo = dynamic(
  () => import("@/components/common/CymasphereLogo"),
  { ssr: false },
) as React.ComponentType<{
  size?: string;
  fontSize?: string;
  showText?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}>;

const BackLink = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.95rem;
  margin-bottom: 1.5rem;
  &:hover {
    color: var(--primary);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 0.95rem;
  cursor: pointer;
  padding: 0;
  margin-bottom: 1.5rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  &:hover {
    color: var(--primary);
  }
`;

const CheckoutCard = styled(motion.div)`
  position: relative;
  background-color: rgba(25, 23, 36, 0.6);
  border-radius: 12px;
  overflow: visible;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  border: 2px solid var(--primary);
  max-width: 420px;
  margin: 0 auto;
  z-index: 5;
`;

const CardHeader = styled.div`
  padding: 1.5rem 1.5rem 0.75rem;
  text-align: center;
`;

const PlanName = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  .logo-container {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .pro-label {
    font-size: 1.2rem;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 600;
  }
`;

const PriceDisplay = styled.div`
  margin-top: 0.5rem;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0;
  position: relative;
`;

const OriginalPrice = styled.span<{ $hasPeriod?: boolean }>`
  font-size: 1.2rem;
  text-decoration: line-through;
  color: var(--text-secondary);
  opacity: 0.5;
  font-weight: 500;
  position: absolute;
  right: ${(props) =>
    props.$hasPeriod ? "calc(50% + 5.5rem)" : "calc(50% + 4rem)"};
`;

const PriceContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

const Price = styled.span`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const BillingPeriod = styled.span`
  font-size: 1.2rem;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-left: 0.25rem;
`;

const DiscountTag = styled.span<{ $isSale?: boolean }>`
  background: ${(props) =>
    props.$isSale
      ? "linear-gradient(135deg, #FF6B6B, #FF0000)"
      : "linear-gradient(135deg, var(--accent), var(--primary))"};
  color: white;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  position: absolute;
  left: 100%;
  margin-left: 8px;
  white-space: nowrap;
`;

const CardBody = styled.div`
  padding: 0.5rem 1.5rem 1.5rem;
`;

const Divider = styled.hr`
  border: none;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin: 0.5rem 0;
`;

const FormSection = styled.div`
  margin-top: 1rem;
`;

const PaymentElementWrapper = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 14px 24px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 30px;
  font-weight: 600;
  font-size: 1rem;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.7 : 1)};
  margin-top: 0.5rem;
  &:hover:not(:disabled) {
    filter: brightness(1.05);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
  }
`;

const ErrorMessage = styled.p`
  color: var(--error, #ef4444);
  font-size: 0.9rem;
  margin-top: 0.75rem;
`;

const LoginRedirectLink = styled(Link)`
  display: inline-block;
  margin-top: 1rem;
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border-radius: 30px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition:
    filter 0.2s,
    transform 0.2s,
    box-shadow 0.2s;
  &:hover {
    filter: brightness(1.05);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
  }
`;

/** Callout when the email already has a profile and the user must log in. */
const ExistingAccountNotice = styled.div`
  border: 1px solid rgba(108, 99, 255, 0.45);
  background: rgba(108, 99, 255, 0.12);
  border-radius: 12px;
  padding: 1rem 1.25rem;
  margin-bottom: 1rem;
  p {
    margin: 0 0 0.75rem 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text);
  }
  ${LoginRedirectLink} {
    margin-top: 0;
  }
`;

const FieldGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const NameRow = styled.div`
  display: flex;
  gap: 0.75rem;
  & > ${FieldGroup} {
    flex: 1;
    margin-bottom: 0;
  }
`;

const FieldLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--text);
  font-size: 1rem;
  box-sizing: border-box;
  &:focus {
    outline: none;
    border-color: var(--primary);
  }
  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

/** Summary row when user has continued to payment: shows email and Edit to go back. */
const PaymentSummaryRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.75rem 0;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
  color: var(--text-secondary);
`;

const EditLink = styled.button`
  background: none;
  border: none;
  color: var(--primary);
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  &:hover {
    color: var(--primary-hover, #857dff);
  }
`;

const PromoApplyRow = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: stretch;
  margin-bottom: 0.25rem;
`;
const PromoInput = styled(Input)`
  flex: 1;
  min-width: 0;
`;
const ApplyPromoButton = styled.button`
  padding: 0 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
  background: rgba(108, 99, 255, 0.25);
  border: 1px solid var(--primary);
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) {
    background: rgba(108, 99, 255, 0.4);
  }
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

/** Clears an applied promo so the user can enter a different code. */
const RemoveAppliedPromoButton = styled.button`
  padding: 0 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-secondary);
  background: transparent;
  border: 1px solid var(--border, rgba(255, 255, 255, 0.2));
  border-radius: 10px;
  cursor: pointer;
  white-space: nowrap;
  &:hover:not(:disabled) {
    color: var(--text);
    border-color: var(--text-secondary);
  }
`;

const PromoFeedback = styled.p<{ $success?: boolean }>`
  font-size: 0.85rem;
  margin-top: 0.35rem;
  margin-bottom: 0;
  color: ${(p) =>
    p.$success ? "var(--success, #22c55e)" : "var(--colorDanger, #ef4444)"};
`;

const Subtext = styled.div`
  margin-top: 5px;
  font-size: 0.9rem;
  text-align: center;
  color: #b0b0b0;
`;

const ContentWrapper = styled.div`
  max-width: 420px;
  margin: 0 auto;
`;

/** Inline success view (mirrors checkout-success page). */
const SuccessIcon = styled(FaCheckCircle)`
  color: var(--success, #22c55e);
  font-size: 3rem;
  margin-bottom: 1rem;
`;
const SuccessTitle = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;
const SuccessSubtitle = styled.div`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;
const SuccessMessage = styled.p`
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;
const SuccessTrialBox = styled.div`
  background: linear-gradient(
    135deg,
    rgba(78, 205, 196, 0.1),
    rgba(108, 99, 255, 0.1)
  );
  border: 2px solid rgba(78, 205, 196, 0.4);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
`;
const SuccessTrialTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--accent);
`;
const SuccessTrialText = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
`;
const SuccessInviteBox = styled.div`
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  text-align: center;
`;
const SuccessInviteTitle = styled.div`
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: var(--text);
`;
const SuccessInviteText = styled.p`
  font-size: 0.9rem;
  line-height: 1.5;
  color: var(--text-secondary);
  margin: 0;
`;
const SuccessButtonContainer = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;
const SuccessPrimaryButton = styled(Link)`
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s;
  &:hover {
    filter: brightness(1.05);
    transform: translateY(-2px);
  }
`;
const SuccessSecondaryButton = styled(Link)`
  padding: 12px 24px;
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.95rem;
  text-decoration: none;
  transition: all 0.2s;
  &:hover {
    background: rgba(108, 99, 255, 0.1);
  }
`;

interface UnifiedCheckoutFormProps {
  planType: PlanType;
  email?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  promotionCode?: string | null;
  customerId?: string | null;
  collectPaymentMethod?: boolean;
  isPlanChange?: boolean;
  /** When set, subscription/payment intent is already created; just render Elements (no API call). */
  initialClientSecret?: string | null;
}

interface PaymentFormInnerProps {
  planType: PlanType;
  emailForPayment: string;
  /** When "setup_intent", confirmSetup is used (e.g. $0 first invoice); otherwise confirmPayment. */
  intentType?: "payment_intent" | "setup_intent";
}

function PaymentFormInner({
  planType,
  emailForPayment,
  intentType = "payment_intent",
}: PaymentFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/checkout-success?isLifetime=${planType === "lifetime"}`
        : "";
    const confirmParams = { return_url: returnUrl };
    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Check your payment details.");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }
    if (intentType === "setup_intent") {
      const { error: confirmError } = await stripe.confirmSetup({
        elements,
        confirmParams,
      });
      if (confirmError) setError(confirmError.message ?? "Setup failed");
    } else {
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams,
      });
      if (confirmError) setError(confirmError.message ?? "Payment failed");
    }
    submittingRef.current = false;
    setSubmitting(false);
  };

  if (!stripe || !elements) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElementWrapper>
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                email: emailForPayment,
              },
            },
          }}
        />
      </PaymentElementWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <SubmitButton type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? (
          <>
            <StatLoadingSpinner size={16} />
            <span style={{ marginLeft: "0.4rem" }}>Processing…</span>
          </>
        ) : (
          "Pay now"
        )}
      </SubmitButton>
    </form>
  );
}

/** Props for the SetupIntent flow: collect card first, then create subscription/charge on submit. */
interface SetupIntentCheckoutFormProps {
  planType: PlanType;
  email: string;
  firstName?: string;
  lastName?: string;
  customerId: string | null;
  promotionCode: string | null;
  collectPaymentMethod: boolean;
  isPlanChange: boolean;
  /** Matches pricing trial mode for post-login resume URL on /billing. */
  trialOption?: TrialOption;
  /** Notifies parent to show the existing-account callout with this login URL. */
  onExistingAccountRequireLogin?: (loginUrl: string) => void;
  /** When payment succeeds in-page (no redirect), call with optional data to show inline success. */
  onPaymentSuccess?: (data?: { inviteSent?: boolean }) => void;
}

/**
 * Fetches SetupIntent only (no subscription). Shows Payment Element; on submit
 * confirms setup then creates subscription or confirms payment with the payment_method.
 */
const CHECKOUT_PENDING_SETUP_KEY = "checkout_pending_setup";

function SetupIntentCheckoutForm({
  planType,
  email,
  firstName,
  lastName,
  customerId,
  promotionCode,
  collectPaymentMethod,
  isPlanChange,
  trialOption,
  onExistingAccountRequireLogin,
  onPaymentSuccess,
}: SetupIntentCheckoutFormProps) {
  const [setupClientSecret, setSetupClientSecret] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [existingAccountMustLogin, setExistingAccountMustLogin] =
    useState(false);
  const setupIntentFetchGenRef = useRef(0);

  useEffect(() => {
    if (!email?.trim()) return;
    const generation = ++setupIntentFetchGenRef.current;
    let cancelled = false;
    setExistingAccountMustLogin(false);
    (async () => {
      try {
        const res = await fetch("/api/stripe/setup-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: email.trim(),
            customerId: customerId ?? undefined,
          }),
        });
        const data: {
          success?: boolean;
          clientSecret?: string;
          error?: string;
          message?: string;
        } = await res.json();
        if (cancelled || generation !== setupIntentFetchGenRef.current) return;
        if (data.success && data.clientSecret) {
          setSetupClientSecret(data.clientSecret);
        } else {
          if (data.error === ACCOUNT_EXISTS_REQUIRE_LOGIN) {
            setExistingAccountMustLogin(true);
            onExistingAccountRequireLogin?.(
              buildLoginUrlWithBillingResumeCheckout(planType, {
                collectPaymentMethod,
                isPlanChange,
                trialOption:
                  trialOption === "7day" || trialOption === "14day"
                    ? trialOption
                    : undefined,
              }),
            );
          }
          setError(data.message ?? data.error ?? "Failed to load payment form");
        }
      } catch (e) {
        if (!cancelled && generation === setupIntentFetchGenRef.current)
          setError(
            e instanceof Error ? e.message : "Failed to load payment form",
          );
      } finally {
        if (!cancelled && generation === setupIntentFetchGenRef.current)
          setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // customerId in deps keeps HMR hook arity stable; generation ref ignores stale responses when it hydrates.
  }, [
    email,
    customerId,
    planType,
    collectPaymentMethod,
    isPlanChange,
    trialOption,
    onExistingAccountRequireLogin,
  ]);

  if (loading && !setupClientSecret) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <LoadingSpinner />
      </div>
    );
  }
  if (error && !setupClientSecret) {
    if (existingAccountMustLogin) {
      return null;
    }
    const isActiveSubscriptionError =
      error.includes("already have an active subscription") ||
      error.includes("ACTIVE_SUBSCRIPTION_EXISTS");
    const isTrialUsedBefore = error.includes("TRIAL_USED_BEFORE");
    const isLifetimeAlreadyPurchased = error.includes("LIFETIME_ALREADY_PURCHASED");
    const isInvalidPlanChange = error.includes("INVALID_PLAN_CHANGE");
    return (
      <>
        <ErrorMessage>{error}</ErrorMessage>
        {(isActiveSubscriptionError || isTrialUsedBefore) && (
          <LoginRedirectLink href="/login?redirect=/dashboard">
            Log in to your account
          </LoginRedirectLink>
        )}
        {isLifetimeAlreadyPurchased && (
          <LoginRedirectLink href="/dashboard">Go to dashboard</LoginRedirectLink>
        )}
        {isInvalidPlanChange && (
          <LoginRedirectLink href="/billing">Manage billing</LoginRedirectLink>
        )}
      </>
    );
  }
  if (!setupClientSecret) return null;

  return (
    <Elements
      key={setupClientSecret}
      stripe={stripePromise}
      options={{
        clientSecret: setupClientSecret,
        appearance: STRIPE_APPEARANCE,
      }}
    >
      <SetupIntentSubmitForm
        elementsClientSecret={setupClientSecret}
        planType={planType}
        email={email}
        firstName={firstName}
        lastName={lastName}
        customerId={customerId}
        promotionCode={promotionCode}
        collectPaymentMethod={collectPaymentMethod}
        isPlanChange={isPlanChange}
        trialOption={trialOption}
        onExistingAccountRequireLogin={onExistingAccountRequireLogin}
        onSuccess={onPaymentSuccess}
      />
    </Elements>
  );
}

interface SetupIntentSubmitFormProps extends SetupIntentCheckoutFormProps {
  /** Matches Elements clientSecret; when it changes, cached payment method from a prior confirm is cleared. */
  elementsClientSecret: string;
  /** When payment succeeds in-page, call with optional data. Parent shows inline success view. */
  onSuccess?: (data?: { inviteSent?: boolean }) => void;
}

function SetupIntentSubmitForm({
  elementsClientSecret,
  planType,
  email,
  firstName,
  lastName,
  customerId,
  promotionCode,
  collectPaymentMethod,
  isPlanChange,
  trialOption,
  onExistingAccountRequireLogin,
  onSuccess,
}: SetupIntentSubmitFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submittingRef = useRef(false);
  /** After confirmSetup succeeds, the SetupIntent is consumed; retries must call subscription/payment APIs only. */
  const confirmedPaymentMethodIdRef = useRef<string | null>(null);

  useEffect(() => {
    confirmedPaymentMethodIdRef.current = null;
  }, [elementsClientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const returnUrl =
        typeof window !== "undefined"
          ? `${window.location.origin}/checkout-success?isLifetime=${planType === "lifetime"}`
          : "";

      if (typeof window !== "undefined" && planType !== "lifetime") {
        try {
          sessionStorage.setItem(
            CHECKOUT_PENDING_SETUP_KEY,
            JSON.stringify({
              planType,
              email: email.trim(),
              firstName: firstName?.trim() || undefined,
              lastName: lastName?.trim() || undefined,
              customerId: customerId ?? undefined,
              promotionCode: promotionCode?.trim() || undefined,
              collectPaymentMethod,
              isPlanChange,
            }),
          );
        } catch {
          // sessionStorage may be unavailable
        }
      }

      let paymentMethodId = confirmedPaymentMethodIdRef.current;

      if (!paymentMethodId) {
        const { error: submitError } = await elements.submit();
        if (submitError) {
          setError(submitError.message ?? "Check your payment details.");
          return;
        }

        const setupResult = await stripe.confirmSetup({
          elements,
          confirmParams: {
            return_url: returnUrl,
          },
          redirect: "if_required",
        });
        if (setupResult.error) {
          setError(setupResult.error.message ?? "Payment setup failed");
          return;
        }
        if (!("setupIntent" in setupResult) || !setupResult.setupIntent) {
          setError("Could not save payment method");
          return;
        }
        const setupIntent = setupResult.setupIntent as {
          payment_method?: string | { id?: string } | null;
        };
        const extracted =
          typeof setupIntent.payment_method === "string"
            ? setupIntent.payment_method
            : setupIntent.payment_method?.id;
        if (!extracted) {
          setError("Could not save payment method");
          return;
        }
        paymentMethodId = extracted;
        confirmedPaymentMethodIdRef.current = paymentMethodId;
      }

      const apiUrl =
        planType === "lifetime"
          ? "/api/stripe/payment-intent"
          : "/api/stripe/subscription-setup";
      const body: Record<string, unknown> =
        planType === "lifetime"
          ? {
              planType: "lifetime",
              email: email.trim(),
              firstName: firstName?.trim() || undefined,
              lastName: lastName?.trim() || undefined,
              customerId: customerId ?? undefined,
              promotionCode: promotionCode?.trim() || undefined,
              paymentMethodId,
            }
          : {
              planType,
              email: email.trim(),
              firstName: firstName?.trim() || undefined,
              lastName: lastName?.trim() || undefined,
              customerId: customerId ?? undefined,
              promotionCode: promotionCode?.trim() || undefined,
              collectPaymentMethod,
              isPlanChange,
              paymentMethodId,
            };
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: {
        success?: boolean;
        error?: string;
        message?: string;
        requiresAction?: boolean;
        clientSecret?: string;
        inviteSent?: boolean;
      } = await res.json();
      if (data.success) {
        if (data.requiresAction && data.clientSecret) {
          const piReturnUrl =
            typeof window !== "undefined"
              ? `${window.location.origin}/checkout-success?isLifetime=true`
              : "";
          const { error: confirmErr } = await stripe.confirmCardPayment(
            data.clientSecret,
            { return_url: piReturnUrl },
          );
          if (confirmErr) {
            setError(confirmErr.message ?? "Payment failed");
            return;
          }
        }
        if (typeof window !== "undefined" && planType !== "lifetime") {
          try {
            sessionStorage.removeItem(CHECKOUT_PENDING_SETUP_KEY);
          } catch {
            // ignore
          }
        }
        confirmedPaymentMethodIdRef.current = null;
        onSuccess?.({ inviteSent: data.inviteSent });
        return;
      }
      if (data.error === ACCOUNT_EXISTS_REQUIRE_LOGIN) {
        onExistingAccountRequireLogin?.(
          buildLoginUrlWithBillingResumeCheckout(planType, {
            collectPaymentMethod,
            isPlanChange,
            trialOption:
              trialOption === "7day" || trialOption === "14day"
                ? trialOption
                : undefined,
          }),
        );
        return;
      }
      setError(data.message ?? data.error ?? "Payment failed");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  const isServerBlockError =
    error &&
    (error.includes("ACTIVE_SUBSCRIPTION_EXISTS") ||
      error.includes("TRIAL_USED_BEFORE") ||
      error.includes("LIFETIME_ALREADY_PURCHASED") ||
      error.includes("INVALID_PLAN_CHANGE"));

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElementWrapper>
        <PaymentElement
          options={{
            layout: "tabs",
            defaultValues: {
              billingDetails: {
                email: email.trim(),
              },
            },
          }}
        />
      </PaymentElementWrapper>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {isServerBlockError && (
        <>
          {error.includes("LIFETIME_ALREADY_PURCHASED") ? (
            <LoginRedirectLink href="/dashboard">Go to dashboard</LoginRedirectLink>
          ) : error.includes("INVALID_PLAN_CHANGE") ? (
            <LoginRedirectLink href="/billing">Manage billing</LoginRedirectLink>
          ) : (
            <LoginRedirectLink href="/login?redirect=/dashboard">
              Log in to your account
            </LoginRedirectLink>
          )}
        </>
      )}
      <SubmitButton type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? (
          <>
            <StatLoadingSpinner size={16} />
            <span style={{ marginLeft: "0.4rem" }}>Processing…</span>
          </>
        ) : (
          "Pay now"
        )}
      </SubmitButton>
    </form>
  );
}

function UnifiedCheckoutForm({
  planType,
  email,
  firstName: firstNameProp,
  lastName: lastNameProp,
  promotionCode,
  customerId,
  collectPaymentMethod,
  isPlanChange,
  initialClientSecret: initialClientSecretProp,
}: UnifiedCheckoutFormProps) {
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [intentType, setIntentType] = useState<
    "payment_intent" | "setup_intent"
  >("payment_intent");
  const [loading, setLoading] = useState(!initialClientSecretProp);
  const [error, setError] = useState<string | null>(null);
  const requestKeyRef = useRef<string | null>(null);
  const hasRequestedRef = useRef(false);

  const emailForPayment =
    user?.email ?? (email && email.trim() ? email.trim() : undefined);

  const clientSecretToUse = initialClientSecretProp ?? clientSecret;

  useEffect(() => {
    if (initialClientSecretProp != null) return;
    if (!emailForPayment) return;

    const requestKey = [
      emailForPayment,
      planType,
      firstNameProp?.trim() ?? "",
      lastNameProp?.trim() ?? "",
      customerId ?? "",
      promotionCode ?? "",
      collectPaymentMethod,
      isPlanChange,
    ].join("|");

    if (requestKeyRef.current === requestKey && hasRequestedRef.current) {
      return;
    }
    if (requestKeyRef.current !== requestKey) {
      requestKeyRef.current = requestKey;
      hasRequestedRef.current = false;
      setClientSecret(null);
      setError(null);
    }
    hasRequestedRef.current = true;
    setLoading(true);

    const apiUrl =
      planType === "lifetime"
        ? "/api/stripe/payment-intent"
        : "/api/stripe/subscription-setup";
    const body: Record<string, unknown> =
      planType === "lifetime"
        ? {
            planType: "lifetime",
            email: emailForPayment,
            firstName: firstNameProp?.trim() || undefined,
            lastName: lastNameProp?.trim() || undefined,
            customerId: customerId ?? undefined,
            promotionCode: promotionCode?.trim() || undefined,
          }
        : {
            planType,
            email: emailForPayment,
            firstName: firstNameProp?.trim() || undefined,
            lastName: lastNameProp?.trim() || undefined,
            customerId: customerId ?? undefined,
            promotionCode: promotionCode?.trim() || undefined,
            collectPaymentMethod,
            isPlanChange,
          };
    (async () => {
      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = await res.json();
        if (requestKeyRef.current !== requestKey) return;
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
          setIntentType(
            data.intentType === "setup_intent"
              ? "setup_intent"
              : "payment_intent",
          );
        } else {
          setError(
            data.message ?? data.error ?? "Failed to initialize payment",
          );
        }
      } catch (e) {
        if (requestKeyRef.current === requestKey)
          setError(
            e instanceof Error ? e.message : "Failed to initialize payment",
          );
      } finally {
        if (requestKeyRef.current === requestKey) setLoading(false);
      }
    })();
  }, [
    initialClientSecretProp,
    emailForPayment,
    planType,
    firstNameProp,
    lastNameProp,
    customerId,
    promotionCode,
    collectPaymentMethod,
    isPlanChange,
  ]);

  if (loading && !clientSecretToUse) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !clientSecretToUse) {
    const isActiveSubscriptionError =
      error.includes("already have an active subscription") ||
      error.includes("ACTIVE_SUBSCRIPTION_EXISTS");
    const isLifetimeAlreadyPurchased =
      error.includes("LIFETIME_ALREADY_PURCHASED");
    const isTrialUsedBefore = error.includes("TRIAL_USED_BEFORE");
    const isInvalidPlanChange = error.includes("INVALID_PLAN_CHANGE");
    return (
      <>
        <ErrorMessage>{error}</ErrorMessage>
        {(isActiveSubscriptionError || isTrialUsedBefore) && (
          <LoginRedirectLink href="/login?redirect=/dashboard">
            Log in to your account
          </LoginRedirectLink>
        )}
        {isLifetimeAlreadyPurchased && (
          <LoginRedirectLink href="/dashboard">
            Go to dashboard
          </LoginRedirectLink>
        )}
        {isInvalidPlanChange && (
          <LoginRedirectLink href="/billing">Manage billing</LoginRedirectLink>
        )}
      </>
    );
  }

  if (!clientSecretToUse || !emailForPayment) {
    return null;
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret: clientSecretToUse,
        appearance: STRIPE_APPEARANCE,
      }}
    >
      <PaymentFormInner
        planType={planType}
        emailForPayment={emailForPayment}
        intentType={intentType}
      />
    </Elements>
  );
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

type GuestEmailGateResult =
  | { ok: true }
  | { ok: false; redirectToLogin: true }
  | { ok: false; redirectToLogin: false; message: string };

/**
 * @brief Asks the server whether a guest may proceed (no profile yet for this email).
 */
async function verifyGuestEmailAllowedForCheckout(
  email: string,
): Promise<GuestEmailGateResult> {
  try {
    const res = await fetch("/api/checkout/guest-email-eligibility", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data: {
      allowed?: boolean;
      error?: string;
      message?: string;
    } = await res.json();
    if (res.ok && data.allowed) {
      return { ok: true };
    }
    if (data.error === ACCOUNT_EXISTS_REQUIRE_LOGIN) {
      return { ok: false, redirectToLogin: true };
    }
    return {
      ok: false,
      redirectToLogin: false,
      message:
        data.message ??
        (res.status === 429
          ? "Too many requests. Try again shortly."
          : "Could not verify your email. Please try again."),
    };
  } catch {
    return {
      ok: false,
      redirectToLogin: false,
      message: "Could not verify your email. Please try again.",
    };
  }
}

interface ActivePromotion {
  id: string;
  applicable_plans?: PlanType[];
  sale_price_monthly?: number | null;
  sale_price_annual?: number | null;
  sale_price_lifetime?: number | null;
}

type PromoValidationDuration = "once" | "forever" | "repeating";

interface PromoValidationResult {
  valid: boolean;
  message: string;
  amountAfterDiscount?: number;
  currency?: string;
  duration?: PromoValidationDuration;
  durationInMonths?: number | null;
}

/**
 * @brief Validates a promo for Apply and trial-start; Pay now relies on server only.
 * @param planType - Plan being purchased.
 * @param promotionCode - Promo code entered by the user.
 * @returns Normalized validation result.
 */
async function validatePromoCodeForCheckout(
  planType: PlanType,
  promotionCode: string,
): Promise<PromoValidationResult> {
  const trimmedCode = promotionCode.trim();
  if (!trimmedCode) {
    return { valid: true, message: "" };
  }

  try {
    const res = await fetch("/api/stripe/validate-promo", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        planType,
        promotionCode: trimmedCode,
      }),
    });
    const data: {
      success?: boolean;
      valid?: boolean;
      message?: string;
      amountAfterDiscount?: number;
      currency?: string;
      duration?: PromoValidationDuration;
      durationInMonths?: number | null;
    } = await res.json();

    if (data.success && data.valid) {
      return {
        valid: true,
        message: data.message ?? "Code applied.",
        amountAfterDiscount: data.amountAfterDiscount,
        currency: data.currency ?? "usd",
        duration: data.duration,
        durationInMonths: data.durationInMonths ?? null,
      };
    }

    return {
      valid: false,
      message: data.message ?? "Invalid or expired code.",
    };
  } catch {
    return {
      valid: false,
      message: "Could not validate code. Try again.",
    };
  }
}

interface CheckoutPlanCardProps {
  planType: PlanType;
  planTitle: string;
  trialOption?: TrialOption;
  checkoutEmail: string;
  setCheckoutEmail: (v: string) => void;
  checkoutFirstName: string;
  setCheckoutFirstName: (v: string) => void;
  checkoutLastName: string;
  setCheckoutLastName: (v: string) => void;
  checkoutPromo: string;
  setCheckoutPromo: (v: string) => void;
  userEmail: string | null;
  canProceedWithEmail: boolean;
  resolvedEmail: string | null;
  customerId: string | null;
  collectPaymentMethod: boolean;
  isPlanChange: boolean;
  /** When payment succeeds in-page, call with optional data to show inline success (inviteSent, etc.). */
  onPaymentSuccess?: (data?: { inviteSent?: boolean }) => void;
}

/** Metadata for inline success view. */
interface InlineSuccessMeta {
  inviteSent: boolean;
}

function CheckoutPlanCard({
  planType,
  planTitle,
  trialOption,
  checkoutEmail,
  setCheckoutEmail,
  checkoutFirstName,
  setCheckoutFirstName,
  checkoutLastName,
  setCheckoutLastName,
  checkoutPromo,
  setCheckoutPromo,
  userEmail,
  canProceedWithEmail,
  resolvedEmail,
  customerId,
  collectPaymentMethod,
  isPlanChange,
  onPaymentSuccess,
}: CheckoutPlanCardProps) {
  const { t } = useTranslation();
  const { user, refreshUser } = useAuth();
  const is7DayNoCard = trialOption === "7day";
  const is14DayWithCard = trialOption === "14day";
  const [checkoutComplete, setCheckoutComplete] = useState(false);
  const [successMeta, setSuccessMeta] = useState<InlineSuccessMeta | null>(null);
  const [prices, setPrices] = useState<Record<PlanType, PriceData> | null>(
    null,
  );
  const [pricesLoading, setPricesLoading] = useState(true);
  const [activePromotion, setActivePromotion] =
    useState<ActivePromotion | null>(null);
  const [continuedToPayment, setContinuedToPayment] = useState<boolean>(() =>
    Boolean(user),
  );
  const [committedFirstName, setCommittedFirstName] = useState<string>("");
  const [committedLastName, setCommittedLastName] = useState<string>("");
  const [paymentSetupLoading, setPaymentSetupLoading] = useState(false);
  const [paymentSetupError, setPaymentSetupError] = useState<string | null>(
    null,
  );
  type PromoValidationStatus = "idle" | "loading" | "success" | "error";
  const [promoValidation, setPromoValidation] = useState<{
    status: PromoValidationStatus;
    message?: string;
    amountAfterDiscount?: number;
    currency?: string;
    duration?: PromoValidationDuration;
    durationInMonths?: number | null;
    /** Set when Apply succeeds; APIs and Pay now use this, not draft input text. */
    appliedCode?: string;
  }>({ status: "idle" });
  const hasAutofilledPromoRef = useRef(false);
  const trialSubmittingRef = useRef(false);
  const [guestEmailGateLoading, setGuestEmailGateLoading] = useState(false);
  const [guestEmailGateError, setGuestEmailGateError] = useState<string | null>(
    null,
  );
  const [existingAccountLoginHref, setExistingAccountLoginHref] = useState<
    string | null
  >(null);

  const handleExistingAccountRequireLogin = useCallback((loginUrl: string) => {
    setExistingAccountLoginHref(loginUrl);
  }, []);

  const committedPromoCode = useMemo(() => {
    if (
      promoValidation.status !== "success" ||
      !promoValidation.appliedCode?.trim()
    ) {
      return null;
    }
    return promoValidation.appliedCode.trim();
  }, [promoValidation.status, promoValidation.appliedCode]);

  const promoInputLocked = committedPromoCode !== null;

  const handleInlinePaymentSuccess = useCallback(
    (data?: { inviteSent?: boolean }) => {
      setCheckoutComplete(true);
      setSuccessMeta({ inviteSent: data?.inviteSent ?? false });
      refreshUser?.();
    },
    [refreshUser],
  );

  /**
   * @brief Drops the applied promo and clears the field so another code can be entered.
   */
  const removeAppliedPromo = useCallback(() => {
    setCheckoutPromo("");
    setPromoValidation({ status: "idle" });
  }, []);

  const start7DayTrial = useCallback(async () => {
    if (!resolvedEmail?.trim()) return;
    if (trialSubmittingRef.current) return;
    trialSubmittingRef.current = true;
    setPaymentSetupError(null);
    setExistingAccountLoginHref(null);
    setPaymentSetupLoading(true);
    const firstNameToSend = committedFirstName || checkoutFirstName.trim();
    const lastNameToSend = committedLastName || checkoutLastName.trim();
    try {
      if (!user?.id && resolvedEmail.trim()) {
        const gate = await verifyGuestEmailAllowedForCheckout(resolvedEmail);
        if (!gate.ok) {
          if (gate.redirectToLogin) {
            setExistingAccountLoginHref(
              buildLoginUrlWithBillingResumeCheckout(planType, {
                collectPaymentMethod: false,
                isPlanChange,
                trialOption: is7DayNoCard ? "7day" : undefined,
              }),
            );
            return;
          }
          setPaymentSetupError(gate.message);
          return;
        }
      }

      const promoCodeToValidate = committedPromoCode ?? "";
      if (promoCodeToValidate) {
        const promoCheck = await validatePromoCodeForCheckout(
          planType,
          promoCodeToValidate,
        );
        if (!promoCheck.valid) {
          setPaymentSetupError(promoCheck.message);
          return;
        }
      }

      const res = await fetch("/api/stripe/subscription-setup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          email: resolvedEmail,
          firstName: firstNameToSend || undefined,
          lastName: lastNameToSend || undefined,
          customerId: customerId ?? undefined,
          promotionCode: committedPromoCode ?? undefined,
          collectPaymentMethod: false,
          isPlanChange,
        }),
      });
      const data: {
        success?: boolean;
        inviteSent?: boolean;
        error?: string;
        message?: string;
      } = await res.json();
      if (data.success) {
        setCheckoutComplete(true);
        setSuccessMeta({ inviteSent: data.inviteSent ?? false });
        refreshUser?.();
      } else {
        if (data.error === ACCOUNT_EXISTS_REQUIRE_LOGIN) {
          setExistingAccountLoginHref(
            buildLoginUrlWithBillingResumeCheckout(planType, {
              collectPaymentMethod: false,
              isPlanChange,
              trialOption: is7DayNoCard ? "7day" : undefined,
            }),
          );
          return;
        }
        setPaymentSetupError(
          data.message ?? data.error ?? "Failed to start trial",
        );
      }
    } catch (e) {
      setPaymentSetupError(
        e instanceof Error ? e.message : "Failed to start trial",
      );
    } finally {
      trialSubmittingRef.current = false;
      setPaymentSetupLoading(false);
    }
  }, [
    planType,
    resolvedEmail,
    committedFirstName,
    committedLastName,
    checkoutFirstName,
    checkoutLastName,
    customerId,
    committedPromoCode,
    isPlanChange,
    refreshUser,
    user?.id,
    is7DayNoCard,
  ]);

  const applyPromo = useCallback(async (): Promise<boolean> => {
    if (promoInputLocked) return true;
    setPromoValidation((prev) => ({
      ...prev,
      status: "loading",
      message: undefined,
    }));
    const promoCheck = await validatePromoCodeForCheckout(planType, checkoutPromo);
    if (promoCheck.valid) {
      if (checkoutPromo.trim().length === 0) {
        setPromoValidation({
          status: "idle",
          message: undefined,
        });
      } else {
        const code = checkoutPromo.trim();
        setPromoValidation({
          status: "success",
          message: promoCheck.message,
          amountAfterDiscount: promoCheck.amountAfterDiscount,
          currency: promoCheck.currency ?? "usd",
          duration: promoCheck.duration,
          durationInMonths: promoCheck.durationInMonths ?? null,
          appliedCode: code,
        });
      }
      return true;
    }
    setPromoValidation({
      status: "error",
      message: promoCheck.message,
    });
    return false;
  }, [planType, checkoutPromo, promoInputLocked]);

  const handleContinueClick = useCallback(async () => {
    if (!canProceedWithEmail || !resolvedEmail?.trim()) return;
    setGuestEmailGateError(null);
    setExistingAccountLoginHref(null);
    if (!user?.id) {
      setGuestEmailGateLoading(true);
      try {
        const gate = await verifyGuestEmailAllowedForCheckout(resolvedEmail);
        if (!gate.ok) {
          if (gate.redirectToLogin) {
            setExistingAccountLoginHref(
              buildLoginUrlWithBillingResumeCheckout(planType, {
                collectPaymentMethod,
                isPlanChange,
                trialOption:
                  trialOption === "7day" || trialOption === "14day"
                    ? trialOption
                    : undefined,
              }),
            );
            return;
          }
          setGuestEmailGateError(gate.message);
          return;
        }
      } finally {
        setGuestEmailGateLoading(false);
      }
    }
    setCommittedFirstName(checkoutFirstName.trim());
    setCommittedLastName(checkoutLastName.trim());
    setContinuedToPayment(true);
  }, [
    canProceedWithEmail,
    resolvedEmail,
    user?.id,
    planType,
    collectPaymentMethod,
    isPlanChange,
    trialOption,
    checkoutFirstName,
    checkoutLastName,
  ]);

  const promoDurationLabel =
    promoValidation.duration === "once"
      ? t("checkout.promoDurationOnce", "First payment only")
      : promoValidation.duration === "forever"
        ? t("checkout.promoDurationForever", "Every payment")
        : promoValidation.duration === "repeating" &&
            promoValidation.durationInMonths != null
          ? t("checkout.promoDurationRepeating", "First {{count}} months", {
              count: promoValidation.durationInMonths,
            })
          : null;

  useEffect(() => {
    if (user) {
      setContinuedToPayment(true);
    }
  }, [user]);

  /**
   * @brief Clears trial/payment setup errors when the promo field changes.
   * @note Must not reset promoValidation on success; doing so (e.g. by
   * depending on promoValidation.status) clears Apply feedback immediately.
   */
  useEffect(() => {
    setPaymentSetupError(null);
  }, [checkoutPromo]);

  useEffect(() => {
    setGuestEmailGateError(null);
    setExistingAccountLoginHref(null);
  }, [checkoutEmail]);

  useEffect(() => {
    const fetchPrices = async () => {
      setPricesLoading(true);
      try {
        const response = await fetch("/api/stripe/prices");
        const result = await response.json();
        if (result.success && result.prices) setPrices(result.prices);
      } catch {
        // leave prices null
      } finally {
        setPricesLoading(false);
      }
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    const fetchPromotion = async () => {
      try {
        const response = await fetch(`/api/promotions/active?plan=${planType}`);
        const data = await response.json();
        if (data.success && data.promotion) {
          setActivePromotion(data.promotion as ActivePromotion);
          if (
            data.suggested_promo_code &&
            typeof data.suggested_promo_code === "string" &&
            !hasAutofilledPromoRef.current
          ) {
            setCheckoutPromo(data.suggested_promo_code);
            hasAutofilledPromoRef.current = true;
          }
        } else {
          setActivePromotion(null);
        }
      } catch {
        setActivePromotion(null);
      }
    };
    fetchPromotion();
  }, [planType]);

  const currentPlan = prices?.[planType];
  const priceDetails = useMemo(() => {
    if (is7DayNoCard) {
      return {
        display: t("pricing.free", "Free"),
        original: undefined as string | undefined,
        discountText: "",
        isSale: false,
      };
    }
    if (!currentPlan)
      return {
        display: "--",
        original: undefined as string | undefined,
        discountText: "",
        isSale: false,
      };
    const baseAmount = currentPlan.amount / 100;
    let discountedAmount = baseAmount;
    let discountText = "";
    let originalPrice: string | undefined;
    let isSale = false;

    if (
      promoValidation.status === "success" &&
      promoValidation.amountAfterDiscount != null
    ) {
      discountedAmount = promoValidation.amountAfterDiscount / 100;
      originalPrice =
        planType === "lifetime"
          ? `$${baseAmount.toFixed(0)}`
          : planType === "annual"
            ? `$${baseAmount.toFixed(0)}${t("pricing.perYear", "/year")}`
            : `$${baseAmount.toFixed(0)}${t("pricing.perMonth", "/month")}`;
      discountText = t("checkout.promoApplied", "Code applied");
    } else if (
      activePromotion &&
      activePromotion.applicable_plans?.includes(planType)
    ) {
      const salePriceField = `sale_price_${planType}` as keyof ActivePromotion;
      const salePrice = activePromotion[salePriceField];
      if (typeof salePrice === "number") {
        discountedAmount = salePrice;
        if (planType === "lifetime") {
          originalPrice = "$249";
          discountText = `${Math.round(((249 - salePrice) / 249) * 100)}% OFF`;
        } else if (planType === "annual") {
          originalPrice = `$79${t("pricing.perYear", "/year")}`;
          discountText = `${Math.round(((79 - salePrice) / 79) * 100)}% OFF`;
        } else {
          originalPrice = `$${baseAmount.toFixed(0)}${t("pricing.perMonth", "/month")}`;
          discountText = `${Math.round(((baseAmount - salePrice) / baseAmount) * 100)}% OFF`;
        }
        isSale = true;
      }
    } else if (currentPlan.discount) {
      if (currentPlan.discount.percent_off) {
        discountedAmount =
          baseAmount * (1 - currentPlan.discount.percent_off / 100);
        discountText = `${currentPlan.discount.percent_off}% OFF`;
      } else if (currentPlan.discount.amount_off) {
        discountedAmount = baseAmount - currentPlan.discount.amount_off / 100;
        discountText = `$${currentPlan.discount.amount_off / 100} OFF`;
      }
      if (planType === "monthly") {
        originalPrice = `$${baseAmount.toFixed(0)}${t("pricing.perMonth", "/month")}`;
      } else if (planType === "annual") {
        originalPrice = `$${baseAmount.toFixed(0)}${t("pricing.perYear", "/year")}`;
      } else {
        originalPrice = `$${baseAmount.toFixed(0)}`;
      }
    }

    return {
      display: currentPlan ? `$${discountedAmount.toFixed(0)}` : "--",
      original: originalPrice,
      discountText,
      isSale,
    };
  }, [
    currentPlan,
    planType,
    activePromotion,
    t,
    is7DayNoCard,
    promoValidation.status,
    promoValidation.amountAfterDiscount,
  ]);

  const getPeriodText = () => {
    if (is7DayNoCard) return ""; // 7-day trial is just "Free", no period
    if (planType === "lifetime") return "";
    return planType === "monthly"
      ? t("pricing.perMonth", "/month")
      : t("pricing.perYear", "/year");
  };

  const trialLabel =
    planType !== "lifetime" &&
    (is7DayNoCard
      ? t("checkout.trial7day", "7-day free trial · No card required")
      : is14DayWithCard
        ? t("checkout.trial14day", "14-day free trial · Card required")
        : null);

  const isTrialSuccess = is7DayNoCard || is14DayWithCard;
  const isLoggedIn = !!user;

  if (checkoutComplete) {
    return (
      <CheckoutCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardBody style={{ padding: "1.5rem" }}>
          <div style={{ textAlign: "center" }}>
            <SuccessIcon />
            {isTrialSuccess ? (
              <>
                <SuccessTitle>🎉 Free Trial Activated!</SuccessTitle>
                <SuccessSubtitle>
                  Welcome to Cymasphere Pro - No Charge Today
                </SuccessSubtitle>
                <SuccessMessage>
                  {isLoggedIn
                    ? "Your free trial has been successfully started. Explore all premium features with no payment required during your trial period."
                    : "Your free trial has been successfully started. Check your email to create your account and start exploring all premium features - no payment required during your trial period."}
                </SuccessMessage>
                <SuccessTrialBox>
                  <SuccessTrialTitle>✨ Zero Cost Trial</SuccessTrialTitle>
                  <SuccessTrialText>
                    You will NOT be charged during your trial period. Explore
                    all features risk-free. Cancel anytime before your trial
                    ends to avoid any charges.
                  </SuccessTrialText>
                </SuccessTrialBox>
              </>
            ) : (
              <>
                <SuccessTitle>Payment Successful!</SuccessTitle>
                <SuccessSubtitle>Thank you for your purchase</SuccessSubtitle>
                <SuccessMessage>
                  {isLoggedIn
                    ? "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
                    : "Your payment has been processed successfully. Check your email to create your account and access Cymasphere Pro."}
                </SuccessMessage>
              </>
            )}
            {successMeta?.inviteSent && !isLoggedIn && (
              <SuccessInviteBox>
                <SuccessInviteTitle>Account Invitation Sent!</SuccessInviteTitle>
                <SuccessInviteText>
                  {resolvedEmail
                    ? `We've sent an invitation email to ${resolvedEmail}. Please check your inbox (and spam folder) and click the link to set your password and access your account.`
                    : "We've sent an invitation email to your checkout email address. Please check your inbox (and spam folder) and click the link to set your password and access your account."}
                </SuccessInviteText>
              </SuccessInviteBox>
            )}
            <SuccessButtonContainer>
              <SuccessPrimaryButton href="/downloads">
                Downloads
              </SuccessPrimaryButton>
              <SuccessSecondaryButton href="/getting-started">
                Getting Started
              </SuccessSecondaryButton>
            </SuccessButtonContainer>
          </div>
        </CardBody>
      </CheckoutCard>
    );
  }

  return (
    <CheckoutCard
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <CardHeader>
        <PlanName>
          <div className="logo-container">
            <CymasphereLogo
              size="40px"
              fontSize="1.8rem"
              showText={true}
              onClick={(e: React.MouseEvent) => e.preventDefault()}
              href=""
              className=""
            />
            <span className="pro-label">PRO</span>
          </div>
        </PlanName>
        <div style={{ fontSize: "1.1rem", opacity: 0.8 }}>
          {t("pricing.proSolution")}
        </div>
        <div style={{ marginTop: "0.25rem", color: "var(--text-secondary)" }}>
          {planTitle}
        </div>
        {trialLabel && (
          <div
            style={{
              marginTop: "0.35rem",
              fontSize: "0.95rem",
              color: "var(--primary)",
              fontWeight: 600,
            }}
          >
            {trialLabel}
          </div>
        )}

        {pricesLoading && !is7DayNoCard ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <LoadingSpinner size="small" />
          </div>
        ) : (
          <>
            <PriceDisplay>
              {priceDetails.original && (
                <OriginalPrice $hasPeriod={planType !== "lifetime"}>
                  {priceDetails.original}
                </OriginalPrice>
              )}
              <PriceContainer>
                <Price>{priceDetails.display}</Price>
                <BillingPeriod>{getPeriodText()}</BillingPeriod>
                {priceDetails.discountText && (
                  <DiscountTag $isSale={priceDetails.isSale}>
                    {priceDetails.isSale ? "🔥 " : ""}
                    {priceDetails.discountText}
                  </DiscountTag>
                )}
              </PriceContainer>
            </PriceDisplay>
            {is7DayNoCard && (
              <Subtext>
                {t(
                  "checkout.trial7daySubtext",
                  "No card required. Subscribe after the trial if you like.",
                )}
              </Subtext>
            )}
            {planType === "monthly" && !is7DayNoCard && (
              <Subtext>{t("pricing.cancelAnytime", "Cancel anytime")}</Subtext>
            )}
            {planType === "annual" && currentPlan && !is7DayNoCard && (
              <Subtext>
                {t("pricing.equivalentTo", "Equivalent to")} $
                {(currentPlan.amount / 100 / 12).toFixed(2)}
                {t("pricing.perMonth", "/month")}{" "}
                {t("pricing.billed", "billed annually")}
              </Subtext>
            )}
            {planType === "lifetime" && (
              <Subtext>
                {t("pricing.oneTimePurchase", "one-time purchase")}
              </Subtext>
            )}
          </>
        )}
      </CardHeader>

      <CardBody>
        <Divider />
        <FormSection>
          {existingAccountLoginHref && (
            <ExistingAccountNotice role="alert">
              <p>
                {t(
                  "checkout.existingAccountBody",
                  "You already have an account with this email address. Log in to continue. We will open Billing so you can finish checkout.",
                )}
              </p>
              <LoginRedirectLink href={existingAccountLoginHref}>
                {t("checkout.logInToContinue", "Log in to continue")}
              </LoginRedirectLink>
            </ExistingAccountNotice>
          )}
          {continuedToPayment ? (
            <>
              <PaymentSummaryRow>
                <span>
                  {t("checkout.payingAs", "Paying as")}{" "}
                  <strong style={{ color: "var(--text)" }}>
                    {resolvedEmail}
                  </strong>
                </span>
                {!isLoggedIn && (
                  <EditLink
                    type="button"
                    onClick={() => {
                      setContinuedToPayment(false);
                      setCommittedFirstName("");
                      setCommittedLastName("");
                      setExistingAccountLoginHref(null);
                    }}
                    aria-label={t("checkout.editEmailPromo", "Edit email or promo")}
                  >
                    {t("checkout.edit", "Edit")}
                  </EditLink>
                )}
              </PaymentSummaryRow>
              <FieldGroup>
                <FieldLabel htmlFor="checkout-promo-inline">
                  {t("checkout.promoOptional", "Promo code (optional)")}
                </FieldLabel>
                <PromoApplyRow>
                  <PromoInput
                    id="checkout-promo-inline"
                    type="text"
                    placeholder={t("checkout.promoPlaceholder", "Enter code")}
                    value={checkoutPromo}
                    disabled={promoInputLocked}
                    onChange={(e) => {
                      if (promoInputLocked) return;
                      setCheckoutPromo(e.target.value);
                      if (promoValidation.status === "error") {
                        setPromoValidation({ status: "idle" });
                      }
                    }}
                  />
                  {promoInputLocked ? (
                    <RemoveAppliedPromoButton
                      type="button"
                      onClick={removeAppliedPromo}
                    >
                      {t("checkout.removePromo", "Remove promo")}
                    </RemoveAppliedPromoButton>
                  ) : (
                    <ApplyPromoButton
                      type="button"
                      disabled={promoValidation.status === "loading"}
                      onClick={applyPromo}
                    >
                      {promoValidation.status === "loading"
                        ? "…"
                        : t("checkout.applyPromo", "Apply")}
                    </ApplyPromoButton>
                  )}
                </PromoApplyRow>
                {promoValidation.status === "success" && (
                  <PromoFeedback $success>
                    {promoValidation.message}{" "}
                    {promoValidation.amountAfterDiscount != null && (
                      <>
                        {t("checkout.newPrice", "New price")}: $
                        {(promoValidation.amountAfterDiscount / 100).toFixed(0)}
                        {planType !== "lifetime" &&
                          (planType === "monthly"
                            ? ` ${t("pricing.perMonth", "/month")}`
                            : ` ${t("pricing.perYear", "/year")}`)}
                      </>
                    )}
                    {promoDurationLabel != null && (
                      <>
                        {" · "}
                        {promoDurationLabel}
                      </>
                    )}
                  </PromoFeedback>
                )}
                {promoValidation.status === "error" &&
                  promoValidation.message && (
                    <PromoFeedback $success={false}>
                      {promoValidation.message}
                    </PromoFeedback>
                  )}
              </FieldGroup>
            </>
          ) : (
            <>
              <FieldGroup>
                <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
                <Input
                  id="checkout-email"
                  type="email"
                  placeholder="you@example.com"
                  value={userEmail ?? checkoutEmail}
                  onChange={(e) => setCheckoutEmail(e.target.value)}
                  disabled={!!userEmail}
                />
              </FieldGroup>
              <NameRow>
                <FieldGroup>
                  <FieldLabel htmlFor="checkout-first-name">
                    {t("checkout.firstName", "First name")}
                  </FieldLabel>
                  <Input
                    id="checkout-first-name"
                    type="text"
                    placeholder="Jane"
                    value={checkoutFirstName}
                    onChange={(e) => setCheckoutFirstName(e.target.value)}
                  />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel htmlFor="checkout-last-name">
                    {t("checkout.lastName", "Last name")}
                  </FieldLabel>
                  <Input
                    id="checkout-last-name"
                    type="text"
                    placeholder="Doe"
                    value={checkoutLastName}
                    onChange={(e) => setCheckoutLastName(e.target.value)}
                  />
                </FieldGroup>
              </NameRow>
            </>
          )}

          {continuedToPayment && canProceedWithEmail && resolvedEmail ? (
            is7DayNoCard ? (
              <>
                {paymentSetupError && (
                  <>
                    <ErrorMessage>{paymentSetupError}</ErrorMessage>
                    {(paymentSetupError.includes(
                      "already have an active subscription",
                    ) ||
                      paymentSetupError.includes("ACTIVE_SUBSCRIPTION_EXISTS") ||
                      paymentSetupError.includes("TRIAL_USED_BEFORE")) && (
                      <LoginRedirectLink href="/login?redirect=/dashboard">
                        Log in to your account
                      </LoginRedirectLink>
                    )}
                    {paymentSetupError.includes("LIFETIME_ALREADY_PURCHASED") && (
                      <LoginRedirectLink href="/dashboard">
                        Go to dashboard
                      </LoginRedirectLink>
                    )}
                    {paymentSetupError.includes("INVALID_PLAN_CHANGE") && (
                      <LoginRedirectLink href="/billing">
                        Manage billing
                      </LoginRedirectLink>
                    )}
                  </>
                )}
                <SubmitButton
                  type="button"
                  disabled={paymentSetupLoading}
                  onClick={start7DayTrial}
                  aria-busy={paymentSetupLoading}
                >
                  {paymentSetupLoading ? (
                    <>
                      <StatLoadingSpinner size={16} />
                      <span style={{ marginLeft: "0.4rem" }}>
                        {t("checkout.startingFreeTrial", "Starting free trial…")}
                      </span>
                    </>
                  ) : (
                    t("checkout.startFreeTrial", "Start free trial")
                  )}
                </SubmitButton>
              </>
            ) : (
              <SetupIntentCheckoutForm
                planType={planType}
                email={resolvedEmail ?? ""}
                firstName={
                  (committedFirstName || checkoutFirstName.trim()) || undefined
                }
                lastName={
                  (committedLastName || checkoutLastName.trim()) || undefined
                }
                customerId={customerId}
                promotionCode={committedPromoCode}
                collectPaymentMethod={collectPaymentMethod}
                isPlanChange={isPlanChange}
                trialOption={trialOption}
                onExistingAccountRequireLogin={handleExistingAccountRequireLogin}
                onPaymentSuccess={handleInlinePaymentSuccess}
              />
            )
          ) : (
            <>
              <p
                style={{
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  marginBottom: "0.75rem",
                }}
              >
                {canProceedWithEmail
                  ? "Click Continue to enter payment details."
                  : "Enter your email above to continue."}
              </p>
              {guestEmailGateError && (
                <ErrorMessage style={{ marginBottom: "0.75rem" }}>
                  {guestEmailGateError}
                </ErrorMessage>
              )}
              <SubmitButton
                type="button"
                disabled={
                  !canProceedWithEmail ||
                  promoValidation.status === "loading" ||
                  guestEmailGateLoading
                }
                onClick={() => {
                  void handleContinueClick();
                }}
              >
                {guestEmailGateLoading ? (
                  <>
                    <StatLoadingSpinner size={16} />
                    <span style={{ marginLeft: "0.4rem" }}>
                      {t("checkout.checkingEmail", "Checking…")}
                    </span>
                  </>
                ) : promoValidation.status === "loading" ? (
                  "…"
                ) : (
                  t("checkout.continue", "Continue")
                )}
              </SubmitButton>
            </>
          )}
        </FormSection>
      </CardBody>
    </CheckoutCard>
  );
}

export interface EmbeddedCheckoutProps {
  /** Plan to checkout: monthly, annual, or lifetime. */
  planType: PlanType;
  /** Whether to collect payment method (e.g. for trial with card). */
  collectPaymentMethod: boolean;
  /** True when changing an existing subscription. */
  isPlanChange?: boolean;
  /** When starting a trial from pricing: 7-day (no card) or 14-day (card required). */
  trialOption?: TrialOption;
  /** When provided, show a close/back control that calls this instead of linking to /#pricing. */
  onClose?: () => void;
}

const planLabels: Record<PlanType, string> = {
  monthly: "Monthly",
  annual: "Annual",
  lifetime: "Lifetime",
};

/**
 * @brief Renders the full checkout form (plan card + email + promo + payment).
 * @param planType - Plan to purchase.
 * @param collectPaymentMethod - Whether payment method is collected up front.
 * @param isPlanChange - Whether this is a plan change for an existing subscriber.
 * @param onClose - Optional; when set, shows a close button that calls this instead of "Back to pricing" link.
 */
export function EmbeddedCheckout({
  planType,
  collectPaymentMethod,
  isPlanChange = false,
  trialOption,
  onClose,
}: EmbeddedCheckoutProps) {
  const { user } = useAuth();
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutFirstName, setCheckoutFirstName] = useState("");
  const [checkoutLastName, setCheckoutLastName] = useState("");
  const [checkoutPromo, setCheckoutPromo] = useState("");

  const resolvedEmail = user?.email ?? (checkoutEmail.trim() || undefined);
  const canProceedWithEmail =
    !!resolvedEmail && (!!user || isValidEmail(checkoutEmail));
  const title = planLabels[planType];

  return (
    <ContentWrapper>
      {onClose ? (
        <CloseButton type="button" onClick={onClose} aria-label="Close">
          ← Back
        </CloseButton>
      ) : (
        <BackLink href="/#pricing">← Back to pricing</BackLink>
      )}
      <CheckoutPlanCard
        planType={planType}
        planTitle={title}
        trialOption={trialOption}
        checkoutEmail={checkoutEmail}
        setCheckoutEmail={setCheckoutEmail}
        checkoutFirstName={checkoutFirstName}
        setCheckoutFirstName={setCheckoutFirstName}
        checkoutLastName={checkoutLastName}
        setCheckoutLastName={setCheckoutLastName}
        checkoutPromo={checkoutPromo}
        setCheckoutPromo={setCheckoutPromo}
        userEmail={user?.email ?? null}
        canProceedWithEmail={canProceedWithEmail}
        resolvedEmail={resolvedEmail ?? null}
        customerId={user?.profile?.customer_id ?? null}
        collectPaymentMethod={collectPaymentMethod}
        isPlanChange={isPlanChange}
        onPaymentSuccess={onClose}
      />
    </ContentWrapper>
  );
}
