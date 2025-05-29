"use client";

import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaCrown,
  FaGift,
  FaUnlock,
} from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";
import { Profile, SubscriptionType } from "@/utils/supabase/types";
import { useTranslation } from "react-i18next";

// Modal components
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
  padding: 20px;
  will-change: opacity;
`;

const ModalContent = styled(motion.div)`
  background: rgba(25, 23, 36, 0.95);
  border-radius: 16px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 5px 30px rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(108, 99, 255, 0.2);
  will-change: transform, opacity;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.5rem;
  color: var(--text);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: var(--text);
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
`;

const PlanGrid = styled.div`
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

const PlanCard = styled.div`
  background-color: rgba(30, 30, 46, 0.5);
  border: 2px solid var(--primary);
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.2s ease;

  &:hover {
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  }
`;

const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const PlanNameStyled = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
`;

const PlanPriceStyled = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.25rem;

  span {
    font-size: 1rem;
    font-weight: 400;
    color: var(--text-secondary);
  }
`;

const PlanDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0.5rem 0;
`;

const PlanFeatures = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PlanFeature = styled.li`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
`;

const FeatureIcon = styled.span`
  margin-right: 10px;
  color: var(--success);
  font-size: 1rem;
`;

const CurrentPlanIndicator = styled.div`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  position: absolute;
  top: -12px;
  right: 20px;
  box-shadow: 0 2px 10px rgba(108, 99, 255, 0.3);
`;

const Button = styled.button`
  padding: 0.75rem 1rem;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
    transform: translateY(-2px);
  }
`;

const BillingToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  gap: 0.5rem;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;

  ${BillingToggleContainer} {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
  }

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;

    ${BillingToggleContainer} {
      position: static;
      transform: none;
      order: 2;
      align-self: stretch;
      justify-content: center;
    }

    ${CloseButton} {
      position: absolute;
      top: 1rem;
      right: 1rem;
      order: 3;
    }
  }
`;

interface BillingToggleButtonProps {
  $active: boolean;
}

const BillingToggleButton = styled.button<BillingToggleButtonProps>`
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "rgba(30, 30, 46, 0.5)"};
  color: ${(props) => (props.$active ? "white" : "var(--text)")};
  border: 1px solid
    ${(props) => (props.$active ? "transparent" : "rgba(255, 255, 255, 0.1)")};
  border-radius: 6px;
  padding: 0.75rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  min-width: 100px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
  }
`;

const SaveLabel = styled.span`
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: var(--accent);
  color: white;
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: 700;
`;

const PlanChangeInfo = styled.div`
  display: flex;
  background-color: rgba(108, 99, 255, 0.1);
  border-radius: 6px;
  padding: 1rem;
  margin-bottom: 1.5rem;

  svg {
    color: var(--primary);
    margin-right: 0.75rem;
    font-size: 1.2rem;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
`;

const TrialBadge = styled.div`
  background: linear-gradient(90deg, #f9c846, #f96e46);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(249, 110, 70, 0.3);
  display: inline-flex;
  align-items: center;
  margin-bottom: 1rem;

  svg {
    margin-right: 0.5rem;
  }
`;

const PromotionBanner = styled.div`
  background: linear-gradient(
    135deg,
    rgba(249, 200, 70, 0.1),
    rgba(249, 110, 70, 0.1)
  );
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  text-align: center;
  border: 1px solid rgba(249, 200, 70, 0.3);
`;

const PromotionText = styled.p`
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;

  span {
    color: #f96e46;
  }
`;

const PromotionSubtext = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
`;

const PlanNameContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;

  .logo-container {
    display: flex;
    align-items: center;
  }

  .pro-label {
    font-size: 1.2rem;
    font-weight: 600;
    color: var(--accent);
    margin-left: 8px;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(255, 255, 255, 0.1);
    transform: translateY(-8px);
  }
`;

// Add price display components matching the landing page
const PriceDisplay = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 10px 0;
  text-align: center;
