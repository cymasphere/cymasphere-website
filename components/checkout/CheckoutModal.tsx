/**
 * @fileoverview Inline checkout modal used on pricing and billing pages.
 * @module components/checkout/CheckoutModal
 *
 * Renders a full-screen overlay with EmbeddedCheckout in a centered container.
 * Used by PricingSection and BillingPage so checkout opens in a modal instead of
 * navigating to /checkout.
 *
 * @example
 * const [params, setParams] = useState<InlineCheckoutParams | null>(null);
 * const { initiateCheckout } = useCheckout({ onInlineCheckout: setParams });
 * return <CheckoutModal params={params} onClose={() => setParams(null)} />;
 */

"use client";

import React from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import { FaTimes } from "react-icons/fa";
import type { InlineCheckoutParams } from "@/hooks/useCheckout";
import { EmbeddedCheckout } from "./EmbeddedCheckout";

/** Overlay and container for inline checkout modal. */
const CheckoutModalOverlay = styled(motion.div)`
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

const CheckoutModalContainer = styled(motion.div)`
  position: relative;
  width: 95%;
  max-width: 460px;
  max-height: 95vh;
  overflow-y: auto;
  background: var(--background);
  border-radius: 16px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 1.5rem;
`;

const CheckoutModalCloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-secondary);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: var(--text);
  }
`;

export interface CheckoutModalProps {
  /** When set, the modal is shown with EmbeddedCheckout for these params. */
  params: InlineCheckoutParams | null;
  /** Called when the user closes the modal (button or overlay click). */
  onClose: () => void;
}

/**
 * @brief Renders the inline checkout modal when params is non-null.
 * @param {CheckoutModalProps} props - params and onClose
 * @returns {JSX.Element} Nothing when params is null; otherwise overlay + EmbeddedCheckout
 */
export function CheckoutModal({ params, onClose }: CheckoutModalProps) {
  return (
    <AnimatePresence>
      {params && (
        <CheckoutModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <CheckoutModalContainer
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
          >
            <CheckoutModalCloseButton
              type="button"
              onClick={onClose}
              aria-label="Close"
            >
              <FaTimes size={18} />
            </CheckoutModalCloseButton>
            <EmbeddedCheckout
              planType={params.planType}
              collectPaymentMethod={params.collectPaymentMethod}
              isPlanChange={params.isPlanChange}
              trialOption={params.trialOption}
              onClose={onClose}
            />
          </CheckoutModalContainer>
        </CheckoutModalOverlay>
      )}
    </AnimatePresence>
  );
}
