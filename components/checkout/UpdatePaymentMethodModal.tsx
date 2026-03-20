/**
 * @fileoverview Modal to update the default payment method for the current user's subscription in-app.
 * @module components/checkout/UpdatePaymentMethodModal
 *
 * Fetches a SetupIntent from the customer-portal API, renders Stripe Payment Element,
 * on confirm calls set-default-payment-method then closes and invokes onSuccess.
 */

"use client";

import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { FaTimes } from "react-icons/fa";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import StatLoadingSpinner from "@/components/common/StatLoadingSpinner";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "",
);

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

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const Container = styled(motion.div)`
  position: relative;
  width: 95%;
  max-width: 460px;
  max-height: 95vh;
  overflow-y: auto;
  background: var(--background);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--text);
  }
`;

const Title = styled.h2`
  margin: 0 0 1rem;
  font-size: 1.35rem;
  color: var(--text);
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
  }
`;

const ErrorMessage = styled.div`
  color: var(--error);
  font-size: 0.9rem;
  margin-top: 0.75rem;
`;

function UpdatePaymentForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
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

    const { error: submitError } = await elements.submit();
    if (submitError) {
      setError(submitError.message ?? "Check your payment details.");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    const returnUrl =
      typeof window !== "undefined" ? `${window.location.origin}/billing` : "";
    const setupResult = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: returnUrl,
      },
      redirect: "if_required",
    });

    if (setupResult.error) {
      setError(setupResult.error.message ?? "Setup failed");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    if (!("setupIntent" in setupResult) || !setupResult.setupIntent) {
      setError("Payment method could not be saved.");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    const setupIntent = setupResult.setupIntent as {
      payment_method?: string | { id?: string } | null;
    };
    const paymentMethodId =
      typeof setupIntent.payment_method === "string"
        ? setupIntent.payment_method
        : setupIntent.payment_method?.id;
    if (!paymentMethodId) {
      setError("Payment method could not be saved.");
      submittingRef.current = false;
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch("/api/stripe/customer-portal/set-default-payment-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId }),
      });
      const data = await res.json();
      if (!data.success) {
        onError(data.error ?? "Failed to update payment method");
        return;
      }
      onSuccess();
    } catch (err) {
      onError(err instanceof Error ? err.message : "Failed to update payment method");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  if (!stripe || !elements) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElementWrapper>
        <PaymentElement options={{ layout: "tabs" }} />
      </PaymentElementWrapper>
      {(error ?? null) && <ErrorMessage>{error}</ErrorMessage>}
      <SubmitButton type="submit" disabled={submitting} aria-busy={submitting}>
        {submitting ? (
          <>
            <StatLoadingSpinner size={16} />
            <span style={{ marginLeft: "0.4rem" }}>Updating…</span>
          </>
        ) : (
          "Update payment method"
        )}
      </SubmitButton>
    </form>
  );
}

export interface UpdatePaymentMethodModalProps {
  /** When true, the modal is visible. */
  open: boolean;
  /** Called when the user closes the modal (button or overlay). */
  onClose: () => void;
  /** Called after payment method was updated successfully (before closing). */
  onSuccess?: () => void;
}

/**
 * @brief Modal that loads a SetupIntent and Payment Element to update default payment method in-app.
 */
export function UpdatePaymentMethodModal({
  open,
  onClose,
  onSuccess,
}: UpdatePaymentMethodModalProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setClientSecret(null);
      setLoadError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    fetch("/api/stripe/customer-portal/update-payment-method", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        if (data.success && data.clientSecret) {
          setClientSecret(data.clientSecret);
        } else {
          setLoadError(data.error ?? "Failed to load payment form");
        }
      })
      .catch((e) => {
        if (!cancelled)
          setLoadError(e instanceof Error ? e.message : "Failed to load payment form");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSuccess = () => {
    onSuccess?.();
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <Container
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          onClick={(e) => e.stopPropagation()}
        >
          <CloseButton type="button" onClick={onClose} aria-label="Close">
            <FaTimes size={18} />
          </CloseButton>
          <Title>Update payment method</Title>
          {loading && (
            <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
              <LoadingSpinner />
            </div>
          )}
          {loadError && (
            <ErrorMessage style={{ marginBottom: "1rem" }}>{loadError}</ErrorMessage>
          )}
          {clientSecret && !loading && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: STRIPE_APPEARANCE,
              }}
            >
              <UpdatePaymentForm onSuccess={handleSuccess} onError={setLoadError} />
            </Elements>
          )}
        </Container>
      </Overlay>
    </AnimatePresence>
  );
}
