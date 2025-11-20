"use client";

import React from "react";
import styled from "styled-components";
import { PlanType } from "@/types/stripe";
import { useTranslation } from "react-i18next";

const BillingToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  position: relative;
  width: 100%;
  max-width: 400px;
  margin-left: auto;
  margin-right: auto;
  z-index: 5;
`;

type BillingToggleButtonProps = {
  $active: boolean;
  $disabled?: boolean;
};

const BillingToggleButton = styled.button<BillingToggleButtonProps>`
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "transparent"};
  color: ${(props) =>
    props.$disabled
      ? "rgba(255, 255, 255, 0.3)"
      : props.$active
      ? "white"
      : "var(--text-secondary)"};
  border: ${(props) =>
    props.$active ? "none" : "1px solid rgba(255, 255, 255, 0.2)"};
  border-radius: 30px;
  padding: 12px 10px;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  font-size: 1.05rem;
  cursor: ${(props) => (props.$disabled ? "not-allowed" : "pointer")};
  transition: all 0.3s ease;
  margin: 0 6px;
  position: relative;
  flex: 1;
  z-index: 5;
  opacity: ${(props) => (props.$disabled ? 0.5 : 1)};

  &:hover {
    background: ${(props) =>
      props.$disabled
        ? "transparent"
        : props.$active
        ? "linear-gradient(135deg, var(--primary), var(--accent))"
        : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) =>
      props.$disabled
        ? "rgba(255, 255, 255, 0.3)"
        : props.$active
        ? "white"
        : "var(--text)"};
  }
`;

const SavingsInfo = styled.p`
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-top: 5px;

  span {
    color: var(--accent);
    font-weight: 600;
  }
`;

interface BillingToggleProps {
  billingPeriod: PlanType;
  onBillingPeriodChange: (period: PlanType) => void;
  userSubscription?: string;
  showSavingsInfo?: boolean;
  variant?: "default" | "change_plan";
}

export default function BillingToggle({
  billingPeriod,
  onBillingPeriodChange,
  userSubscription,
  showSavingsInfo = true,
  variant = "default",
}: BillingToggleProps) {
  const { t } = useTranslation();

  const isDisabled = (period: PlanType) => {
    // In change_plan variant, allow selecting all plans including current
    if (variant === "change_plan") return false;
    // In default variant, disable if user has a subscription and it's not this period
    if (!userSubscription || userSubscription === "none") return false;
    return userSubscription !== period;
  };

  return (
    <>
      <BillingToggleContainer>
        <BillingToggleButton
          $active={billingPeriod === "monthly"}
          $disabled={isDisabled("monthly")}
          onClick={() => {
            if (!isDisabled("monthly")) {
              onBillingPeriodChange("monthly");
            }
          }}
        >
          {t("pricing.monthly", "Monthly")}
        </BillingToggleButton>

        <BillingToggleButton
          $active={billingPeriod === "annual"}
          $disabled={isDisabled("annual")}
          onClick={() => {
            if (!isDisabled("annual")) {
              onBillingPeriodChange("annual");
            }
          }}
        >
          {t("pricing.yearly", "Yearly")}
        </BillingToggleButton>

        <BillingToggleButton
          $active={billingPeriod === "lifetime"}
          $disabled={isDisabled("lifetime")}
          onClick={() => {
            if (!isDisabled("lifetime")) {
              onBillingPeriodChange("lifetime");
            }
          }}
        >
          {t("pricing.lifetime", "Lifetime")}
        </BillingToggleButton>
      </BillingToggleContainer>

      {showSavingsInfo && (
        <div style={{ textAlign: "center" }}>
          {billingPeriod === "monthly" && (
            <SavingsInfo>
              <span>{t("pricing.mostFlexible", "Most Flexible")}</span> -{" "}
              {t("pricing.payMonthly", "Pay month-to-month, cancel anytime")}
            </SavingsInfo>
          )}
          {billingPeriod === "annual" && (
            <SavingsInfo>
              {t("pricing.save", "Save")} <span>25%</span>{" "}
              {t("pricing.withYearlyBilling", "with yearly billing")}
            </SavingsInfo>
          )}
          {billingPeriod === "lifetime" && (
            <SavingsInfo>
              <span>{t("pricing.bestValue", "Best Value")}</span> -{" "}
              {t("pricing.oneTimePayment", "One-time payment, lifetime access")}
            </SavingsInfo>
          )}
        </div>
      )}
    </>
  );
}

