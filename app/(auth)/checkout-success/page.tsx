"use client";
import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AuthContext";
import { trackUserData, hashEmail } from "@/utils/analytics";

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

const BackButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 2rem;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
  }
`;

function CheckoutSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const isSignedUp = searchParams.get("isSignedUp") === "true";
  const isTrial = searchParams.get("isTrial") === "true";
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

  // Track promotion conversion
  useEffect(() => {
    const trackPromotionConversion = async () => {
      // Only track for paid subscriptions and lifetime (not free trials)
      if (!isTrial && subscriptionValue && subscriptionValue > 0) {
        try {
          // Get active promotion
          const response = await fetch('/api/promotions/active?plan=lifetime');
          const data = await response.json();
          
          if (data.success && data.promotion) {
            // Track conversion
            await fetch('/api/promotions/track', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                promotion_id: data.promotion.id,
                type: 'conversion',
                value: subscriptionValue,
              }),
            });
          }
        } catch (error) {
          console.error('Error tracking promotion conversion:', error);
        }
      }
    };

    trackPromotionConversion();
  }, [isTrial, subscriptionValue]);

  // Track dataLayer events with user data
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.dataLayer = window.dataLayer || [];

    // Get user data
    const userId = user?.id || user?.profile?.id;
    const userEmail = user?.email || user?.profile?.email;

    // Helper function to push event with user data
    const pushEventWithUserData = async (eventData: any) => {
      if (userId && userEmail) {
        // First push user data
        await trackUserData({
          user_id: userId,
          email: userEmail,
        });
        
        // Get email hash for the event
        const emailHash = await hashEmail(userEmail);
        
        // Then push the event with user data
        window.dataLayer.push({
          ...eventData,
          user: {
            user_id: userId,
            email_sha256: emailHash,
          },
        });
      } else {
        // Fallback: push event without user data
        window.dataLayer.push(eventData);
      }
    };

    if (isTrial) {
      // Track free trial with user data
      pushEventWithUserData({
        event: 'free_trial'
      });
    } else if (subscriptionValue !== null) {
      // Track paid subscription with value and currency
      pushEventWithUserData({
        event: 'subscription_success',
        subscription: {
          value: subscriptionValue,
          currency: subscriptionCurrency
        }
      });
    } else if (sessionId && !isTrial) {
      // If we have session_id but no value, fetch it from API
      fetch(`/api/checkout-session-details?session_id=${sessionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.value !== null) {
            setSubscriptionValue(data.value);
            setSubscriptionCurrency(data.currency || 'USD');
            pushEventWithUserData({
              event: 'subscription_success',
              subscription: {
                value: data.value,
                currency: data.currency || 'USD'
              }
            });
          } else {
            // Fallback: track without value
            pushEventWithUserData({
              event: 'subscription_success',
              subscription: {
                value: 0,
                currency: 'USD'
              }
            });
          }
        })
        .catch(() => {
          // If we can't fetch, still track the event without value
          pushEventWithUserData({
            event: 'subscription_success',
            subscription: {
              value: 0,
              currency: 'USD'
            }
          });
        });
    }
  }, [isTrial, subscriptionValue, subscriptionCurrency, sessionId, user]);

  const handleContinue = () => {
    if (isLoggedIn) {
      router.push("/downloads");
    } else if (isSignedUp) {
      router.push("/downloads");
    } else {
      router.push("/signup");
    }
  };

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
            <Title>Trial Started!</Title>
            <Subtitle>Welcome to Cymasphere Pro</Subtitle>
            <Message>
              {isSignedUp
                ? "Your free trial has been successfully activated. You can now explore all the premium features of Cymasphere Pro."
                : "Your free trial has been successfully activated. To start using Cymasphere Pro, you'll need to create your account."}
            </Message>
          </>
        ) : (
          <>
            <Title>Payment Successful!</Title>
            <Subtitle>Thank you for your purchase</Subtitle>
            <Message>
              {isSignedUp
                ? "Your payment has been processed successfully. You can now access your Cymasphere Pro downloads."
                : "Your payment has been processed successfully. To start using Cymasphere Pro, you'll need to create your account."}
            </Message>
          </>
        )}

        <BackButton onClick={handleContinue}>
          {isLoggedIn || isSignedUp ? "Download Cymasphere" : "Create Your Account"}
        </BackButton>
      </ContentContainer>
    </PageContainer>
  );
}

export default function CheckoutSuccess() {
  return (
    <Suspense
      fallback={
        <LoadingSpinner
          size="large"
          fullScreen={true}
          text="Processing checkout..."
        />
      }
    >
      <CheckoutSuccessContent />
    </Suspense>
  );
}
