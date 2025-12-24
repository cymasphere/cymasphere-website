/**
 * @fileoverview EmailCollectionModal Component
 * @module components/modals/EmailCollectionModal
 * 
 * Modal component for collecting user email addresses during checkout flow.
 * Used for guest checkout when users are not logged in. Supports both trial
 * signups and lifetime purchases. Includes email validation and error handling.
 * 
 * @example
 * // For trial signup
 * <EmailCollectionModal 
 *   isOpen={showModal} 
 *   onClose={() => setShowModal(false)} 
 *   onSubmit={handleEmailSubmit} 
 *   collectPaymentMethod={true} 
 *   trialDays={14} 
 * />
 * 
 * @example
 * // For lifetime purchase
 * <EmailCollectionModal 
 *   isOpen={showModal} 
 *   onClose={() => setShowModal(false)} 
 *   onSubmit={handleEmailSubmit} 
 *   collectPaymentMethod={true} 
 *   trialDays={0} 
 * />
 */

"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import styled from "styled-components";
import { FaTimes, FaEnvelope, FaArrowRight, FaSignInAlt } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";

// Styled components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: linear-gradient(135deg, #1e1e1e, #292929);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ModalTitle = styled.h2`
  margin: 0;
  color: #fff;
  font-size: 1.5rem;
  font-weight: 600;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.6);
  font-size: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 5px;
  transition: color 0.2s;

  &:hover {
    color: white;
  }
`;

const ModalBody = styled.div`
  padding: 30px;
`;

const ModalFooter = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
`;

const IconContainer = styled.div`
  font-size: 4rem;
  color: var(--primary);
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
`;

const Message = styled.p`
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  line-height: 1.6;
  margin-bottom: 20px;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.95rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 1rem;
  transition: all 0.2s ease;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.4);
  }
`;

const ErrorMessage = styled.p`
  color: var(--error);
  font-size: 0.85rem;
  margin-top: 5px;
  margin-bottom: 0;
`;

const Button = styled.button<{ $primary?: boolean }>`
  padding: 10px 20px;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  ${(props) =>
    props.$primary
      ? `
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white;
    border: none;
    box-shadow: 0 4px 10px rgba(108, 99, 255, 0.3);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 15px rgba(108, 99, 255, 0.4);
    }
  `
      : `
    background: rgba(255, 255, 255, 0.05);
    color: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.1);
    
    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: translateY(-2px);
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
    box-shadow: none !important;
  }
`;

const LoginButton = styled(Button)`
  margin-top: 15px;
  width: 100%;
  background: rgba(108, 99, 255, 0.15);
  border: 1px solid rgba(108, 99, 255, 0.3);

  &:hover {
    background: rgba(108, 99, 255, 0.25);
  }
`;

/**
 * @brief Props for EmailCollectionModal component
 */
interface EmailCollectionModalProps {
  /** @param {boolean} isOpen - Whether the modal is visible */
  isOpen: boolean;
  /** @param {() => void} onClose - Callback to close the modal */
  onClose: () => void;
  /** @param {(email: string) => Promise<{success: boolean, error?: string}>} onSubmit - Async callback to submit email */
  onSubmit: (email: string) => Promise<{ success: boolean; error?: string }>;
  /** @param {boolean} collectPaymentMethod - Whether payment method collection is required */
  collectPaymentMethod: boolean;
  /** @param {number} trialDays - Number of trial days (0 for lifetime purchase) */
  trialDays: number;
}

/**
 * @brief EmailCollectionModal component
 * 
 * Modal for collecting email addresses from guest users during checkout.
 * Validates email format, handles submission errors, and provides login
 * redirect option if email is already associated with an account.
 * 
 * @param {EmailCollectionModalProps} props - Component props
 * @returns {JSX.Element} The rendered email collection modal
 * 
 * @note Uses React Portal to render outside component tree
 * @note Only renders on client side (checks for document)
 * @note Validates email format before submission
 * @note Shows login button if email is already associated with account
 * @note Supports Enter key to submit form
 * @note Modal title and message adapt based on trialDays (0 = lifetime purchase)
 */
export default function EmailCollectionModal({
  isOpen,
  onClose,
  onSubmit,
  collectPaymentMethod,
  trialDays,
}: EmailCollectionModalProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { t } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = async () => {
    // Reset error
    setError("");

    // Validate email
    if (!email.trim()) {
      setError(
        t("common.errors.emailRequired", "Please enter your email address")
      );
      return;
    }

    if (!validateEmail(email)) {
      setError(
        t("common.errors.invalidEmail", "Please enter a valid email address")
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit email and get response
      const result = await onSubmit(email);

      // If there's an error, display it
      if (!result.success && result.error) {
        setError(result.error);
        setIsSubmitting(false);
      }
      // Otherwise the modal will be closed by the parent component
    } catch (err) {
      setError(
        t(
          "common.errors.unexpectedError",
          "An unexpected error occurred. Please try again."
        )
      );
      setIsSubmitting(false);
    }
  };

  // Redirect to login page with the email pre-filled
  const handleGoToLogin = () => {
    window.location.href = `/login?email=${encodeURIComponent(email)}`;
  };

  // Check if the error is about an existing account
  const isExistingAccountError =
    error && error.includes("already associated with an account");

  const handleModalClose = () => {
    setEmail("");
    setError("");
    onClose();
  };

  // Ensure we only render on the client and after mount so portals work correctly
  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleModalClose}
        >
          <ModalContent
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {trialDays === 0
                  ? t("lifetimePurchase.title", "Complete Your Purchase")
                  : t("freeTrial.startTrial", "Start Your Free Trial")}
              </ModalTitle>
              <CloseButton onClick={handleModalClose}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <IconContainer>
                <FaEnvelope />
              </IconContainer>
              <Message>
                {trialDays === 0
                  ? t(
                      "lifetimePurchase.enterEmail",
                      "Enter your email address to complete your lifetime purchase."
                    )
                  : t(
                      "freeTrial.enterEmail",
                      "Enter your email address to start your {{days}}-day free trial {{requirement}}.",
                      {
                        days: trialDays,
                        requirement: collectPaymentMethod
                          ? t(
                              "freeTrial.cardRequired",
                              "(credit card required)"
                            )
                          : t(
                              "freeTrial.noCardRequired",
                              "(no credit card required)"
                            ),
                      }
                    )}
              </Message>
              <FormGroup>
                <FormLabel htmlFor="email">
                  {t("common.emailAddress", "Email Address")}
                </FormLabel>
                <FormInput
                  type="email"
                  id="email"
                  name="email"
                  placeholder={t("common.emailPlaceholder", "your@email.com")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                />
                {error && <ErrorMessage>{error}</ErrorMessage>}

                {/* Add login button when we detect an existing account */}
                {isExistingAccountError && (
                  <LoginButton onClick={handleGoToLogin}>
                    <FaSignInAlt style={{ marginRight: "8px" }} />{" "}
                    {t("common.goToLogin", "Go to Login")}
                  </LoginButton>
                )}
              </FormGroup>
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleModalClose}>
                {t("common.cancel", "Cancel")}
              </Button>
              <Button $primary onClick={handleSubmit} disabled={isSubmitting}>
                {isSubmitting
                  ? t("common.processing", "Processing...")
                  : trialDays === 0
                  ? t("lifetimePurchase.continue", "Complete Purchase")
                  : t("common.continue", "Continue")}{" "}
                {!isSubmitting && <FaArrowRight />}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>,
    document.body
  );
}
