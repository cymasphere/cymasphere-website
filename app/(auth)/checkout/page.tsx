/**
 * @fileoverview In-app checkout page for lifetime and subscription plans.
 * @module app/(auth)/checkout/page
 *
 * All plans use the same on-site form: email, promo code, Stripe CardElement.
 * Lifetime: Payment Intent API; Monthly/Annual: subscription-setup API (first invoice PaymentIntent).
 * confirmCardPayment then redirect to checkout-success (nnaudio pattern).
 */

"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import styled from "styled-components";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { useAuth } from "@/contexts/AuthContext";
import { PlanType } from "@/types/stripe";
import LoadingSpinner from "@/components/common/LoadingSpinner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

const PageContainer = styled.div`
  min-height: 100vh;
  background-color: var(--background);
  padding: 6rem 1.5rem 4rem;
`;

const Content = styled.div`
  max-width: 560px;
  margin: 0 auto;
`;

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

const Title = styled.h1`
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const PlanSummary = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const CardForm = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.25rem;
  margin-bottom: 1rem;
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 14px 20px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  cursor: ${(p) => (p.disabled ? "not-allowed" : "pointer")};
  opacity: ${(p) => (p.disabled ? 0.7 : 1)};
  &:hover:not(:disabled) {
    filter: brightness(1.05);
  }
`;

const ErrorMessage = styled.p`
  color: var(--error, #ef4444);
  font-size: 0.9rem;
  margin-top: 0.75rem;
`;

