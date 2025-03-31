import React, { useState } from 'react';
import { useAuth } from '../contexts/NextAuthContext';
import Link from 'next/link';
import { useRouter } from 'next/router';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaEnvelope, FaCheckCircle, FaExclamationTriangle, FaArrowLeft, FaTimes, FaCheck } from 'react-icons/fa';

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

const BackLink = styled.a`
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

const VerificationBanner = styled(motion.div)`
  background: linear-gradient(to right, rgba(108, 99, 255, 0.1), rgba(36, 174, 143, 0.1));
  border-radius: 10px;
  padding: 15px 20px;
  margin-bottom: 30px;
  position: relative;
  border: 1px solid rgba(108, 99, 255, 0.2);
  overflow: hidden;
`;

const BannerContent = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
`;

const MessageContainer = styled.div`
  flex: 1;
`;

const Title = styled.h3`
  margin: 0 0 5px 0;
  font-size: 1.1rem;
  color: var(--text);
`;

const Message = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.95rem;
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  
  @media (max-width: 768px) {
    margin-top: 10px;
  }
`;

const Button = styled.button`
  padding: 8px 15px;
  border-radius: 6px;
  border: none;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-2px);
  }
`;

const PrimaryButton = styled(Button)`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }
`;

const SecondaryButton = styled(Button)`
  background: rgba(255, 255, 255, 0.07);
  color: var(--text);
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1rem;
  transition: color 0.2s;
  
  &:hover {
    color: var(--text);
  }
`;

const SuccessOverlay = styled(motion.div)`
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  
  svg {
    font-size: 2.5rem;
    color: #00C853;
    margin-bottom: 10px;
  }
  
  p {
    color: white;
    font-size: 1.1rem;
    margin: 0;
    text-align: center;
  }
`;

const LinkButton = styled(Button)`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  
  &:hover {
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }
`;

/**
 * Component to display email verification status and allow resending verification emails
 */
function EmailVerification() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const auth = useAuth() || {};
  const { currentUser, verifyEmail } = auth;
  const [status, setStatus] = useState('');
  const [isError, setIsError] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);

  const isVerified = currentUser?.emailVerified;
  
  const handleResendEmail = async () => {
    setLoading(true);
    setError('');
    setSuccess(false);
    
    try {
      if (!verifyEmail) {
        throw new Error('Email verification is not initialized. Please try again later.');
      }
      
      await verifyEmail();
      setSuccess(true);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };
  
  const loadingAnimation = {
    scale: [1, 1.2, 1],
    opacity: [0.6, 1, 0.6],
    transition: { repeat: Infinity, duration: 0.8 }
  };
  
  // If no user or user is already verified, don't show this component
  if (!currentUser || isVerified || dismissed) {
    return null;
  }
  
  return (
    <PageContainer>
      <Link href="/" passHref>
        <BackLink>
          <FaArrowLeft /> Back to Home
        </BackLink>
      </Link>
      
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
              disabled={cooldown || sending}
              whileHover={!sending ? { scale: 1.05 } : {}}
              whileTap={!sending ? { scale: 0.98 } : {}}
            >
              {sending ? (
                <>
                  <LoadingDot animate={loadingAnimation} custom={0} />
                  <LoadingDot animate={{...loadingAnimation, transition: {delay: 0.2, ...loadingAnimation.transition}}} />
                  <LoadingDot animate={{...loadingAnimation, transition: {delay: 0.4, ...loadingAnimation.transition}}} />
                </>
              ) : (
                'Resend Verification Email'
              )}
            </VerificationButton>
            
            {cooldown && (
              <CountdownText>
                You can request another email in {cooldownTime} seconds
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
      
      <VerificationBanner
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <BannerContent>
          <IconContainer>
            <FaEnvelope />
          </IconContainer>
          <MessageContainer>
            <Title>Verify your email address</Title>
            <Message>
              We sent a verification email to {currentUser.email}. 
              Please check your inbox and spam folder.
            </Message>
          </MessageContainer>
          <ButtonsContainer>
            <PrimaryButton 
              onClick={handleResendEmail}
              disabled={cooldown || sending}
            >
              {cooldown 
                ? `Resend (${cooldownTime}s)` 
                : sending 
                  ? 'Sending...' 
                  : 'Resend Email'}
            </PrimaryButton>
            <SecondaryButton onClick={() => setDismissed(true)}>
              Dismiss
            </SecondaryButton>
          </ButtonsContainer>
        </BannerContent>
        <CloseButton onClick={() => setDismissed(true)}>
          <FaTimes />
        </CloseButton>
        
        {/* Success message overlay */}
        {showSuccess && (
          <SuccessOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <FaCheck />
            <p>Verification email sent successfully!</p>
          </SuccessOverlay>
        )}
      </VerificationBanner>
      
      <ButtonGroup>
        <Button type="button" onClick={handleResendEmail} disabled={loading}>
          Resend Verification Email
        </Button>
        <Link href="/dashboard" passHref>
          <LinkButton>
            Continue to Dashboard
          </LinkButton>
        </Link>
      </ButtonGroup>
    </PageContainer>
  );
}

export default EmailVerification; 