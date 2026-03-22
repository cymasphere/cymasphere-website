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
  /* Above NextHeader (3000–3500) and sticky PromotionBanner (3001). */
  z-index: 4000;
  backdrop-filter: blur(5px);
  /* When inner panel is max-height capped, allow overlay to scroll so short viewports can reach top/bottom. */
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: max(0.75rem, env(safe-area-inset-top)) max(0.75rem, env(safe-area-inset-right))
    max(0.75rem, env(safe-area-inset-bottom)) max(0.75rem, env(safe-area-inset-left));
`;

const CheckoutModalContainer = styled(motion.div)`
  position: relative;
  width: 95%;
  max-width: 460px;
  /* min-height: 0 lets this flex child shrink below content size so max-height + overflow-y can scroll (see CSS flex min-size). */
  min-height: 0;
  max-height: 95vh;
  max-height: min(95vh, 100dvh - 1.5rem);
  flex-shrink: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
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
  /**
   * Called after successful checkout once auth profile has been refreshed (e.g. billing page refetch).
   */
  onAfterPaymentSuccess?: () => void | Promise<void>;
}

/**
 * @brief Renders the inline checkout modal when params is non-null.
 * @param {CheckoutModalProps} props - params, onClose, optional onAfterPaymentSuccess
 * @returns {JSX.Element} Nothing when params is null; otherwise overlay + EmbeddedCheckout
 */
export function CheckoutModal({
  params,
  onClose,
  onAfterPaymentSuccess,
}: CheckoutModalProps) {
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
              onAfterCheckoutSuccess={onAfterPaymentSuccess}
            />
          </CheckoutModalContainer>
        </CheckoutModalOverlay>
      )}
    </AnimatePresence>
  );
}
