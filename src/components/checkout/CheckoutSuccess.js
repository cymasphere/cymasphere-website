import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCheckCircle } from 'react-icons/fa';

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
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 30% 50%, rgba(108, 99, 255, 0.15), transparent 50%),
                radial-gradient(circle at 70% 30%, rgba(78, 205, 196, 0.15), transparent 50%),
                radial-gradient(circle at 40% 70%, rgba(108, 99, 255, 0.1), transparent 40%);
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

const LogoContainer = styled.div`
  display: flex;
  align-items: center;
  z-index: 10;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text);
`;

const LogoImage = styled.img`
  height: 40px;
  margin-right: 10px;
`;

const LogoText = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  display: inline-block;
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
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
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

function CheckoutSuccess() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    // Only run when router is ready
    if (!router.isReady) return;
    
    fetchCheckoutSession();
  }, [router.isReady]);
  
  async function fetchCheckoutSession() {
    try {
      // Get the session ID and error from the URL query parameters
      const sessionId = router.query.session_id;
      const errorParam = router.query.error;
      
      if (errorParam === 'payment_failed') {
        setError('Your payment was declined. Please try a different payment method.');
        setLoading(false);
        return;
      }
      
      if (!sessionId) {
        setError('No session ID found');
        setLoading(false);
        return;
      }
      
      // In production, you'd call your backend to verify the session
      if (process.env.NODE_ENV === 'production') {
        try {
          const response = await fetch(`/api/checkout-session?sessionId=${sessionId}`);
          if (!response.ok) {
            throw new Error('Failed to fetch session');
          }
          const data = await response.json();
          setSessionData(data);
          setLoading(false);
        } catch (fetchError) {
          console.error('Error fetching session data:', fetchError);
          setError('Failed to verify your payment. Please contact support.');
          setLoading(false);
        }
      } else {
        // Mock data for development
        setTimeout(() => {
          setSessionData({
            customerEmail: 'customer@example.com',
            subscriptionType: 'Cymasphere Pro',
            billingPeriod: 'Monthly',
            amount: '$8.00',
          });
          setLoading(false);
        }, 1000);
      }
    } catch (err) {
      console.error('Error fetching checkout session:', err);
      setError('Failed to verify your payment. Please contact support.');
      setLoading(false);
    }
  }
  
  const handleReturnToPricing = () => {
    router.push('/pricing');
  };
  
  if (loading) {
    return (
      <PageContainer>
        <HeaderNav>
          <HeaderContent>
            <LogoContainer>
              <Logo href="/">
                <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
                <LogoText>CYMASPHERE</LogoText>
              </Logo>
            </LogoContainer>
          </HeaderContent>
        </HeaderNav>
        <LoadingContainer>
          <LoadingSpinner />
          <LoadingText>Verifying your payment...</LoadingText>
        </LoadingContainer>
      </PageContainer>
    );
  }
  
  if (error) {
    return (
      <PageContainer>
        <HeaderNav>
          <HeaderContent>
            <LogoContainer>
              <Logo href="/">
                <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
                <LogoText>CYMASPHERE</LogoText>
              </Logo>
            </LogoContainer>
          </HeaderContent>
        </HeaderNav>
        <ErrorContainer>
          <ErrorTitle>Payment Error</ErrorTitle>
          <ErrorMessage>{error}</ErrorMessage>
          <BackButton onClick={handleReturnToPricing}>
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
          <LogoContainer>
            <Logo href="/">
              <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
              <LogoText>CYMASPHERE</LogoText>
            </Logo>
          </LogoContainer>
        </HeaderContent>
      </HeaderNav>
      
      <ContentContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <SuccessIcon />
        <Title>Payment Successful!</Title>
        <Subtitle>Welcome to Cymasphere Pro</Subtitle>
        <Message>
          Thank you for subscribing to Cymasphere Pro! Your payment has been successfully processed. 
          You now have access to all premium features. We've sent a confirmation email with all the details.
        </Message>
        
        {sessionData && (
          <DetailsList>
            <DetailsItem>
              <ItemLabel>Email:</ItemLabel>
              <ItemValue>{sessionData.customerEmail}</ItemValue>
            </DetailsItem>
            <DetailsItem>
              <ItemLabel>Plan:</ItemLabel>
              <ItemValue>{sessionData.subscriptionType}</ItemValue>
            </DetailsItem>
            <DetailsItem>
              <ItemLabel>Billing Period:</ItemLabel>
              <ItemValue>{sessionData.billingPeriod}</ItemValue>
            </DetailsItem>
            <DetailsItem>
              <ItemLabel>Amount:</ItemLabel>
              <ItemValue>{sessionData.amount}</ItemValue>
            </DetailsItem>
          </DetailsList>
        )}
        
        <BackButton onClick={handleReturnToPricing}>
          Return to Pricing
        </BackButton>
      </ContentContainer>
    </PageContainer>
  );
}

export default CheckoutSuccess; 