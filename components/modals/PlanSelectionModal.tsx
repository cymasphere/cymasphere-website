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
} from "react-icons/fa";
import CymasphereLogo from "@/components/common/CymasphereLogo";
import { Profile, SubscriptionType } from "@/utils/supabase/types";

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

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
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

const PlanFeatures = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  margin: 1.5rem 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PlanFeature = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
  color: var(--text);
  font-size: 0.9rem;

  svg {
    color: var(--primary);
    margin-right: 0.5rem;
    flex-shrink: 0;
  }
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
  margin-bottom: 2rem;
  gap: 0.5rem;
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

const OriginalPrice = styled.span`
  text-decoration: line-through;
  font-size: 1.3rem;
  color: var(--text-secondary);
  opacity: 0.7;
  margin-right: 8px;
`;

// Add a styled component for the toggle control
const CardInfoToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 1rem 0;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  font-size: 0.9rem;
  color: var(--text);
`;

const ToggleSwitch = styled.div<{ $checked: boolean }>`
  position: relative;
  width: 42px;
  height: 22px;
  background: ${(props) =>
    props.$checked
      ? "linear-gradient(90deg, var(--primary), var(--accent))"
      : "rgba(255, 255, 255, 0.2)"};
  border-radius: 34px;
  transition: 0.3s;
  display: flex;
  align-items: center;
  padding: 0 2px;

  &::after {
    content: "";
    position: absolute;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: white;
    transition: 0.3s;
    transform: translateX(${(props) => (props.$checked ? "20px" : "0")});
  }
