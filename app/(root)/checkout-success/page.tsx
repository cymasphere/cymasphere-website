"use client";
import React, { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import { FaCheckCircle } from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";

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

const DetailsList = styled.div`
  background: rgba(30, 30, 30, 0.5);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 2rem;
  margin-bottom: 2rem;
  width: 100%;
  max-width: 600px;
`;

const DetailsItem = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    margin-bottom: 0;
    padding-bottom: 0;
    border-bottom: none;
  }
`;

const ItemLabel = styled.span`
  font-weight: 600;
  color: var(--text-secondary);
`;

const ItemValue = styled.span`
  font-weight: 400;
  color: var(--text);
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

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--primary);
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);
`;

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  padding: 0 2rem;
  text-align: center;
`;

const ErrorTitle = styled.h1`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: var(--error);
`;

const ErrorMessage = styled.p`
  font-size: 1.2rem;
  line-height: 1.6;
  margin-bottom: 2rem;
  max-width: 800px;
  color: var(--text-secondary);
`;

type SessionData = {
  id: string;
  status: string;
  customerEmail: string | null;
  isExistingUser: boolean;
};
export default function CheckoutSuccess() {
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const fetchCheckoutSession = useCallback(async () => {
    try {
      // Get the session ID and error from the URL query parameters
      const sessionId = searchParams.get("session_id");
      const email = searchParams.get("email");
      const errorParam = searchParams.get("error");

      if (errorParam === "payment_failed") {
        setError(
          "Your payment was declined. Please try a different payment method."
        );
        setLoading(false);
        return;
      }

      if (!sessionId) {
        setError("No session ID found");
        setLoading(false);
        return;
      }

      // Mock API call to check if user exists
      const userExists = false; // This would be replaced with an actual API call

      setSessionData({
        id: sessionId,
        status: "complete",
        customerEmail: email || null,
        isExistingUser: userExists,
      });

      setLoading(false);
    } catch (error) {
      setError(
        `Failed to fetch session data: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchCheckoutSession();
  }, [fetchCheckoutSession]);

  const handleContinue = () => {
    if (sessionData?.isExistingUser) {
      router.push("/dashboard");
    } else {
      router.push(
        `/signup?email=${encodeURIComponent(
          sessionData?.customerEmail || ""
        )}&checkout_complete=true`
      );
    }
  };

  if (loading) {
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
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Processing your payment...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }

  if (error) {
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
        <ErrorContainer>
          <ErrorTitle>Oops! Something went wrong</ErrorTitle>
          <ErrorMessage>{error}</ErrorMessage>
          <BackButton onClick={() => router.push("/#pricing")}>
            Return to Pricing
          </BackButton>
        </ErrorContainer>
      </PageContainer>
    );
  }

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
        <Title>Payment Successful!</Title>
        <Subtitle>Thank you for your purchase</Subtitle>
        <Message>
          {sessionData?.isExistingUser
            ? "Your payment has been processed successfully. Click below to access your dashboard and start using Cymasphere Pro!"
            : "Your payment has been processed successfully. To start using Cymasphere Pro, you'll need to create your account. Click below to set up your account with your purchase email."}
        </Message>

        <DetailsList>
          <DetailsItem>
            <ItemLabel>Order ID:</ItemLabel>
            <ItemValue>{sessionData?.id || "Processing..."}</ItemValue>
          </DetailsItem>
          <DetailsItem>
            <ItemLabel>Status:</ItemLabel>
            <ItemValue>Complete</ItemValue>
          </DetailsItem>
          <DetailsItem>
            <ItemLabel>Email:</ItemLabel>
            <ItemValue>
              {sessionData?.customerEmail || "Processing..."}
            </ItemValue>
          </DetailsItem>
        </DetailsList>

        <BackButton onClick={handleContinue} style={{ marginTop: "2rem" }}>
          {sessionData?.isExistingUser
            ? "Go to Dashboard"
            : "Create Your Account"}
        </BackButton>
      </ContentContainer>
    </PageContainer>
  );
}
