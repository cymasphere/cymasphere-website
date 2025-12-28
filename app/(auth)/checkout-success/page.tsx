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
import {
  refreshSubscriptionByCustomerId,
  inviteUserAndRefreshProStatus,
} from "@/app/actions/checkout";
import { updateUserProStatus } from "@/utils/subscriptions/check-subscription";

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
    background: radial-gradient(
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
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.1), rgba(108, 99, 255, 0.1));
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
  const isTrial = searchParams.get("isTrial") === "true";
  const isLifetime = searchParams.get("isLifetime") === "true";
  const isLoggedIn = !!user;
  const sessionId = searchParams.get("session_id");
  const valueParam = searchParams.get("value");
  const currencyParam = searchParams.get("currency");
  const [subscriptionValue, setSubscriptionValue] = useState<number | null>(
    valueParam ? parseFloat(valueParam) : null
  );
  const [subscriptionCurrency, setSubscriptionCurrency] = useState<string>(
    currencyParam || "USD"
  );
  const [inviteSent, setInviteSent] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string | null>(null);

  // Ref to track if we've already fired the analytics event
  const hasTrackedEvent = useRef(false);
  // Ref to track if we've already processed the invite/refresh
  const hasProcessedInvite = useRef(false);

  // Refresh pro status on mount only (same as login and dashboard pages)
  useEffect(() => {
    refreshUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Invite user and refresh pro status (for logged-out users) or refresh pro status (for logged-in users)
  // Wait for auth to finish loading before processing
  useEffect(() => {
    // Don't process until auth has finished loading
    if (authLoading) return;
    // Only process once
    if (hasProcessedInvite.current) return;
    if (!sessionId) return;

    const handleUserInviteAndRefresh = async () => {
      hasProcessedInvite.current = true;

      try {
        if (isLoggedIn && user?.id) {
          // User is logged in - refresh pro status immediately
          console.log(
            `[Checkout Success] User is logged in (${user.id}), refreshing pro status immediately`
          );
          const result = await updateUserProStatus(user.id);
          console.log(
            `[Checkout Success] Pro status refreshed: ${result.subscription} (${result.source})`
          );
          // Also refresh user context to update UI
          if (refreshUser) {
            await refreshUser();
          }
        } else if (!isLoggedIn) {
          // User is not logged in - invite them and refresh pro status
          console.log(
            "[Checkout Success] User is not logged in, inviting and refreshing pro status"
          );

          // First, get the customer email from the session
          try {
            const response = await fetch(
              `/api/checkout-session-details?session_id=${sessionId}`
            );
            const data = await response.json();
            if (data.success && data.customerEmail) {
              setCustomerEmail(data.customerEmail);
            }
          } catch (error) {
            console.error(
              "[Checkout Success] Error fetching session email:",
              error
            );
          }

          const result = await inviteUserAndRefreshProStatus(sessionId);

          if (result.success) {
            console.log(
              `[Checkout Success] User invited and pro status refreshed: ${result.subscription} (userId: ${result.userId})`
            );
            setInviteSent(true);
            // Get email from session if we don't have it yet
            if (!customerEmail) {
              try {
                const response = await fetch(
                  `/api/checkout-session-details?session_id=${sessionId}`
                );
                const data = await response.json();
                if (data.success && data.customerEmail) {
                  setCustomerEmail(data.customerEmail);
                }
              } catch (error) {
                console.error("[Checkout Success] Error getting email:", error);
              }
            }
          } else {
            console.error(
              "[Checkout Success] Failed to invite user and refresh pro status:",
              result.error
            );
          }
        }
      } catch (error) {
        console.error(
          "[Checkout Success] Error in user invite/refresh process:",
          error
        );
        // Don't block page rendering on error
      }
    };

    handleUserInviteAndRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isLoggedIn, user?.id, authLoading]);

  // Refresh subscription status by customer ID (works even if not logged in)
  useEffect(() => {
    const refreshByCustomerId = async () => {
      if (!sessionId) return;

      try {
        // Fetch session details to get customer ID
        const response = await fetch(
          `/api/checkout-session-details?session_id=${sessionId}`
        );
        const data = await response.json();

        if (data.success && data.customerId) {
          // Call server action to refresh subscription status
          const result = await refreshSubscriptionByCustomerId(data.customerId);

          if (result.success) {
            console.log(
              "[Checkout Success] Refreshed subscription status for customer:",
              data.customerId,
              "subscription:",
              result.subscription
            );

            // If user is logged in, also refresh their context
            if (isLoggedIn && refreshUser) {
              await refreshUser();
            }
          } else {
            console.error(
              "[Checkout Success] Failed to refresh subscription:",
              result.error
            );
          }
        }
      } catch (error) {
        console.error(
          "[Checkout Success] Error refreshing subscription by customer ID:",
          error
        );
      }
    };

    refreshByCustomerId();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, isLoggedIn]);

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

    // Only track once
    if (hasTrackedEvent.current) return;
    hasTrackedEvent.current = true;

    // Get user data (extracted once to avoid dependency issues)
    const userId = user?.id || user?.profile?.id;
    const userEmail = user?.email || user?.profile?.email;

    // Helper function to track event with user data and deduplication
    const trackEventWithUserData = async (
      eventName: string,
      eventData: Record<string, unknown> = {}
    ) => {
      // Use session_id as event ID for deduplication, or generate one
      const eventId = sessionId || `${eventName}_${Date.now()}`;

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

    if (isTrial) {
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
        transaction_id: sessionId,
        items: purchaseItems,
      });

      // Also fire Meta Pixel directly to ensure parameters are sent
      // (trackPurchase would duplicate dataLayer push, so we fire fbq directly)
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
            eventID: sessionId || `purchase_${Date.now()}`, // For deduplication with server events
          }
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
    } else if (sessionId && !isTrial) {
      // If we have session_id but no value, fetch it from API
      fetch(`/api/checkout-session-details?session_id=${sessionId}`)
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
                transaction_id: sessionId,
                items: purchaseItems,
              });

              // Also fire Meta Pixel directly to ensure parameters are sent
              // (trackPurchase would duplicate dataLayer push, so we fire fbq directly)
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
                    eventID: sessionId || `purchase_${Date.now()}`, // For deduplication with server events
                  }
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
  }, []); // Empty deps - run once on mount, ref prevents duplicate runs

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

        {isTrial ? (
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
                You will NOT be charged during your trial period. Explore all features risk-free. Cancel anytime before your trial ends to avoid any charges.
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
          <LoadingSpinner
            size="small"
            text="Processing checkout..."
          />
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
                  <SecondaryButton onClick={() => router.push("/getting-started")}>
                    Getting Started
                  </SecondaryButton>
                </>
              ) : (
                // When not logged in, don't show any buttons - user should wait for invite
                null
              )}
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
