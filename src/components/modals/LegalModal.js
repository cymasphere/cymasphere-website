import React from 'react';
import styled, { keyframes } from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTimes } from 'react-icons/fa';

const ModalOverlay = styled(motion.div)`
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

const ModalContainer = styled(motion.div)`
  width: 95%;
  max-width: 800px;
  height: 90vh;
  max-height: 800px;
  background: rgba(25, 23, 36, 0.85);
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  
  &:before {
    content: '';
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(135deg, 
      rgba(108, 99, 255, 0.7) 0%, 
      rgba(108, 99, 255, 0.2) 50%, 
      rgba(78, 205, 196, 0.7) 100%);
    border-radius: 28px;
    z-index: -1;
    opacity: 0.6;
    filter: blur(8px);
  }
  
  /* Custom outline style for focus */
  &:focus {
    outline: none;
    border: 1px solid var(--primary);
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--primary);
  }
`;

const TitleContainer = styled.div`
  position: sticky;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 60px;
  z-index: 5;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(25, 23, 36, 0.95);
  backdrop-filter: blur(10px);
  height: 80px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(to right, 
      transparent, 
      rgba(108, 99, 255, 0.3), 
      rgba(78, 205, 196, 0.3), 
      transparent);
  }
`;

const ModalTitle = styled.h2`
  font-size: 2rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: -0.5px;
  text-shadow: 0 0 10px rgba(0, 0, 0, 0.8);
  color: white;
`;

const CloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  width: 40px;
  height: 40px;
  background: rgba(0, 0, 0, 0.3);
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  
  &:hover {
    background: var(--primary);
    transform: scale(1.1);
    box-shadow: 0 0 20px rgba(108, 99, 255, 0.5);
  }
`;

const ContentContainer = styled.div`
  flex: 1;
  padding: 30px;
  overflow-y: auto;
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(108, 99, 255, 0.5);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(108, 99, 255, 0.7);
  }
`;

const LegalContent = styled.div`
  color: var(--text);
  font-size: 1rem;
  line-height: 1.7;
  
  h3 {
    font-size: 1.4rem;
    margin-top: 30px;
    margin-bottom: 15px;
    color: var(--primary);
  }
  
  p {
    margin-bottom: 20px;
  }
  
  ul, ol {
    margin-bottom: 20px;
    padding-left: 25px;
  }
  
  li {
    margin-bottom: 8px;
  }
  
  a {
    color: var(--accent);
    text-decoration: none;
    transition: color 0.2s;
    
    &:hover {
      color: var(--primary);
      text-decoration: underline;
    }
  }
`;

