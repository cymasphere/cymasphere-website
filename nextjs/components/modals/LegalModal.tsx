"use client";

import React, { useEffect, useCallback } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";

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
  will-change: opacity;
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
    content: "";
    position: absolute;
    top: -5px;
    left: -5px;
    right: -5px;
    bottom: -5px;
    background: linear-gradient(
      135deg,
      rgba(108, 99, 255, 0.7) 0%,
      rgba(108, 99, 255, 0.2) 50%,
      rgba(78, 205, 196, 0.7) 100%
    );
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
    content: "";
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(
      to right,
      transparent,
      rgba(108, 99, 255, 0.3),
      rgba(78, 205, 196, 0.3),
      transparent
    );
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

  ul,
  ol {
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
  // Improved body overflow management to prevent memory leaks
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalStyle;
    }

    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Memoize content rendering function to prevent unnecessary re-creation
  const getTitle = useCallback(() => {
    switch (modalType) {
      case "terms":
        return "Terms of Service";
      case "privacy":
        return "Privacy Policy";
      default:
        return "Legal Information";
    }
  }, [modalType]);

  // Memoize the content to prevent expensive DOM creation on each render
  const getContent = useCallback(() => {
    if (modalType === "terms") {
      return (
        <LegalContent>
          <h2>Terms of Service</h2>

          <section>
            <h3>1. Acceptance of Terms</h3>
            <p>
              By accessing or using Cymasphere's services, website, or
              applications, you agree to be bound by these Terms of Service. If
              you do not agree to these terms, please do not use our services.
            </p>
          </section>

          <section>
            <h3>2. Description of Service</h3>
            <p>
              Cymasphere provides music theory and composition tools through web
              and desktop applications. These services may change from time to
              time without prior notice.
            </p>
          </section>

          <section>
            <h3>3. User Accounts</h3>
            <p>
              Some features of our services require you to create an account.
              You are responsible for maintaining the confidentiality of your
              account information and for all activities that occur under your
              account.
            </p>
          </section>

          <section>
            <h3>4. User Content</h3>
            <p>
              You retain all rights to any content you create, upload, or share
              through our services. By uploading content, you grant Cymasphere a
              non-exclusive license to use, reproduce, and distribute your
              content solely to provide services to you.
            </p>
          </section>

          <section>
            <h3>5. Intellectual Property</h3>
            <p>
              Cymasphere and its content, features, and functionality are owned
              by us and are protected by copyright, trademark, and other
              intellectual property laws.
            </p>
          </section>

          <section>
            <h3>6. Subscription and Payments</h3>
            <p>
              Various subscription plans are available for Cymasphere. By
              subscribing, you agree to pay the applicable fees. Subscription
              fees are non-refundable except as required by law.
            </p>
          </section>

          <section>
            <h3>7. Termination</h3>
            <p>
              We reserve the right to terminate or suspend your account and
              access to our services for violations of these terms or for any
              other reason at our discretion.
            </p>
          </section>

          <section>
            <h3>8. Disclaimer of Warranties</h3>
            <p>
              Our services are provided on an "as is" and "as available" basis.
              We make no warranties, expressed or implied, regarding the
              reliability, availability, or accuracy of our services.
            </p>
          </section>

          <section>
            <h3>9. Limitation of Liability</h3>
            <p>
              In no event shall Cymasphere be liable for any indirect,
              incidental, special, or consequential damages arising out of or in
              connection with your use of our services.
            </p>
          </section>

          <section>
            <h3>10. Changes to Terms</h3>
            <p>
              We may modify these terms at any time. Continued use of our
              services after changes constitutes acceptance of the modified
              terms.
            </p>
          </section>

          <section>
            <h3>11. Governing Law</h3>
            <p>
              These terms shall be governed by the laws of the jurisdiction in
              which Cymasphere operates, without regard to its conflict of law
              provisions.
            </p>
          </section>

          <section>
            <h3>12. Contact</h3>
            <p>
              For questions about these terms, please contact us at
              support@cymasphere.com.
            </p>
          </section>

          <p className="last-updated">Last Updated: March 1, 2023</p>
        </LegalContent>
      );
    } else {
      return (
        <LegalContent>
          <h2>Privacy Policy</h2>

          <section>
            <h3>1. Introduction</h3>
            <p>
              This Privacy Policy explains how Cymasphere collects, uses, and
              protects your personal information when you use our services. We
              respect your privacy and are committed to protecting your personal
              data.
            </p>
          </section>

          <section>
            <h3>2. Information We Collect</h3>
            <p>
              We collect information you provide directly to us, such as your
              name, email address, and payment information when you register for
              an account. We also collect usage data and technical information
              about your device and how you interact with our services.
            </p>
          </section>

          <section>
            <h3>3. How We Use Your Information</h3>
            <p>
              We use your information to provide and improve our services,
              process transactions, communicate with you, and ensure security.
              We may also use your information for research and analytics to
              better understand how users interact with our services.
            </p>
          </section>

          <section>
            <h3>4. Data Sharing and Disclosure</h3>
            <p>
              We do not sell your personal information. We may share your
              information with third-party service providers who help us operate
              our services, process payments, or analyze data. We may also
              disclose your information if required by law.
            </p>
          </section>

          <section>
            <h3>5. Data Security</h3>
            <p>
              We implement appropriate security measures to protect your
              personal information. However, no method of transmission over the
              Internet or electronic storage is 100% secure.
            </p>
          </section>

          <section>
            <h3>6. Your Rights</h3>
            <p>
              Depending on your location, you may have certain rights regarding
              your personal data, including the right to access, correct,
              delete, or restrict processing of your data. Please contact us to
              exercise these rights.
            </p>
          </section>

          <section>
            <h3>7. Cookies and Tracking Technologies</h3>
            <p>
              We use cookies and similar tracking technologies to enhance your
              experience, analyze usage, and collect information about how you
              interact with our services. You can control cookies through your
              browser settings.
            </p>
          </section>

          <section>
            <h3>8. Children's Privacy</h3>
            <p>
              Our services are not intended for children under 13. We do not
              knowingly collect information from children under 13. If we learn
              that we have collected information from a child under 13, we will
              take steps to delete it.
            </p>
          </section>

          <section>
            <h3>9. Changes to This Privacy Policy</h3>
            <p>
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page
              and updating the "Last Updated" date.
            </p>
          </section>

          <section>
            <h3>10. Contact Us</h3>
            <p>
              If you have questions about this Privacy Policy, please contact us
              at support@cymasphere.com.
            </p>
          </section>

          <p className="last-updated">Last Updated: March 1, 2023</p>
        </LegalContent>
      );
    }
  }, [modalType]);

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
            initial={{
              scale: 0.9,
              opacity: 0,
              willChange: "transform, opacity",
            }}
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

            <ContentContainer>{getContent()}</ContentContainer>
          </ModalContainer>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default LegalModal;