`;

const OriginalPrice = styled.span`
  text-decoration: line-through;
  color: rgba(255, 255, 255, 0.6);
  font-size: 1.5rem;
  margin-bottom: 5px;
  text-align: center;
`;

const DiscountTag = styled.span`
  background: linear-gradient(135deg, #f9c846, #f96e46);
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  margin-left: 10px;
`;

// Add radio button styled components for trial options
const RadioButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 15px 0;
`;

const RadioOptionsContainer = styled.div`
  background: rgba(108, 99, 255, 0.05);
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 10px;
  padding: 16px;
  margin: 0 auto 20px;
  max-width: 80%;
  text-align: left;
`;

const RadioOptionTitle = styled.div`
  font-size: 0.9rem;
  font-weight: 600;
  margin-bottom: 12px;
  color: var(--text);
  display: flex;
  align-items: center;

  svg {
    margin-right: 6px;
    color: var(--primary);
  }
`;

const RadioOption = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text-secondary);
  padding: 10px;
  border-radius: 8px;
  transition: all 0.2s ease;
  margin-bottom: 5px;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:last-child {
    margin-bottom: 0;
  }
`;

const RadioInput = styled.input`
  position: relative;
  cursor: pointer;
  appearance: none;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(108, 99, 255, 0.4);
  border-radius: 50%;
  margin-right: 10px;
  outline: none;
  transition: all 0.2s ease;

  &:checked {
    border-color: var(--primary);
    background-color: transparent;

    &:after {
      content: "";
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent));
    }
  }

  &:hover {
    border-color: var(--primary);
  }
`;

const TrialIcon = styled.span`
  margin-right: 8px;
  font-size: 0.9rem;
`;

const TrialDescription = styled.span`
  margin-left: 8px;
  flex: 1;
`;

// Add back the missing styled components
const ConfirmationNote = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
  text-align: center;
`;