`;

const TrialInfoText = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-left: 5px;
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
  trialDays: number;
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
}

const PlanSelectionModal = ({
  isOpen,
  onClose,
  profile,
  onIntervalChange,
  onConfirm,
  formatDate,
  planName = "Cymasphere Pro",
  monthlyPrice = 8,
  yearlyPrice = 69,
  lifetimePrice = 199,
  planDescription = "Complete solution for music producers",
  trialDays = 14,
  planFeatures = [
    "Interactive Harmony Palette",
    "Advanced Voice Leading Control",
    "Unlimited Saved Progressions",
    "Premium Sound Libraries",
    "MIDI Export & Import",
    "Dynamic Pattern Editor",
    "Song Builder Tool",
    "Cloud Storage & Backup",
    "Priority Email Support",
    "Free Updates",
  ],
  monthlyDiscount,
  yearlyDiscount,
  lifetimeDiscount,
  onCardToggleChange,
}: PlanSelectionModalProps) => {
  // State for client-side rendering
  const [isMounted, setIsMounted] = useState(false);

  // Add local state to track the selected interval within the modal
  const [selectedSubscription, setSelectedSubscription] = useState(
    profile.subscription
  );

  // Default to willProvideCard true, but allow the toggle only for new users
  const [willProvideCard, setWillProvideCard] = useState(true);

  // Check if user has no active subscription
  const isNewUser = profile.subscription === "none";

  // Actual trial days based on toggle state
  const effectiveTrialDays = willProvideCard ? trialDays : 7;

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
    // Don't allow selecting the current plan if they already have one
    if (
      profile.subscription !== "none" &&
      subscription === profile.subscription
    ) {
      return;
    }

    console.log(`Setting subscription to: ${subscription} (local modal state)`);
    setSelectedSubscription(subscription);
    onIntervalChange(subscription);
  };

  // Handle toggle change
  const handleCardToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.checked;
    setWillProvideCard(newValue);
    if (onCardToggleChange) {
      onCardToggleChange(newValue);
    }
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
        : new Date(date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          });
    },
    [formatDate]
  );

  // Don't render anything on the server
  if (!isMounted) return null;

  // Don't render if modal is closed
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
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
              <ModalTitle>Choose Your Plan</ModalTitle>
              <CloseButton onClick={onClose}>
                <FaTimes />
              </CloseButton>
            </ModalHeader>
            <ModalBody>
              {/* Only show trial promotion banner for new users */}
              {isNewUser && (
                <PromotionBanner>
                  <TrialBadge>
                    <FaGift /> Limited Time Offer
                  </TrialBadge>
                  <PromotionText>
                    Start with a{" "}
                    <span>{effectiveTrialDays}-day FREE trial</span> on any
                    plan!
                  </PromotionText>
                  <PromotionSubtext>
                    Experience all premium features without commitment. No
                    credit card required to start.
                  </PromotionSubtext>
                </PromotionBanner>
              )}

              {profile.subscription === "annual" && (
                <PlanChangeInfo>
                  <FaInfoCircle />
                  <p>
                    Your subscription is currently billed yearly. If you switch
                    to a monthly plan, the change will take effect after your
                    current billing period ends on{" "}
                    {formatDateHelper(profile.subscription_expiration)}.
                  </p>
                </PlanChangeInfo>
              )}

              <BillingToggleContainer>
                <BillingToggleButton
                  $active={selectedSubscription === "monthly"}
                  onClick={() => {
                    console.log("Monthly plan selected");
                    handleSubscriptionChange("monthly");
                  }}
                  disabled={profile.subscription === "monthly"}
                >
                  Monthly
                </BillingToggleButton>

                <BillingToggleButton
                  $active={selectedSubscription === "annual"}
                  onClick={() => {
                    console.log("Yearly plan selected");
                    handleSubscriptionChange("annual");
                  }}
                  disabled={profile.subscription === "annual"}
                >
                  Yearly
                  <SaveLabel>Save 25%</SaveLabel>
                </BillingToggleButton>

                <BillingToggleButton
                  $active={selectedSubscription === "lifetime"}
                  onClick={() => {
                    console.log("Lifetime plan selected");
                    handleSubscriptionChange("lifetime");
                  }}
                  disabled={profile.subscription === "lifetime"}
                >
                  Lifetime
                  <SaveLabel>Best Value</SaveLabel>
                </BillingToggleButton>
              </BillingToggleContainer>

              {/* Add card toggle control only for new users and if not lifetime plan */}
              {isNewUser && selectedSubscription !== "lifetime" && (
                <CardInfoToggleContainer>
                  <ToggleLabel>
                    <span>Enter card info now:</span>
                    <ToggleSwitch $checked={willProvideCard}>
                      <input
                        type="checkbox"
                        checked={willProvideCard}
                        onChange={handleCardToggleChange}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                    </ToggleSwitch>
                    <TrialInfoText>
                      {willProvideCard
                        ? `Get ${effectiveTrialDays}-day trial (card required)`
                        : `Get ${effectiveTrialDays}-day trial (no card required)`}
                    </TrialInfoText>
                  </ToggleLabel>
                </CardInfoToggleContainer>
              )}

              <PlanGrid>
                <PlanCard style={{ position: "relative" }}>
                  {selectedSubscription === profile.subscription && (
                    <CurrentPlanIndicator>
                      <FaCrown /> Current Plan
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
                          <span className="pro-label">PRO</span>
                        </div>
                      </PlanNameContainer>
                    ) : (
                      <PlanNameStyled>{planName}</PlanNameStyled>
                    )}
                    {selectedSubscription === "monthly" && (
                      <PlanPriceStyled>
                        {monthlyDiscount &&
                        (monthlyDiscount.percent_off ||
                          monthlyDiscount.amount_off) ? (
                          <>
                            <OriginalPrice>${monthlyPrice}</OriginalPrice>$
                            {monthlyDiscount.percent_off
                              ? Math.round(
                                  monthlyPrice *
                                    (1 - monthlyDiscount.percent_off / 100)
                                )
                              : monthlyDiscount.amount_off
                              ? Math.max(
                                  0,
                                  monthlyPrice -
                                    Math.round(monthlyDiscount.amount_off / 100)
                                )
                              : monthlyPrice}
                          </>
                        ) : (
                          `$${monthlyPrice}`
                        )}{" "}
                        <span>/month</span>
                        {/* Only show trial info for new users */}
                        {isNewUser && (
                          <div
                            style={{
                              fontSize: "0.9rem",
                              marginTop: "5px",
                              color: "var(--primary)",
                              fontWeight: "bold",
                            }}
                          >
                            After your {effectiveTrialDays}-day free trial
                          </div>
                        )}
                        {monthlyDiscount &&
                          (monthlyDiscount.percent_off ||
                            monthlyDiscount.amount_off) && (
                            <div
                              style={{
                                fontSize: "0.9rem",
                                marginTop: "5px",
                                color: "#f96e46",
                                fontWeight: "bold",
                              }}
                            >
                              {monthlyDiscount.percent_off
                                ? `${monthlyDiscount.percent_off}% discount applied!`
                                : `$${Math.round(
                                    monthlyDiscount.amount_off! / 100
                                  )} off!`}
                            </div>
                          )}
                        <div
                          style={{
                            fontSize: "0.9rem",
                            marginTop: "5px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {profile.trial_expiration
                            ? `First payment: ${formatDateHelper(
                                profile.trial_expiration
                              )}`
                            : `Next billing: ${formatDateHelper(
                                profile.subscription_expiration ||
                                  new Date(
                                    Date.now() +
                                      1000 * 60 * 60 * 24 * effectiveTrialDays
                                  ).toISOString()
                              )}`}
                        </div>
                      </PlanPriceStyled>
                    )}
                    {selectedSubscription === "annual" && (
                      <PlanPriceStyled>
                        {yearlyDiscount &&
                        (yearlyDiscount.percent_off ||
                          yearlyDiscount.amount_off) ? (
                          <>
                            <OriginalPrice>${yearlyPrice}</OriginalPrice>$
                            {yearlyDiscount.percent_off
                              ? Math.round(
                                  yearlyPrice *
                                    (1 - yearlyDiscount.percent_off / 100)
                                )
                              : yearlyDiscount.amount_off
                              ? Math.max(
                                  0,
                                  yearlyPrice -
                                    Math.round(yearlyDiscount.amount_off / 100)
                                )
                              : yearlyPrice}
                          </>
                        ) : (
                          `$${yearlyPrice}`
                        )}{" "}
                        <span>/year</span>
                        <div style={{ fontSize: "1rem", marginTop: "5px" }}>
                          $
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
                          /month billed annually
                        </div>
                        {/* Only show trial info for new users */}
                        {isNewUser && (
                          <div
                            style={{
                              fontSize: "0.9rem",
                              marginTop: "5px",
                              color: "var(--primary)",
                              fontWeight: "bold",
                            }}
                          >
                            After your {effectiveTrialDays}-day free trial
                          </div>
                        )}
                        {yearlyDiscount &&
                          (yearlyDiscount.percent_off ||
                            yearlyDiscount.amount_off) && (
                            <div
                              style={{
                                fontSize: "0.9rem",
                                marginTop: "5px",
                                color: "#f96e46",
                                fontWeight: "bold",
                              }}
                            >
                              {yearlyDiscount.percent_off
                                ? `${yearlyDiscount.percent_off}% discount applied!`
                                : `$${Math.round(
                                    yearlyDiscount.amount_off! / 100
                                  )} off!`}
                            </div>
                          )}
                        <div
                          style={{
                            fontSize: "0.9rem",
                            marginTop: "5px",
                            color: "var(--text-secondary)",
                          }}
                        >
                          {profile.trial_expiration
                            ? `First payment: ${formatDateHelper(
                                profile.trial_expiration
                              )}`
                            : `Next billing: ${formatDateHelper(
                                profile.subscription_expiration ||
                                  new Date(
                                    Date.now() +
                                      1000 * 60 * 60 * 24 * effectiveTrialDays
                                  ).toISOString()
                              )}`}
                        </div>
                      </PlanPriceStyled>
                    )}
                    {selectedSubscription === "lifetime" && (
                      <PlanPriceStyled>
                        {lifetimeDiscount &&
                        (lifetimeDiscount.percent_off ||
                          lifetimeDiscount.amount_off) ? (
                          <>
                            <OriginalPrice>${lifetimePrice}</OriginalPrice>$
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
                          </>
                        ) : (
                          `$${lifetimePrice}`
                        )}
                        <div style={{ fontSize: "1rem", marginTop: "5px" }}>
                          one-time purchase
                        </div>
                        {lifetimeDiscount &&
                          (lifetimeDiscount.percent_off ||
                            lifetimeDiscount.amount_off) && (
                            <div
                              style={{
                                fontSize: "0.9rem",
                                marginTop: "5px",
                                color: "#f96e46",
                                fontWeight: "bold",
                              }}
                            >
                              {lifetimeDiscount.percent_off
                                ? `${lifetimeDiscount.percent_off}% discount applied!`
                                : `$${Math.round(
                                    lifetimeDiscount.amount_off! / 100
                                  )} off!`}
                            </div>
                          )}
                        {profile.subscription === "lifetime" && (
                          <div
                            style={{
                              fontSize: "0.9rem",
                              marginTop: "5px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            Purchased:{" "}
                            {formatDateHelper(profile.subscription_expiration)}
                          </div>
                        )}
                      </PlanPriceStyled>
                    )}
                    <PlanDescription>{planDescription}</PlanDescription>
                  </PlanHeader>

                  <h4 style={{ marginBottom: "0.5rem", color: "var(--text)" }}>
                    All Plans Include:
                  </h4>
                  <PlanFeatures>
                    {planFeatures.map((feature, index) => (
                      <PlanFeature key={index}>
                        <FaCheck /> {feature}
                      </PlanFeature>
                    ))}
                  </PlanFeatures>
                </PlanCard>
              </PlanGrid>
            </ModalBody>
            <ModalFooter>
              <Button
                onClick={onClose}
                style={{
                  marginRight: "0.5rem",
                  background: "rgba(255, 255, 255, 0.1)",
                }}
              >
                Cancel
              </Button>
              <Button
                disabled={profile.subscription === selectedSubscription}
                onClick={() => {
                  console.log("Confirming plan: pro");
                  onConfirm("pro");
                }}
                style={{
                  position: "relative",
                  overflow: "hidden",
                  opacity:
                    profile.subscription === selectedSubscription ? 0.5 : 1,
                  cursor:
                    profile.subscription === selectedSubscription
                      ? "not-allowed"
                      : "pointer",
                }}
                onMouseDown={(e) => {
                  const btn = e.currentTarget;
                  const circle = document.createElement("span");
                  const diameter = Math.max(btn.clientWidth, btn.clientHeight);

                  circle.style.width = circle.style.height = `${diameter}px`;
                  circle.style.position = "absolute";
                  circle.style.top = `${
                    e.clientY - btn.offsetTop - diameter / 2
                  }px`;
                  circle.style.left = `${
                    e.clientX - btn.offsetLeft - diameter / 2
                  }px`;
                  circle.style.background = "rgba(255, 255, 255, 0.3)";
                  circle.style.borderRadius = "50%";
                  circle.style.transform = "scale(0)";
                  circle.style.animation = "ripple 0.6s linear";

                  btn.appendChild(circle);

                  setTimeout(() => {
                    circle.remove();
                  }, 600);
                }}
              >
                {profile.subscription === "none"
                  ? "Start Free Trial"
                  : selectedSubscription === "lifetime"
                  ? "Upgrade to Lifetime"
                  : "Change Plan"}
              </Button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

export default PlanSelectionModal;
