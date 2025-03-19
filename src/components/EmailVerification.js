import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaArrowLeft } from 'react-icons/fa';

// Styled components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background-color: var(--background);
  position: relative;
  
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

const BackButton = styled(Link)`
  position: fixed;
  top: 25px;
  left: 30px;
  display: flex;
  align-items: center;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 1rem;
  z-index: 10;
  transition: all 0.3s ease;
  
  &:hover {
    color: var(--text);
  }
  
  svg {
    margin-right: 8px;
  }
  
  @media (max-width: 768px) {
    top: 20px;
    left: 20px;
  }
`;

const VerificationContainer = styled(motion.div)`
  max-width: 650px;
  width: 100%;
  margin: 20px auto;
  border-radius: 12px;
  background: rgba(25, 23, 36, 0.85);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(135deg, 
      rgba(108, 99, 255, 0.5) 0%, 
      rgba(108, 99, 255, 0) 50%, 
      rgba(78, 205, 196, 0.5) 100%);
    border-radius: 18px;
    z-index: -1;
    opacity: 0.4;
    filter: blur(8px);
  }
`;

const VerificationContent = styled.div`
  padding: 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const IconContainer = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 50%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
`;

const VerificationTitle = styled(motion.h2)`
  text-align: center;
  margin-bottom: 1.5rem;
  color: var(--text);
  font-size: 2rem;
  
  span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const VerificationText = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
  line-height: 1.5;
  text-align: center;
  max-width: 500px;
`;

const EmailHighlight = styled.span`
  color: var(--text);
  font-weight: 500;
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const VerificationButton = styled(motion.button)`
  padding: 0.85rem 2rem;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: fit-content;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  min-width: 240px;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
    transform: translateY(-2px);
  }
  
  &:disabled {
    background: rgba(108, 99, 255, 0.5);
    cursor: not-allowed;
    transform: translateY(0);
    box-shadow: none;
  }
`;

const LoadingDot = styled(motion.span)`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: white;
  margin: 0 2px;
  display: inline-block;
`;

const StatusMessage = styled(motion.div)`
  margin-top: 1rem;
  font-size: 0.9rem;
  color: ${props => props.isError ? 'var(--error)' : 'var(--success)'};
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CountdownText = styled.div`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin-top: 0.75rem;
`;

/**
 * Component to display email verification status and allow resending verification emails
 */
function EmailVerification() {
  const { currentUser, resendVerificationEmail } = useAuth();
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const isVerified = currentUser?.emailVerified;
  
  const handleResendEmail = async () => {
    if (countdown > 0 || isResending) return;
    
    setIsResending(true);
    setStatus('');
    setIsError(false);
    
    try {
      await resendVerificationEmail();
      setStatus('Verification email sent successfully!');
      setIsError(false);
      
      // Start a 60-second countdown
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown(prevCount => {
          if (prevCount <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
      
    } catch (error) {
      setStatus(`Error: ${error.message}`);
      setIsError(true);
    } finally {
      setIsResending(false);
    }
  };
  
  const loadingAnimation = {
    scale: [1, 1.2, 1],
    opacity: [0.6, 1, 0.6],
    transition: { repeat: Infinity, duration: 0.8 }
  };
  
  // If no user or user is already verified, don't show this component
  if (!currentUser || isVerified) {
    return null;
  }
  
  return (
    <PageContainer>
      <BackButton to="/">
        <FaArrowLeft /> Back to Home
      </BackButton>
      
      <VerificationContainer
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <VerificationContent>
          <IconContainer>
            <FaEnvelope size={32} color="white" />
          </IconContainer>
          
          <VerificationTitle>
            Email <span>Verification</span> Required
          </VerificationTitle>
          
          <VerificationText>
            Please verify <EmailHighlight>{currentUser.email}</EmailHighlight> to access your dashboard. Check your inbox for a verification link.
          </VerificationText>
          
          <ButtonGroup>
            <VerificationButton 
              onClick={handleResendEmail} 
              disabled={countdown > 0 || isResending}
              whileHover={!isResending ? { scale: 1.05 } : {}}
              whileTap={!isResending ? { scale: 0.98 } : {}}
            >
              {isResending ? (
                <>
                  <LoadingDot animate={loadingAnimation} custom={0} />
                  <LoadingDot animate={{...loadingAnimation, transition: {delay: 0.2, ...loadingAnimation.transition}}} />
                  <LoadingDot animate={{...loadingAnimation, transition: {delay: 0.4, ...loadingAnimation.transition}}} />
                </>
              ) : (
                'Resend Verification Email'
              )}
            </VerificationButton>
            
            {countdown > 0 && (
              <CountdownText>
                You can request another email in {countdown} seconds
              </CountdownText>
            )}
            
            {status && (
              <StatusMessage 
                isError={isError}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {isError ? (
                  <><FaExclamationTriangle size={14} /> {status}</>
                ) : (
                  <><FaCheckCircle size={14} /> {status}</>
                )}
              </StatusMessage>
            )}
          </ButtonGroup>
        </VerificationContent>
      </VerificationContainer>
    </PageContainer>
  );
}

export default EmailVerification; 