// Add loading spinner component
const LoadingSpinner = styled.div`
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

interface PlanSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: Profile;
  onIntervalChange: (interval: SubscriptionType) => void;
  onConfirm: (plan: string) => void;
  formatDate?: (date: string | number | null | undefined) => string;
  planName: string;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice: number;
  planDescription: string;
  planFeatures: string[];
  monthlyDiscount?: {
    percent_off?: number;
    amount_off?: number;
    promotion_code?: string;
  };
  yearlyDiscount?: {
    percent_off?: number;
    amount_off?: number;
    promotion_code?: string;
  };
  lifetimeDiscount?: {
    percent_off?: number;
    amount_off?: number;
    promotion_code?: string;
  };
  onCardToggleChange?: (willProvideCard: boolean) => void;
  isPlanChangeLoading?: boolean;
}

const PlanSelectionModal = ({
  isOpen,
  onClose,
  profile,
  onIntervalChange,
  onConfirm,
  formatDate,
  planName,
  monthlyPrice = 8,
  yearlyPrice = 69,
  lifetimePrice = 199,
  planDescription,
  planFeatures,
  monthlyDiscount,
  yearlyDiscount,
  lifetimeDiscount,
  isPlanChangeLoading = false,
}: PlanSelectionModalProps) => {
  // Initialize translation hook
  const { t } = useTranslation();

  // State for client-side rendering
  const [isMounted, setIsMounted] = useState(false);

  // Add local state to track the selected interval within the modal
  const [selectedSubscription, setSelectedSubscription] = useState(
    profile.subscription
  );

  // Default to willProvideCard true, but allow the toggle only for new users
  const [willProvideCard, setWillProvideCard] = useState(true);

  // Check if user has no active subscription
  const isNewUser = React.useMemo(() => {
    // A user is considered "new" if they have no subscription history at all
    return (
      profile.subscription === "none" &&
      !profile.subscription_expiration &&
      !profile.trial_expiration
    );
  }, [profile]);

  // Actual trial days based on toggle state
  const effectiveTrialDays = willProvideCard ? 14 : 7;

  // Update local state when the modal opens with the current subscription
  useEffect(() => {
    if (isOpen && profile?.subscription) {
      setSelectedSubscription(
        profile.subscription === "none" ? "monthly" : profile.subscription
      );
    }
  }, [isOpen, profile.subscription]);

  // Handle interval change locally and propagate to parent
  const handleSubscriptionChange = (subscription: SubscriptionType) => {
    // Allow selecting the current plan to view its details
    console.log(`Setting subscription to: ${subscription} (local modal state)`);
    setSelectedSubscription(subscription);
    onIntervalChange(subscription);
  };

  // Improved body overflow management to prevent memory leaks
  useEffect(() => {
    setIsMounted(true);

    const originalStyle = window.getComputedStyle(document.body).overflow;

    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = originalStyle;
    }

    return () => {
      document.body.style.overflow = originalStyle;
      setIsMounted(false);
    };
  }, [isOpen]);

  // Helper function to format date
  const formatDateHelper = useCallback(
    (date: string | number | null | undefined) => {
      if (!date) return "";
      return formatDate
        ? formatDate(date)
        : new Date(date).toLocaleDateString(t("common.locale", "en-US"), {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
    },
    [formatDate, t]
  );

  // Don't render anything on the server
  if (!isMounted) return null;

  // Don't render if modal is closed
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          key="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <ModalContent
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <ModalHeader>
              <ModalTitle>
                {t("billing.choosePlan", "Choose Your Plan")}
              </ModalTitle>
              <BillingToggleContainer style={{ margin: 0, gap: "0.5rem" }}>
                <BillingToggleButton
                  $active={selectedSubscription === "monthly"}
                  onClick={() => {
                    console.log("Monthly plan selected");
                    handleSubscriptionChange("monthly");
                  }}
                >
                  {t("billing.monthly", "Monthly")}
                </BillingToggleButton>

                <BillingToggleButton
                  $active={selectedSubscription === "annual"}
                  onClick={() => {
                    console.log("Yearly plan selected");
                    handleSubscriptionChange("annual");
                  }}
                >
                  {t("billing.yearly", "Yearly")}
                  <SaveLabel>{t("billing.save25", "Save 25%")}</SaveLabel>
                </BillingToggleButton>

                <BillingToggleButton
                  $active={selectedSubscription === "lifetime"}
                  onClick={() => {
                    console.log("Lifetime plan selected");
                    handleSubscriptionChange("lifetime");
                  }}
                >
                  {t("billing.lifetime", "Lifetime")}
                  <SaveLabel>{t("billing.bestValue", "Best Value")}</SaveLabel>
                </BillingToggleButton>
              </BillingToggleContainer>
              <CloseButton onClick={onClose}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {/* Only show trial promotion banner for truly new users */}
              {isNewUser && (
                <PromotionBanner>
                  <TrialBadge>
                    <FaGift /> {t("billing.limitedOffer", "Limited Time Offer")}
                  </TrialBadge>
                  <PromotionText>
                    {t(
                      "billing.startWithTrial",
                      "Start with a {{days}}-day FREE trial on any plan!",
                      { days: effectiveTrialDays }
                    )}
                  </PromotionText>
                  <PromotionSubtext>
                    {t(
                      "billing.trialExperience",
                      "Experience all premium features without commitment. No credit card required to start."
                    )}
                  </PromotionSubtext>
                </PromotionBanner>
              )}

              {profile.subscription === "annual" && (
                <PlanChangeInfo>
                  <FaInfoCircle />
                  <p>
                    {t(
                      "billing.yearlyToMonthly",
                      "Your subscription is currently billed yearly. If you switch to a monthly plan, the change will take effect after your current billing period ends on {{date}}.",
                      {
                        date: formatDateHelper(profile.subscription_expiration),
                      }
                    )}
                  </p>
                </PlanChangeInfo>
              )}

              <PlanGrid>
                <PlanCard style={{ position: "relative" }}>
                  {selectedSubscription === profile.subscription && (
                    <CurrentPlanIndicator>
                      <FaCrown /> {t("billing.currentPlan", "Current Plan")}
                    </CurrentPlanIndicator>
                  )}
                  <PlanHeader>
                    {planName === "Cymasphere Pro" ? (
                      <PlanNameContainer>
                        <div className="logo-container">
                          <CymasphereLogo
                            size="32px"
                            fontSize="1.4rem"
                            showText={true}
                            onClick={(e: React.MouseEvent) =>
                              e.preventDefault()
                            }
                            href="#"
                            className=""
                          />
                          <span className="pro-label">
                            {t("billing.proBadge", "PRO")}
                          </span>
                        </div>
                      </PlanNameContainer>
                    ) : (
                      <PlanNameStyled>{planName}</PlanNameStyled>
                    )}
                    {selectedSubscription === "monthly" && (
                      <PriceDisplay>
                        {monthlyDiscount &&
                        (monthlyDiscount.percent_off ||
                          monthlyDiscount.amount_off) ? (
                          <>
                            <OriginalPrice>
                              {t("pricing.currencySymbol", "$")}
                              {monthlyPrice}
                              {t("pricing.perMonth", "/month")}
                            </OriginalPrice>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <PlanPriceStyled>
                                {t("pricing.currencySymbol", "$")}
                                {monthlyDiscount.percent_off
                                  ? Math.round(
                                      monthlyPrice *
                                        (1 - monthlyDiscount.percent_off / 100)
                                    )
                                  : monthlyDiscount.amount_off
                                  ? Math.max(
                                      0,
                                      monthlyPrice -
                                        Math.round(
                                          monthlyDiscount.amount_off / 100
                                        )
                                    )
                                  : monthlyPrice}
                                <span>{t("pricing.perMonth", "/month")}</span>
                              </PlanPriceStyled>
                              <DiscountTag>
                                {monthlyDiscount.percent_off
                                  ? `${monthlyDiscount.percent_off}% OFF`
                                  : `$${Math.round(
                                      monthlyDiscount.amount_off! / 100
                                    )} OFF`}
                              </DiscountTag>
                            </div>
                          </>
                        ) : (
                          <PlanPriceStyled>
                            {t("pricing.currencySymbol", "$")}
                            {monthlyPrice}
                            <span>{t("pricing.perMonth", "/month")}</span>
                          </PlanPriceStyled>
                        )}

                        {/* Only show trial info for new users */}
                        {isNewUser && (
                          <div
                            style={{
                              fontSize: "0.9rem",
                              marginTop: "5px",
                              color: "var(--primary)",
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            {t(
                              "billing.afterTrial",
                              "After your {{days}}-day free trial",
                              { days: effectiveTrialDays }
                            )}
                          </div>
                        )}
                      </PriceDisplay>
                    )}
                    {selectedSubscription === "annual" && (
                      <PriceDisplay>
                        {yearlyDiscount &&
                        (yearlyDiscount.percent_off ||
                          yearlyDiscount.amount_off) ? (
                          <>
                            <OriginalPrice>
                              {t("pricing.currencySymbol", "$")}
                              {yearlyPrice}
                              {t("pricing.perYear", "/year")}
                            </OriginalPrice>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <PlanPriceStyled>
                                {t("pricing.currencySymbol", "$")}
                                {yearlyDiscount.percent_off
                                  ? Math.round(
                                      yearlyPrice *
                                        (1 - yearlyDiscount.percent_off / 100)
                                    )
                                  : yearlyDiscount.amount_off
                                  ? Math.max(
                                      0,
                                      yearlyPrice -
                                        Math.round(
                                          yearlyDiscount.amount_off / 100
                                        )
                                    )
                                  : yearlyPrice}
                                <span>{t("pricing.perYear", "/year")}</span>
                              </PlanPriceStyled>
                              <DiscountTag>
                                {yearlyDiscount.percent_off
                                  ? `${yearlyDiscount.percent_off}% OFF`
                                  : `$${Math.round(
                                      yearlyDiscount.amount_off! / 100
                                    )} OFF`}
                              </DiscountTag>
                            </div>
                          </>
                        ) : (
                          <PlanPriceStyled>
                            {t("pricing.currencySymbol", "$")}
                            {yearlyPrice}
                            <span>{t("pricing.perYear", "/year")}</span>
                          </PlanPriceStyled>
                        )}

                        <div style={{ fontSize: "1rem", marginTop: "5px" }}>
                          {t("pricing.currencySymbol", "$")}
                          {(() => {
                            // Calculate the actual monthly price based on annual price
                            let effectiveYearlyPrice = yearlyPrice;

                            // Apply discount if available
                            if (
                              yearlyDiscount &&
                              (yearlyDiscount.percent_off ||
                                yearlyDiscount.amount_off)
                            ) {
                              if (yearlyDiscount.percent_off) {
                                effectiveYearlyPrice =
                                  yearlyPrice *
                                  (1 - yearlyDiscount.percent_off / 100);
                              } else if (yearlyDiscount.amount_off) {
                                effectiveYearlyPrice = Math.max(
                                  0,
                                  yearlyPrice - yearlyDiscount.amount_off / 100
                                );
                              }
                            }

                            // Convert to monthly and format
                            return (effectiveYearlyPrice / 12).toFixed(2);
                          })()}
                          {t("pricing.perMonth", "/month")}{" "}
                          {t("pricing.billed", "billed annually")}
                        </div>

                        {/* Only show trial info for new users */}
                        {isNewUser && (
                          <div
                            style={{
                              fontSize: "0.9rem",
                              marginTop: "5px",
                              color: "var(--primary)",
                              fontWeight: "bold",
                              textAlign: "center",
                            }}
                          >
                            {t(
                              "billing.afterTrial",
                              "After your {{days}}-day free trial",
                              { days: effectiveTrialDays }
                            )}
                          </div>
                        )}
                      </PriceDisplay>
                    )}
                    {selectedSubscription === "lifetime" && (
                      <PriceDisplay>
                        {lifetimeDiscount &&
                        (lifetimeDiscount.percent_off ||
                          lifetimeDiscount.amount_off) ? (
                          <>
                            <OriginalPrice>
                              {t("pricing.currencySymbol", "$")}
                              {lifetimePrice}
                            </OriginalPrice>
                            <div
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <PlanPriceStyled>
                                {t("pricing.currencySymbol", "$")}
                                {lifetimeDiscount.percent_off
                                  ? Math.round(
                                      lifetimePrice *
                                        (1 - lifetimeDiscount.percent_off / 100)
                                    )
                                  : lifetimeDiscount.amount_off
                                  ? Math.max(
                                      0,
                                      lifetimePrice -
                                        Math.round(
                                          lifetimeDiscount.amount_off / 100
                                        )
                                    )
                                  : lifetimePrice}
                              </PlanPriceStyled>
                              <DiscountTag>
                                {lifetimeDiscount.percent_off
                                  ? `${lifetimeDiscount.percent_off}% OFF`
                                  : `$${Math.round(
                                      lifetimeDiscount.amount_off! / 100
                                    )} OFF`}
                              </DiscountTag>
                            </div>
                          </>
                        ) : (
                          <PlanPriceStyled>
                            {t("pricing.currencySymbol", "$")}
                            {lifetimePrice}
                          </PlanPriceStyled>
                        )}

                        <div
                          style={{
                            fontSize: "1rem",
                            marginTop: "5px",
                            opacity: 0.8,
                          }}
                        >
                          {t("pricing.oneTimePurchase", "one-time purchase")}
                        </div>

                        {profile.subscription === "lifetime" && (
                          <div
                            style={{
                              fontSize: "0.9rem",
                              marginTop: "5px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {t("billing.purchased", "Purchased")}:{" "}
                            {formatDateHelper(profile.subscription_expiration)}
                          </div>
                        )}
                      </PriceDisplay>
                    )}
                    <PlanDescription>{planDescription}</PlanDescription>
                  </PlanHeader>

                  <h4 style={{ marginBottom: "0.5rem", color: "var(--text)" }}>
                    {t("billing.allPlansInclude", "All Plans Include:")}
                  </h4>
                  <PlanFeatures>
                    {planFeatures.map((feature, index) => (
                      <PlanFeature key={index}>
                        <FeatureIcon>
                          <FaCheck />
                        </FeatureIcon>
                        {feature}
                      </PlanFeature>
                    ))}
                  </PlanFeatures>
                </PlanCard>
              </PlanGrid>

              {/* Add card toggle control only for new users and if not lifetime plan */}
              {isNewUser && selectedSubscription !== "lifetime" && (
                <RadioOptionsContainer>
                  <RadioOptionTitle>
                    <FaGift />{" "}
                    {t("billing.chooseTrial", "Choose your free trial option:")}
                  </RadioOptionTitle>
                  <RadioButtonGroup>
                    <RadioOption>
                      <RadioInput
                        type="radio"
                        name="trialOption"
                        value="14day"
                        checked={willProvideCard}
                        onChange={() => setWillProvideCard(true)}
                      />
                      <TrialIcon>
                        <FaUnlock />
                      </TrialIcon>
                      <TrialDescription>
                        {t(
                          "billing.trialWithCard",
                          "{{days}}-day trial - Add card on file",
                          { days: 14 }
                        )}
                        <br />
                        {t(
                          "billing.noCharge",
                          "(won't be charged until trial ends)"
                        )}
                      </TrialDescription>
                    </RadioOption>

                    <RadioOption>
                      <RadioInput
                        type="radio"
                        name="trialOption"
                        value="7day"
                        checked={!willProvideCard}
                        onChange={() => setWillProvideCard(false)}
                      />
                      <TrialIcon>
                        <FaUnlock />
                      </TrialIcon>
                      <TrialDescription>
                        {t(
                          "billing.trialWithoutCard",
                          "{{days}}-day trial - No credit card required",
                          { days: 7 }
                        )}
                      </TrialDescription>
                    </RadioOption>
                  </RadioButtonGroup>

                  {/* Billing date positioned at bottom right */}
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      textAlign: "right",
                      marginTop: "12px",
                      fontStyle: "italic",
                    }}
                  >
                    {profile.trial_expiration
                      ? t("billing.firstPayment", "First payment: {{date}}", {
                          date: formatDateHelper(profile.trial_expiration),
                        })
                      : t("billing.nextBilling", "Next billing: {{date}}", {
                          date: formatDateHelper(
                            profile.subscription_expiration ||
                              new Date(
                                Date.now() +
                                  1000 * 60 * 60 * 24 * effectiveTrialDays
                              ).toISOString()
                          ),
                        })}
                  </div>
                </RadioOptionsContainer>
              )}

              <ConfirmationNote>
                {t(
                  "billing.confirmationNote",
                  "By confirming, you agree to the terms and pricing displayed above."
                )}
              </ConfirmationNote>
            </ModalBody>

            <ModalFooter>
              <Button
                style={{
                  background: "rgba(255, 255, 255, 0.1)",
                  marginRight: "0.5rem",
                }}
                onClick={onClose}
              >
                {t("common.cancel", "Cancel")}
              </Button>
              <Button
                onClick={() => onConfirm(selectedSubscription)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                disabled={isPlanChangeLoading}
              >
                {isPlanChangeLoading ? (
                  <LoadingSpinner />
                ) : (
                  t("common.confirm", "Confirm")
                )}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
      <style jsx global>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </AnimatePresence>
  );
};

export default PlanSelectionModal;
