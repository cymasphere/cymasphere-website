import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  justify-content: center;
  align-items: center;
  padding: 25px 30px;
  max-width: 1400px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const LogoContainer = styled.div`
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Logo = styled(Link)`
  display: flex;
  align-items: center;
  text-decoration: none;
  color: var(--text);
  font-weight: 700;
  font-size: 1.8rem;
  
  &:hover {
    text-decoration: none;
  }
`;

const LogoImage = styled.img`
  height: 40px;
  width: 40px;
  margin-right: 10px;
  transition: transform 0.3s ease;
  
  ${Logo}:hover & {
    transform: rotate(20deg);
  }
`;

const LogoText = styled.div`
  display: flex;
  align-items: center;
  text-transform: uppercase;
  letter-spacing: 2.5px;
  
  span {
    font-family: 'Montserrat', sans-serif;
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const SuccessContainer = styled.div`
  min-height: 60vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  text-align: center;
  max-width: 800px;
  margin: 80px auto 0;
  z-index: 1;
`;

const SuccessIcon = styled(FaCheckCircle)`
  font-size: 5rem;
  color: var(--success);
  margin-bottom: 20px;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 20px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
`;

const Message = styled.p`
  font-size: 1.2rem;
  color: var(--text);
  max-width: 600px;
  margin-bottom: 30px;
  line-height: 1.6;
`;

const DetailsList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 30px;
  width: 100%;
  max-width: 500px;
`;

const DetailsItem = styled.li`
  padding: 15px;
  margin-bottom: 15px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ItemLabel = styled.span`
  color: var(--text-secondary);
`;

const ItemValue = styled.span`
  color: var(--text);
  font-weight: 600;
`;

const Button = styled.button`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 30px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 auto;
  display: block;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(108, 99, 255, 0.4);
  }
`;

function CheckoutSuccess() {
  const [sessionData, setSessionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const location = useLocation();
  const navigate = useNavigate();
  
  useEffect(() => {
    async function fetchCheckoutSession() {
      try {
        // Get the session ID and error from the URL query parameters
        const queryParams = new URLSearchParams(location.search);
        const sessionId = queryParams.get('session_id');
        const errorParam = queryParams.get('error');
        
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
        
        // In a real application, you would make an API call to your backend
        // to verify the checkout session and get subscription details
        
        if (process.env.REACT_APP_ENV === 'production') {
          // Use environment variable for API URL
          const apiUrl = process.env.REACT_APP_API_URL || '/api';
          
          try {
            const response = await fetch(`${apiUrl}/checkout-sessions/${sessionId}`);
            if (!response.ok) {
              throw new Error('Failed to verify session');
            }
            const data = await response.json();
            setSessionData(data);
            setLoading(false);
          } catch (fetchError) {
            console.error('Error fetching session data:', fetchError);
            throw new Error('Failed to verify your payment. Please contact support.');
          }
        } else {
          // Mock data for development
          setTimeout(() => {
            setSessionData({
              customerEmail: 'customer@example.com',
              subscriptionType: 'Cymasphere Pro',
              billingPeriod: 'Monthly',
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
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
    
    fetchCheckoutSession();
  }, [location]);
  
  // Add a function to handle scrolling to pricing section
  const handleReturnToPricing = () => {
    navigate('/');
    // Use setTimeout to ensure navigation completes before scrolling
    setTimeout(() => {
      const pricingSection = document.getElementById('pricing');
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };
  
  if (loading) {
    return (
      <PageContainer>
        <HeaderNav>
          <HeaderContent>
            <LogoContainer>
              <Logo to="/">
                <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
                <LogoText>
                  <span>CYMA</span>SPHERE
                </LogoText>
              </Logo>
            </LogoContainer>
          </HeaderContent>
        </HeaderNav>
        <SuccessContainer>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Message>Verifying your payment...</Message>
          </motion.div>
        </SuccessContainer>
      </PageContainer>
    );
  }
  
  if (error) {
    return (
      <PageContainer>
        <HeaderNav>
          <HeaderContent>
            <LogoContainer>
              <Logo to="/">
                <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
                <LogoText>
                  <span>CYMA</span>SPHERE
                </LogoText>
              </Logo>
            </LogoContainer>
          </HeaderContent>
        </HeaderNav>
        <SuccessContainer>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Title>Something went wrong</Title>
            <Message>{error}</Message>
            <Button onClick={handleReturnToPricing}>Return to Pricing</Button>
          </motion.div>
        </SuccessContainer>
      </PageContainer>
    );
  }
  
  return (
    <PageContainer>
      <HeaderNav>
        <HeaderContent>
          <LogoContainer>
            <Logo to="/">
              <LogoImage src="/logo-cymasphere.svg" alt="CYMASPHERE Logo" />
              <LogoText>
                <span>CYMA</span>SPHERE
              </LogoText>
            </Logo>
          </LogoContainer>
        </HeaderContent>
      </HeaderNav>
      <SuccessContainer>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
        >
          <SuccessIcon />
          <Title>Payment Successful!</Title>
          <Message>
            Thank you for your purchase! Your account has been upgraded to Cymasphere Pro.
            You now have access to all premium features.
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
              {sessionData.billingPeriod !== 'Lifetime' && (
                <DetailsItem>
                  <ItemLabel>Next Billing Date:</ItemLabel>
                  <ItemValue>{sessionData.nextBillingDate}</ItemValue>
                </DetailsItem>
              )}
              <DetailsItem>
                <ItemLabel>Amount:</ItemLabel>
                <ItemValue>{sessionData.amount}</ItemValue>
              </DetailsItem>
            </DetailsList>
          )}
          
          <Button onClick={() => navigate('/dashboard')}>
            Go to Dashboard
          </Button>
        </motion.div>
      </SuccessContainer>
    </PageContainer>
  );
}

export default CheckoutSuccess; 