const LegalModal = ({ isOpen, onClose, modalType }) => {
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  const getTitle = () => {
    return modalType === 'terms' ? 'Terms and Conditions' : 'Privacy Policy';
  };
  
  const getContent = () => {
    if (modalType === 'terms') {
      return (
        <LegalContent>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <p>Please read these Terms and Conditions carefully before using the Cymasphere website and services operated by Cymasphere.</p>
          
          <h3>1. Agreement to Terms</h3>
          <p>By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of the terms, you may not access the service.</p>
          
          <h3>2. Use License</h3>
          <p>Permission is granted to temporarily use Cymasphere services for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
          <ul>
            <li>Modify or copy the materials</li>
            <li>Use the materials for any commercial purpose</li>
            <li>Attempt to decompile or reverse engineer any software contained in Cymasphere</li>
            <li>Remove any copyright or other proprietary notations from the materials</li>
            <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
          </ul>
          
          <h3>3. Subscription Services</h3>
          <p>Cymasphere offers subscription-based services. By subscribing to our services, you agree to the following:</p>
          <ul>
            <li>Subscription fees are charged in advance on a monthly or yearly basis depending on your selected plan</li>
            <li>Subscriptions automatically renew unless canceled at least 24 hours before the end of the current period</li>
            <li>You can cancel your subscription at any time through your account settings</li>
            <li>No refunds will be provided for partial subscription periods</li>
          </ul>
          
          <h3>4. User Accounts</h3>
          <p>When you create an account with us, you must provide information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account.</p>
          <p>You are responsible for safeguarding the password that you use to access the service and for any activities or actions under your password.</p>
          
          <h3>5. Intellectual Property</h3>
          <p>The Service and its original content, features, and functionality are and will remain the exclusive property of Cymasphere. The Service is protected by copyright, trademark, and other laws.</p>
          
          <h3>6. Termination</h3>
          <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>
          
          <h3>7. Limitation of Liability</h3>
          <p>In no event shall Cymasphere, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.</p>
          
          <h3>8. Changes</h3>
          <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. We will provide notice prior to any new terms taking effect.</p>
          
          <h3>9. Contact Us</h3>
          <p>If you have any questions about these Terms, please contact us at support@cymasphere.com.</p>
        </LegalContent>
      );
    } else {
      return (
        <LegalContent>
          <p>Last updated: {new Date().toLocaleDateString()}</p>
          
          <p>This Privacy Policy describes how Cymasphere collects, uses, and discloses your personal information when you use our website and services.</p>
          
          <h3>1. Information We Collect</h3>
          <p>We collect several types of information from and about users of our website, including:</p>
          <ul>
            <li><strong>Personal Information:</strong> Email address, name, billing address, payment information, and other information you provide when creating an account or subscribing to our services.</li>
            <li><strong>Usage Data:</strong> Information about how you use our website, services, and features.</li>
            <li><strong>Technical Data:</strong> IP address, browser type and version, device information, and other technology identifiers.</li>
            <li><strong>User Content:</strong> Audio files, project data, settings, and other content you upload or create using our services.</li>
          </ul>
          
          <h3>2. How We Use Your Information</h3>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our services</li>
            <li>Process transactions and send related information</li>
            <li>Send you technical notices, updates, security alerts, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Personalize your experience with our services</li>
            <li>Monitor and analyze usage patterns and trends</li>
          </ul>
          
          <h3>3. Data Sharing and Disclosure</h3>
          <p>We may share your personal information in the following situations:</p>
          <ul>
            <li><strong>Service Providers:</strong> We may share your information with third-party vendors who provide services on our behalf.</li>
            <li><strong>Business Transfers:</strong> In connection with any merger, sale of company assets, financing, or acquisition of all or a portion of our business.</li>
            <li><strong>Legal Requirements:</strong> If required to do so by law or in response to valid requests by public authorities.</li>
          </ul>
          
          <h3>4. Data Security</h3>
          <p>We implement appropriate technical and organizational measures to protect the security of your personal information. However, please be aware that no method of transmission over the internet or method of electronic storage is 100% secure.</p>
          
          <h3>5. Your Data Rights</h3>
          <p>Depending on your location, you may have certain rights regarding your personal information, including:</p>
          <ul>
            <li>The right to access personal information we hold about you</li>
            <li>The right to request correction or deletion of your personal information</li>
            <li>The right to object to or restrict processing of your personal information</li>
            <li>The right to data portability</li>
          </ul>
          
          <h3>6. Children's Privacy</h3>
          <p>Our services are not intended for use by children under the age of 13. We do not knowingly collect personal information from children under 13.</p>
          
          <h3>7. Changes to This Privacy Policy</h3>
          <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.</p>
          
          <h3>8. Contact Us</h3>
          <p>If you have any questions about this Privacy Policy, please contact us at privacy@cymasphere.com.</p>
        </LegalContent>
      );
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleBackdropClick}
        >
          <ModalContainer
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
            onClick={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            <TitleContainer>
              <ModalTitle>{getTitle()}</ModalTitle>
            </TitleContainer>
            
            <CloseButton onClick={onClose} aria-label="Close modal">
              <FaTimes />
            </CloseButton>
            
            <ContentContainer>
              {getContent()}
            </ContentContainer>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default LegalModal; 