const FieldGroup = styled.div`
  margin-bottom: 1.25rem;
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

interface UnifiedCheckoutFormProps {
  planType: PlanType;
  email?: string | null;
  promotionCode?: string | null;
  customerId?: string | null;
  collectPaymentMethod?: boolean;
  isPlanChange?: boolean;
}

/** Single form for lifetime and subscription: CardElement + confirmCardPayment. */
function UnifiedCheckoutForm({
  planType,
  email,
  promotionCode,
  customerId,
  collectPaymentMethod,
  isPlanChange,
}: UnifiedCheckoutFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const { user } = useAuth();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailForPayment =
    user?.email ?? (email && email.trim() ? email.trim() : undefined);

  useEffect(() => {
    if (!emailForPayment) return;
    setClientSecret(null);
    setError(null);
    setLoading(true);
    let cancelled = false;
    const apiUrl =
      planType === "lifetime"
        ? "/api/stripe/payment-intent"
        : "/api/stripe/subscription-setup";
    const body: Record<string, unknown> =
      planType === "lifetime"
        ? {
            planType: "lifetime",
            email: emailForPayment,
            customerId: customerId ?? undefined,
            promotionCode: promotionCode?.trim() || undefined,
          }
        : {
            planType,
            email: emailForPayment,
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
        if (cancelled) return;
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setError(
            data.message ?? data.error ?? "Failed to initialize payment",
          );
        }
      } catch (e) {
        if (!cancelled)
          setError(
            e instanceof Error ? e.message : "Failed to initialize payment",
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [
    emailForPayment,
    planType,
    customerId,
    promotionCode,
    collectPaymentMethod,
    isPlanChange,
  ]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements || !clientSecret) return;
    setSubmitting(true);
    setError(null);
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Card form not ready.");
      setSubmitting(false);
      return;
    }
    const { error: confirmError, paymentIntent } =
      await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            email: emailForPayment,
          },
        },
      });
    if (confirmError) {
      setError(confirmError.message ?? "Payment failed");
      setSubmitting(false);
      return;
    }
    if (paymentIntent?.status === "succeeded") {
      const params = new URLSearchParams();
      params.set("payment_intent_id", paymentIntent.id);
      if (planType === "lifetime") params.set("isLifetime", "true");
      router.push(`/checkout-success?${params.toString()}`);
      return;
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <LoadingSpinner />
      </div>
    );
  }

  if (error && !clientSecret) {
    return (
      <>
        <ErrorMessage>{error}</ErrorMessage>
        <BackLink href="/#pricing">← Back to pricing</BackLink>
      </>
    );
  }

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
      <CardForm>
        <CardElement
          options={{
            style: {
              base: {
                color: "#fff",
                fontFamily: "system-ui, sans-serif",
                fontSize: "16px",
                "::placeholder": { color: "rgba(255,255,255,0.5)" },
              },
              invalid: { color: "#ef4444" },
            },
          }}
        />
      </CardForm>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <SubmitButton type="submit" disabled={submitting}>
        {submitting ? "Processing…" : "Pay now"}
      </SubmitButton>
    </form>
  );
}

function isValidEmail(s: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const plan = searchParams.get("plan") as PlanType | null;
  const collectPaymentMethod =
    searchParams.get("collectPaymentMethod") === "true";
  const isPlanChange = searchParams.get("isPlanChange") === "true";
  const { user } = useAuth();
  const [checkoutEmail, setCheckoutEmail] = useState("");
  const [checkoutPromo, setCheckoutPromo] = useState("");

  const validPlans: PlanType[] = ["monthly", "annual", "lifetime"];
  const planType = plan && validPlans.includes(plan) ? plan : null;

  const resolvedEmail = user?.email ?? (checkoutEmail.trim() || undefined);
  const canProceedWithEmail =
    !!resolvedEmail && (user ?? isValidEmail(checkoutEmail));

  useEffect(() => {
    if (plan && !planType) {
      router.replace("/#pricing");
    }
  }, [plan, planType, router]);

  if (!planType) {
    return (
      <PageContainer>
        <Content>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "2rem",
            }}
          >
            <LoadingSpinner />
          </div>
        </Content>
      </PageContainer>
    );
  }

  const planLabels: Record<PlanType, string> = {
    monthly: "Monthly",
    annual: "Annual",
    lifetime: "Lifetime",
  };
  const title = planLabels[planType];
  const pageTitle =
    planType === "lifetime" ? "Complete your purchase" : `Subscribe — ${title}`;
  const planSummary =
    planType === "lifetime"
      ? "Lifetime — one-time payment"
      : `Complete payment below to subscribe.`;

  return (
    <PageContainer>
      <Content>
        <BackLink href="/#pricing">← Back to pricing</BackLink>
        <Title>{pageTitle}</Title>
        <PlanSummary>{planSummary}</PlanSummary>

        <FieldGroup>
          <FieldLabel htmlFor="checkout-email">Email</FieldLabel>
          <Input
            id="checkout-email"
            type="email"
            placeholder="you@example.com"
            value={user?.email ?? checkoutEmail}
            onChange={(e) => setCheckoutEmail(e.target.value)}
            disabled={!!user?.email}
          />
        </FieldGroup>
        <FieldGroup>
          <FieldLabel htmlFor="checkout-promo">
            Promo code (optional)
          </FieldLabel>
          <Input
            id="checkout-promo"
            type="text"
            placeholder="Enter code"
            value={checkoutPromo}
            onChange={(e) => setCheckoutPromo(e.target.value)}
          />
        </FieldGroup>

        {!canProceedWithEmail && (
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
            Enter your email to continue.
          </p>
        )}
        {canProceedWithEmail && (
          <Elements stripe={stripePromise}>
            <UnifiedCheckoutForm
              planType={planType}
              email={resolvedEmail}
              promotionCode={checkoutPromo || null}
              customerId={user?.profile?.customer_id ?? null}
              collectPaymentMethod={collectPaymentMethod}
              isPlanChange={isPlanChange}
            />
          </Elements>
        )}
      </Content>
    </PageContainer>
  );
}

export default function CheckoutPage() {
  return (
    <PageContainer>
      <Content>
        <CheckoutContent />
      </Content>
    </PageContainer>
  );
}
