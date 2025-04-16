"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { FaTimes, FaExclamationCircle, FaUnlock } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

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
  color: var(--error);
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
`;

interface SubscriptionExpiredModalProps {
  onSelectPlan: () => void;
  onClose: () => void;
}

export default function SubscriptionExpiredModal({
  onSelectPlan,
  onClose,
}: SubscriptionExpiredModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Control body scroll
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    // Check if user exists and has an expired subscription
    if (user?.profile) {
      const hasExpired =
        user.profile.subscription !== "none" &&
        user.profile.subscription_expiration &&
        new Date(user.profile.subscription_expiration) < new Date();
      
      setIsOpen(hasExpired === true);
    }
  }, [user]);

  const handleSelectPlan = () => {
    onSelectPlan();
    setIsOpen(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
        >
          <ModalContent
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>Subscription Expired</ModalTitle>
              <CloseButton onClick={handleClose}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              <IconContainer>
                <FaExclamationCircle />
              </IconContainer>
              <Message>
                Your subscription has expired. To continue enjoying all the premium features, 
                please renew your subscription or select a new plan.
              </Message>
            </ModalBody>
            <ModalFooter>
              <Button onClick={handleClose}>Remind Me Later</Button>
              <Button $primary onClick={handleSelectPlan}>
                <FaUnlock /> Select a Plan
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
} 