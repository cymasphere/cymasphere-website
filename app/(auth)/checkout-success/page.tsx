"use client";
import React, { Suspense, useEffect, useState, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { trackUserData, hashEmail, shouldFireEvent } from "@/utils/analytics";

const PageContainer = styled.div`
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background-color: var(--background);
  padding: 0;
  display: flex;
  flex-direction: column;
  align-items: center;

  &:before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(
        circle at 30% 50%,
        rgba(108, 99, 255, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 70% 30%,
        rgba(78, 205, 196, 0.15),
        transparent 50%
      ),
      radial-gradient(
        circle at 40% 70%,
        rgba(108, 99, 255, 0.1),
        transparent 40%
      );
    z-index: 0;
  }
`;

const HeaderNav = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  padding: 0;
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  width: 100%;
`;

const ContentContainer = styled(motion.div)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 8rem 2rem 4rem;
  max-width: 1200px;
  width: 100%;
  z-index: 1;
`;

const SuccessIcon = styled(FaCheckCircle)`
  color: var(--success);
  font-size: 5rem;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Subtitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 400;
  margin-bottom: 2rem;
  color: var(--text-secondary);
`;

const Message = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 800px;
  color: var(--text-secondary);
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
`;

const ActionButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
  }
`;

const SecondaryButton = styled.button`
  padding: 12px 24px;
  background: transparent;
  color: var(--primary);
  border: 2px solid var(--primary);
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(108, 99, 255, 0.1);
    transform: translateY(-3px);
  }
`;

const InviteMessage = styled.div`
  background: rgba(108, 99, 255, 0.1);
  border: 1px solid rgba(108, 99, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  max-width: 600px;
  text-align: center;
`;

const InviteTitle = styled.h3`
  font-size: 1.3rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--text);
`;

const InviteText = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;

const TrialInfoBox = styled.div`
  background: linear-gradient(
    135deg,
    rgba(78, 205, 196, 0.1),
    rgba(108, 99, 255, 0.1)
  );
  border: 2px solid rgba(78, 205, 196, 0.4);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  max-width: 600px;
  text-align: center;
`;

const TrialInfoTitle = styled.h3`
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: var(--accent);
`;

const TrialInfoText = styled.p`
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin: 0;
`;

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, refreshUser, loading: authLoading } = useAuth();
  const isSignedUp = searchParams.get("isSignedUp") === "true";
  // BULLETPROOF: Validate isTrial parameter - verify from session if needed
  const isTrialParam = searchParams.get("isTrial");
  const isTrialFlag = isTrialParam === "true";
  let isTrial = isTrialFlag;
  const isLifetime = searchParams.get("isLifetime") === "true";
  const isLoggedIn = !!user;
  const sessionId = searchParams.get("session_id");
  const paymentIntentId =
    searchParams.get("payment_intent_id") ?? searchParams.get("payment_intent");
  const setupIntentId =
    searchParams.get("setup_intent_id") ?? searchParams.get("setup_intent");
  const redirectStatus = searchParams.get("redirect_status");
  const detailsParam = paymentIntentId
    ? `payment_intent_id=${paymentIntentId}`
    : sessionId
      ? `session_id=${sessionId}`
      : setupIntentId
        ? `setup_intent_id=${setupIntentId}`
        : null;

  // Trial/value/currency confirmed server-side via POST /api/checkout/after-success (Stripe verify).
  const [verifiedIsTrial, setVerifiedIsTrial] = useState<boolean | null>(null);

  // Use verified trial status if available, otherwise use URL param
  if (verifiedIsTrial !== null) {
    isTrial = verifiedIsTrial;
  }
  const valueParam = searchParams.get("value");
  const currencyParam = searchParams.get("currency");
  const [subscriptionValue, setSubscriptionValue] = useState<number | null>(
    valueParam ? parseFloat(valueParam) : null,
  );
  const [subscriptionCurrency, setSubscriptionCurrency] = useState<string>(
    currencyParam || "USD",
  );
  const [inviteSent, setInviteSent] = useState(
    searchParams.get("invited") === "1",
  );
  const [sendingInvite, setSendingInvite] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  // Ref to track if we've already fired the analytics event
  const hasTrackedEvent = useRef(false);
  /** Set synchronously so React Strict Mode does not fire two concurrent POSTs for the same checkout. */
  const afterSuccessInitiatedKey = useRef<string | null>(null);
  /** Set only after a successful after-success response (idempotent UI). */
  const afterSuccessProcessedKey = useRef<string | null>(null);
  const [afterSuccessFinished, setAfterSuccessFinished] = useState(
    () => detailsParam == null,
  );
  // When Stripe redirects after 3DS with setup_intent, create the subscription from stored context.
  // Invite/refresh effect waits for this when setupIntentId is present.
  const [setupIntentSubscriptionDone, setSetupIntentSubscriptionDone] =
    useState(false);
  const hasStartedSetupIntentCompletion = useRef(false);

  useEffect(() => {
    if (!setupIntentId || redirectStatus !== "succeeded") {
      setSetupIntentSubscriptionDone(true);
      return;
    }
    if (hasStartedSetupIntentCompletion.current) return;
    type PendingSetup = {
      planType?: string;
      email?: string;
      promotionCode?: string;
      collectPaymentMethod?: boolean;
      isPlanChange?: boolean;
    };
    let pending: PendingSetup | null = null;
    try {
      const raw = sessionStorage.getItem("checkout_pending_setup");
      if (raw) pending = JSON.parse(raw) as PendingSetup;
    } catch {
      // ignore
    }
    if (!pending?.email?.trim() || !pending?.planType) {
      setSetupIntentSubscriptionDone(true);
      return;
    }
    const pendingData = pending;
    hasStartedSetupIntentCompletion.current = true;
    (async () => {
      try {
        const res = await fetch(
          "/api/stripe/complete-subscription-from-setup",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              setupIntentId,
              planType: pendingData.planType,
              email: pendingData.email,
              promotionCode: pendingData.promotionCode,
              collectPaymentMethod: pendingData.collectPaymentMethod ?? false,
              isPlanChange: pendingData.isPlanChange ?? false,
            }),
          },
        );
        const data = await res.json();
        if (data.success) {
          try {
            sessionStorage.removeItem("checkout_pending_setup");
          } catch {
            // ignore
          }
        }
      } catch (err) {
        console.error(
          "[Checkout Success] Complete subscription from setup failed:",
          err,
        );
      } finally {
        setSetupIntentSubscriptionDone(true);
      }
    })();
  }, [setupIntentId, redirectStatus]);

  // Clear guest email used for checkout so next visit doesn't reuse it
  useEffect(() => {
    try {
      sessionStorage.removeItem("checkout_guest_email");
    } catch {
      // ignore
    }
  }, []);

  // Refresh session on mount (same as login and dashboard pages)
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Verified invite/refresh via rate-limited API (no client-exposed server actions).
  useEffect(() => {
    if (authLoading) return;
    if (!detailsParam) {
      setAfterSuccessFinished(true);
      return;
    }
    if (setupIntentId && !setupIntentSubscriptionDone) return;

    const dedupeKey = [sessionId, paymentIntentId, setupIntentId]
      .filter(Boolean)
      .join("|");
    if (afterSuccessProcessedKey.current === dedupeKey) return;
    if (afterSuccessInitiatedKey.current === dedupeKey) return;
    afterSuccessInitiatedKey.current = dedupeKey;

    let cancelled = false;

    const run = async () => {
      let firstName: string | undefined;
      let lastName: string | undefined;
      try {
        const raw = sessionStorage.getItem("checkout_pending_setup");
        if (raw) {
          const p = JSON.parse(raw) as {
            firstName?: string;
            lastName?: string;
          };
          firstName = p.firstName;
          lastName = p.lastName;
        }
      } catch {
        // ignore
      }

      if (!isLoggedIn) setSendingInvite(true);

      const body: Record<string, string> = {};
      if (sessionId) body.session_id = sessionId;
      if (paymentIntentId) body.payment_intent_id = paymentIntentId;
      if (setupIntentId) body.setup_intent_id = setupIntentId;
      if (firstName?.trim()) body.first_name = firstName.trim();
      if (lastName?.trim()) body.last_name = lastName.trim();

      const postOnce = async (attempt: number): Promise<void> => {
        const res = await fetch("/api/checkout/after-success", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const data = (await res.json()) as {
          success?: boolean;
          kind?: string;
          analytics?: {
            isTrial: boolean;
            value: number | null;
            currency: string;
            mode: string;
          };
          customerEmail?: string | null;
          error?: string;
          retryable?: boolean;
        };

        if (
          res.status === 503 &&
          data.retryable &&
          attempt < 8 &&
          !cancelled
        ) {
          await new Promise((r) => setTimeout(r, 600));
          if (!cancelled) return postOnce(attempt + 1);
          return;
        }

        if (cancelled) return;

        if (data.success && data.analytics) {
          setVerifiedIsTrial(data.analytics.isTrial);
          if (data.analytics.value != null) {
            setSubscriptionValue(data.analytics.value);
          }
          setSubscriptionCurrency(data.analytics.currency || "USD");
        }
        if (data.customerEmail) {
          setCustomerEmail(data.customerEmail);
        }
        if (data.success) {
          afterSuccessProcessedKey.current = dedupeKey;
          if (!isLoggedIn) setInviteSent(true);
          console.log(
            `[Checkout Success] after-success ok (${data.kind ?? "unknown"})`,
          );
          if (refreshUser) await refreshUser();
        } else {
          console.error("[Checkout Success] after-success failed:", data.error);
          if (!cancelled) {
            afterSuccessInitiatedKey.current = null;
          }
        }
      };

      try {
        await postOnce(0);
      } catch (err) {
        console.error("[Checkout Success] after-success request error:", err);
        if (!cancelled) {
          afterSuccessInitiatedKey.current = null;
        }
      } finally {
        if (!cancelled) {
          setSendingInvite(false);
          setAfterSuccessFinished(true);
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [
    authLoading,
    detailsParam,
    isLoggedIn,
    paymentIntentId,
    sessionId,
    setupIntentId,
    setupIntentSubscriptionDone,
    refreshUser,
  ]);

  // Track promotion conversion
  useEffect(() => {
    const trackPromotionConversion = async () => {
      // Only track for paid subscriptions and lifetime (not free trials)
      if (!isTrial && subscriptionValue && subscriptionValue > 0) {
        try {
          // Get active promotion
          const response = await fetch("/api/promotions/active?plan=lifetime");
          const data = await response.json();

          if (data.success && data.promotion) {
            // Track conversion
            await fetch("/api/promotions/track", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                promotion_id: data.promotion.id,
                type: "conversion",
                value: subscriptionValue,
              }),
            });
          }
        } catch (error) {
          console.error("Error tracking promotion conversion:", error);
        }
      }
    };

    trackPromotionConversion();
  }, [isTrial, subscriptionValue]);

  // Track dataLayer events with user data (with deduplication)
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (detailsParam && !afterSuccessFinished) return;

    if (hasTrackedEvent.current) return;
    hasTrackedEvent.current = true;

    // Get user data (extracted once to avoid dependency issues)
    const userId = user?.id || user?.profile?.id;
    const userEmail = user?.email || user?.profile?.email;

    // BULLETPROOF: Use verified trial status if available, otherwise use URL param
    const finalIsTrial = verifiedIsTrial !== null ? verifiedIsTrial : isTrial;

    // Helper function to track event with user data and deduplication
    const trackEventWithUserData = async (
      eventName: string,
      eventData: Record<string, unknown> = {},
    ) => {
      // Use session_id or payment_intent_id as event ID for deduplication, or generate one
      const eventId =
        sessionId || paymentIntentId || `${eventName}_${Date.now()}`;

      // Check if event should fire (deduplication check)
      if (!shouldFireEvent(eventName, eventId)) {
        return; // Event already fired, skip
      }

      // Initialize dataLayer
      window.dataLayer = window.dataLayer || [];

      // Track user data first (only once per session)
      if (userId && userEmail) {
        await trackUserData({
          user_id: userId,
          email: userEmail,
        });

        // Get email hash for the event
        const emailHash = await hashEmail(userEmail);

        // Push the event with user data and event ID
        window.dataLayer.push({
          event: eventName,
          event_id: eventId,
          user: {
            user_id: userId,
            email_sha256: emailHash,
          },
          ...eventData,
        });
      } else {
        // Fallback: push event without user data (deduplication already checked)
        window.dataLayer.push({
          event: eventName,
          event_id: eventId,
          ...eventData,
        });
      }
    };

    if (finalIsTrial) {
      // Track free trial as subscription_success with value 0
      trackEventWithUserData("subscription_success", {
        subscription: {
          value: 0,
          currency: subscriptionCurrency || "USD",
        },
      });
    } else if (isLifetime && subscriptionValue !== null) {
      // Track lifetime purchase with Purchase event
      const purchaseItems = [
        {
          item_id: "lifetime",
          item_name: "Cymasphere Lifetime",
          category: "software",
          quantity: 1,
          price: subscriptionValue,
        },
      ];

      // Push to dataLayer (for GTM/GA) with user data
      trackEventWithUserData("purchase", {
        value: subscriptionValue,
        currency: subscriptionCurrency,
        transaction_id: sessionId || paymentIntentId || undefined,
        items: purchaseItems,
      });

      // Also fire Meta Pixel directly to ensure parameters are sent
      if (typeof window !== "undefined" && window.fbq) {
        window.fbq(
          "track",
          "Purchase",
          {
            value: subscriptionValue,
            currency: subscriptionCurrency,
            content_ids: purchaseItems.map((item) => item.item_id),
            contents: purchaseItems.map((item) => ({
              id: item.item_id,
              quantity: item.quantity || 1,
              item_price: item.price,
            })),
          },
          {
            eventID: sessionId || paymentIntentId || `purchase_${Date.now()}`,
          },
        );
      }
    } else if (subscriptionValue !== null) {
      // Track paid subscription with value and currency
      trackEventWithUserData("subscription_success", {
        subscription: {
          value: subscriptionValue,
          currency: subscriptionCurrency,
        },
      });
    } else if (detailsParam && !finalIsTrial) {
      // Fallback if value still missing: public details only (no email in response)
      fetch(`/api/checkout-session-details?${detailsParam}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.value !== null) {
            setSubscriptionValue(data.value);
            setSubscriptionCurrency(data.currency || "USD");

            // Check if it's a lifetime purchase based on mode
            if (data.mode === "payment") {
              // Track as Purchase event for lifetime
              const purchaseItems = [
                {
                  item_id: "lifetime",
                  item_name: "Cymasphere Lifetime",
                  category: "software",
                  quantity: 1,
                  price: data.value,
                },
              ];

              // Push to dataLayer (for GTM/GA) with user data
              trackEventWithUserData("purchase", {
                value: data.value,
                currency: data.currency || "USD",
                transaction_id: sessionId || paymentIntentId || undefined,
                items: purchaseItems,
              });

              if (typeof window !== "undefined" && window.fbq) {
                window.fbq(
                  "track",
                  "Purchase",
                  {
                    value: data.value,
                    currency: data.currency || "USD",
                    content_ids: purchaseItems.map((item) => item.item_id),
                    contents: purchaseItems.map((item) => ({
                      id: item.item_id,
                      quantity: item.quantity || 1,
                      item_price: item.price,
                    })),
                  },
                  {
                    eventID:
                      sessionId || paymentIntentId || `purchase_${Date.now()}`,
                  },
                );
              }
            } else {
              // Track as subscription_success for recurring
              trackEventWithUserData("subscription_success", {
                subscription: {
                  value: data.value,
                  currency: data.currency || "USD",
                },
              });
            }
          } else {
            // Fallback: track without value (assume subscription)
            trackEventWithUserData("subscription_success", {
              subscription: {
                value: 0,
                currency: "USD",
              },
            });
          }
        })
        .catch(() => {
          // If we can't fetch, still track the event without value (assume subscription)
          trackEventWithUserData("subscription_success", {
            subscription: {
              value: 0,
              currency: "USD",
            },
          });
        });
    }
  }, [
    afterSuccessFinished,
    detailsParam,
    isLifetime,
    isTrial,
    paymentIntentId,
    sessionId,
    subscriptionCurrency,
    subscriptionValue,
    user?.email,
    user?.id,
    user?.profile?.email,
    user?.profile?.id,
    verifiedIsTrial,
  ]);

  return (
    <PageContainer>
      <HeaderNav>
        <HeaderContent>
          <CymasphereLogo
            size="40px"
            fontSize="1.8rem"
            href="/"
            onClick={() => {}}
            className=""
            showText={true}
          />
        </HeaderContent>
      </HeaderNav>

      <ContentContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <SuccessIcon />

        {/* BULLETPROOF: Use verified trial status if available, otherwise use URL param */}
        {(verifiedIsTrial !== null ? verifiedIsTrial : isTrial) ? (
          <>
            <Title>🎉 Free Trial Activated!</Title>
            <Subtitle>Welcome to Cymasphere Pro - No Charge Today</Subtitle>
            <Message>
              {isLoggedIn || isSignedUp
                ? "Your free trial has been successfully started. Explore all premium features with no payment required during your trial period."
                : "Your free trial has been successfully started. Check your email to create your account and start exploring all premium features - no payment required during your trial period."}
            </Message>
            <TrialInfoBox>
              <TrialInfoTitle>✨ Zero Cost Trial</TrialInfoTitle>
              <TrialInfoText>
                You will NOT be charged during your trial period. Explore all
                features risk-free. Cancel anytime before your trial ends to
                avoid any charges.
              </TrialInfoText>
            </TrialInfoBox>
          </>
        ) : (
          <>
            <Title>Payment Successful!</Title>
            <Subtitle>Thank you for your purchase</Subtitle>
            <Message>
              {isLoggedIn || isSignedUp
                ? "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
                : "Your payment has been processed successfully. Check your email to create your account and access Cymasphere Pro."}
            </Message>
          </>
        )}

        {authLoading ? (
          <LoadingSpinner size="small" text="Processing checkout..." />
        ) : sendingInvite && !isLoggedIn ? (
          <LoadingSpinner size="small" text="Sending your invitation..." />
        ) : (
          <>
            {inviteSent && !isLoggedIn && (
              <InviteMessage>
                <InviteTitle>Account Invitation Sent!</InviteTitle>
                <InviteText>
                  {customerEmail
                    ? `We've sent an invitation email to ${customerEmail}. Please check your inbox (and spam folder) and click the link to set your password and access your account.`
                    : "We've sent an invitation email to your checkout email address. Please check your inbox (and spam folder) and click the link to set your password and access your account."}
                </InviteText>
              </InviteMessage>
            )}

            <ButtonContainer>
              {isLoggedIn ? (
                <>
                  <ActionButton onClick={() => router.push("/downloads")}>
                    Downloads
                  </ActionButton>
                  <SecondaryButton
                    onClick={() => router.push("/getting-started")}
                  >
                    Getting Started
                  </SecondaryButton>
                </>
              ) : // When not logged in, don't show any buttons - user should wait for invite
              null}
            </ButtonContainer>
          </>
        )}
      </ContentContainer>
    </PageContainer>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner
          size="small"
          fullScreen={true}
          text="Processing checkout..."
        />
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
