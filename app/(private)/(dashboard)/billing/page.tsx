"use client";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaHistory,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaCrown,
  FaGift,
  FaExternalLinkAlt,
  FaApple,
} from "react-icons/fa";
import PlanSelectionModal from "@/components/modals/PlanSelectionModal";
import { SubscriptionType } from "@/utils/supabase/types";
import {
  createCustomerPortalSession,
} from "@/utils/stripe/actions";
import { useCheckout } from "@/hooks/useCheckout";
import PricingCard from "@/components/pricing/PricingCard";
import BillingToggle from "@/components/pricing/BillingToggle";
import { PlanType } from "@/types/stripe";
import { useAuth } from "@/contexts/AuthContext";
import { useDashboard } from "@/contexts/DashboardContext";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useTranslation } from "react-i18next";
import dynamic from "next/dynamic";

// Type definitions for CymasphereLogo component
interface CymasphereLogoProps {
  size?: string;
  fontSize?: string;
  showText?: boolean;
  href?: string;
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
}

// Use dynamic import to handle JavaScript component in TypeScript
const CymasphereLogo = dynamic(
  () => import("@/components/common/CymasphereLogo"),
  {
    ssr: false,
  }
) as React.ComponentType<CymasphereLogoProps>;

// Extended profile interface with additional fields we need
interface ProfileWithSubscriptionDetails {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription: SubscriptionType;
  subscription_interval?: "month" | "year" | null;
  subscription_source?: "stripe" | "ios" | "nfr" | "none" | null;
  cancel_at_period_end?: boolean;
  trial_expiration: string | null;
  subscription_expiration: string | null;
  customer_id: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

// Helper functions for safely checking subscription status
const isSubscriptionNone = (subscription: SubscriptionType): boolean => {
  return subscription === "none";
};

const isSubscriptionLifetime = (subscription: SubscriptionType): boolean => {
  return subscription === "lifetime";
};

const BillingContainer = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.75rem;
  margin-bottom: 1.5rem;
  color: var(--text);
`;

const BillingCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
    color: var(--primary);
  }
`;

const CardContent = styled.div`
  color: var(--text-secondary);

  @media (max-width: 768px) {
    text-align: center;
  }
`;

const ButtonContainer = styled.div`
  display: grid !important;
  grid-template-columns: 1fr 1fr !important;
  gap: 1rem;
  width: 100%;
  margin-top: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr !important;
  }
`;

const PlanDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    align-items: center;
    text-align: center;
  }
`;

const PlanName = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  .logo-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .pro-label {
    font-size: 1.5rem;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    font-weight: 700;
  }

  .plan-type {
    font-size: 2.5rem;
    color: var(--text);
    font-weight: 700;
  }
`;

const PlanPrice = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.25rem;
  display: inline-block;
  margin-left: 1rem;

  span {
    font-size: 1rem;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const PlanDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const Button = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  min-width: 0;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.3);
  }
`;

const InvoicesList = styled.div`
  display: flex;
  flex-direction: column;
`;

const InvoiceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const InvoiceDate = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const InvoiceAmount = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
`;

interface InvoiceStatusProps {
  status: "paid" | "unpaid";
}

const InvoiceStatus = styled.div<InvoiceStatusProps>`
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  color: white;
  background-color: ${(props) =>
    props.status === "paid" ? "var(--success)" : "var(--warning)"};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.6), 0 2px 6px rgba(0, 0, 0, 0.4),
    0 8px 24px rgba(0, 0, 0, 0.3);
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
`;

const DownloadButton = styled.button`
  background: none;
  border: none;
  color: var(--primary);
  cursor: pointer;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    text-decoration: underline;
  }
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
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

const AlertBanner = styled.div`
  background-color: rgba(255, 72, 66, 0.1);
  border: 1px solid rgba(255, 72, 66, 0.3);
  color: var(--error);
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.75rem;
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
  }
`;

const TrialBadge = styled.div`
  background: linear-gradient(135deg, rgba(78, 205, 196, 0.15), rgba(108, 99, 255, 0.15));
  border: 2px solid rgba(78, 205, 196, 0.5);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  box-shadow: 0 4px 12px rgba(78, 205, 196, 0.2);
`;

const TrialBadgeTitle = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--accent);
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  svg {
    font-size: 1.25rem;
  }
`;

const TrialBadgeText = styled.div`
  font-size: 1rem;
  color: var(--text);
  font-weight: 600;
  
  .days-count {
    font-size: 1.5rem;
    color: var(--accent);
    font-weight: 700;
    margin: 0 0.25rem;
  }
`;

const TrialBadgeSubtext = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
`;

// Add these styled components for the loading overlay
const LoadingOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1100;
`;

const SpinnerText = styled.div`
  color: white;
  font-size: 1.2rem;
  margin-top: 1.5rem;
  font-weight: 500;
`;

export default function BillingPage() {
  const { t } = useTranslation();
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<SubscriptionType>("none");
  const [willProvideCard, setWillProvideCard] = useState(false);
  const [isPlanChangeLoading, setIsPlanChangeLoading] = useState(false);

  const { user: userAuth, refreshUser: refreshUserFromAuth } = useAuth();
  const user = userAuth!;
  
  // Use dashboard context for shared data
  const {
    prices,
    priceError,
    hasNfr,
    upcomingInvoice,
    isLoadingUpcomingInvoice,
    invoices,
    isLoadingInvoices,
    refreshPrices,
    refreshNfr,
    refreshUpcomingInvoice,
    refreshInvoices,
  } = useDashboard();

  // Refresh pro status on mount only (same as login)
  useEffect(() => {
    refreshUserFromAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Use centralized checkout hook
  const { initiateCheckout: initiateCheckoutHook } = useCheckout({
    onError: (error) => {
      setConfirmationTitle("Error");
      setConfirmationMessage(`Failed to create checkout session: ${error}`);
      setShowConfirmationModal(true);
    },
  });

  // Get subscription data from user object and cast to extended profile type
  const userSubscription = user.profile as unknown as ProfileWithSubscriptionDetails;

  // Define a function to determine if the user is in a trial period
  const isInTrialPeriod = useMemo(() => {
    if (!userSubscription.trial_expiration) return false;
    return new Date() < new Date(userSubscription.trial_expiration);
  }, [userSubscription.trial_expiration]);

  // Calculate days left in trial
  const daysLeftInTrial = useMemo(() => {
    if (!userSubscription.trial_expiration) return 0;
    const today = new Date();
    const trialEnd = new Date(userSubscription.trial_expiration);
    const diffTime = Number(trialEnd) - Number(today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [userSubscription.trial_expiration]);

  // State for trial status checking
  const [hasHadTrial, setHasHadTrial] = useState<boolean | null>(null);

  // State for billing period selection (for pricing card)
  const [selectedBillingPeriodForPricing, setSelectedBillingPeriodForPricing] =
    useState<PlanType>("monthly");

  // Add a variable to determine the subscription interval
  const subscriptionInterval = useMemo(() => {
    // Return "month" for monthly, "year" for annual, or null for other subscription types
    if (userSubscription.subscription === "monthly") return "month";
    if (userSubscription.subscription === "annual") return "year";
    return null;
  }, [userSubscription.subscription]);

  // Discounts and invoices are now provided by DashboardContext


  // Add state for portal redirect loading
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // Check if user has completed a trial
  const hasCompletedTrial = useMemo(() => {
    // Consider a trial completed if:
    // 1. User has an active subscription (not "none")
    // 2. User has a past trial_expiration date but no active subscription
    return (
      userSubscription.subscription !== "none" ||
      (userSubscription.trial_expiration &&
        new Date(userSubscription.trial_expiration) < new Date() &&
        userSubscription.subscription === "none")
    );
  }, [userSubscription.subscription, userSubscription.trial_expiration]); // Use stable values

  // Check if the user should see trial messaging
  const shouldShowTrialContent = useMemo(() => {
    // Only show trial content if user is currently in an active trial period
    return isInTrialPeriod && !hasCompletedTrial;
  }, [isInTrialPeriod, hasCompletedTrial]);

  // Function to refresh user data from AuthContext
  const refreshUserData = async () => {
    // Refresh user data from AuthContext which will fetch the latest profile
    await refreshUserFromAuth();
  };

  // Function to check if customer has had a trial before
  const checkTrialStatus = useCallback(async () => {
    if (!user?.email) return;

    try {
      const { checkCustomerTrialStatus } = await import(
        "@/utils/stripe/actions"
      );
      const result = await checkCustomerTrialStatus(user.email);

      if (result.error) {
        setHasHadTrial(false); // Default to false on error
      } else {
        setHasHadTrial(result.hasHadTrial);
      }
    } catch (error) {
      console.error("Error checking trial status:", error);
      setHasHadTrial(false); // Default to false on error
    }
  }, [user?.email]);

  // Track subscription changes separately to avoid infinite loops
  // We don't want subscription changes to trigger data refetches
  // Only lastUserUpdate should trigger refetches

  // Fetch upcoming invoice and invoices when needed (context handles prices and NFR)
  useEffect(() => {
    // Only fetch user-specific data if they have a customer ID
    if (user?.profile?.customer_id) {
      // Fetch upcoming invoice if user has an active subscription or is in trial
      if (isInTrialPeriod || userSubscription.subscription !== "none") {
        refreshUpcomingInvoice();
      }

      // Fetch invoice history
      refreshInvoices();
    }

    // Check trial status for logged-in users (only once per email change)
    if (user?.email) {
      checkTrialStatus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    user?.profile?.customer_id,
    isInTrialPeriod,
    user?.email,
    user?.id,
    // Removed subscription from dependencies to prevent infinite loops
    // Removed checkTrialStatus from dependencies - it's stable based on user?.email
  ]);

  // Function to refresh all data
  const refreshAllData = async () => {
    // Refresh user data from auth context
    await refreshUserData();
    // Refresh all dashboard context data
    await Promise.all([
      refreshPrices(),
      refreshNfr(),
      refreshUpcomingInvoice(),
      refreshInvoices(),
    ]);
  };

  // Add a separate handler for when users click X or outside the modal
  const handleDismissConfirmation = () => {
    setShowConfirmationModal(false);
  };

  // Handle confirmation close - now only used for errors and subscription changes
  const handleConfirmationClose = async () => {
    setShowConfirmationModal(false);
    // Refresh all data after confirmation dialog is closed
    await refreshAllData();
  };

  // Update handleConfirmPlanChange to use refreshAllData
  const handleConfirmPlanChange = async () => {
    if (selectedBillingPeriod === userSubscription.subscription) {
      // Don't do anything if they select their current plan
      setShowPlanModal(false);
      return;
    }

    // Start loading immediately when user confirms
    setIsPlanChangeLoading(true);

    // Handle lifetime plan separately - always goes to checkout
    if (selectedBillingPeriod === "lifetime") {
      setShowPlanModal(false);
      setIsPlanChangeLoading(false);

      await initiateCheckoutHook("lifetime", {
        hasHadTrial: hasHadTrial === true,
      });
      return;
    }

    // For users without a plan, direct to checkout
    if (userSubscription.subscription === "none") {
      setShowPlanModal(false);
      setIsPlanChangeLoading(false);

      // Convert SubscriptionType to PlanType, handling 'admin' and 'none' cases
      let validPlanType: "monthly" | "annual" | "lifetime";
      const period = selectedBillingPeriod as string;
      if (period === "monthly") {
        validPlanType = "monthly";
      } else if (period === "annual") {
        validPlanType = "annual";
      } else if (period === "lifetime") {
        validPlanType = "lifetime";
      } else {
        // Default to monthly for 'admin', 'none', or any other invalid types
        validPlanType = "monthly";
      }

      await initiateCheckoutHook(validPlanType, {
        willProvideCard,
        hasHadTrial: hasHadTrial === true,
      });
      return;
    }

    // For existing users with an active plan switching between monthly/annual
    // Redirect them to Stripe Checkout to review and confirm the change
    try {
      // Convert SubscriptionType to PlanType for checkout
      let validPlanType: "monthly" | "annual" | "lifetime";
      const period = selectedBillingPeriod as string;
      if (period === "monthly") {
        validPlanType = "monthly";
      } else if (period === "annual") {
        validPlanType = "annual";
      } else if (period === "lifetime") {
        validPlanType = "lifetime";
      } else {
        // Default to monthly for any other invalid types
        validPlanType = "monthly";
      }

      // Keep modal open and show loading spinner while creating checkout session
      // Redirect to Stripe Checkout for plan change
      const result = await initiateCheckoutHook(validPlanType, {
        hasHadTrial: hasHadTrial === true,
        isPlanChange: true,
      });

      // If checkout was successful, the redirect will happen automatically
      // If there was an error, close modal and reset loading
      if (!result.success) {
        setIsPlanChangeLoading(false);
        setShowPlanModal(false);
      }
      // If successful, keep loading state until redirect happens
    } catch (error) {
      console.error("Error initiating checkout:", error);
      setIsPlanChangeLoading(false);
      setShowPlanModal(false);
    }
  };

  // Format the date for display
  const formatDate = (date: string | number | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString(t("common.locale", "en-US"), {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get the price for the current subscription
  const getCurrentPrice = (): string => {
    const price =
      userSubscription.subscription === "monthly"
        ? prices.monthly
        : userSubscription.subscription === "annual"
        ? prices.yearly
        : prices.lifetime;

    return price !== null ? price.toString() : "--";
  };

  const handlePlanChange = () => {
    // Reset to current interval when opening modal
    setSelectedBillingPeriod(
      userSubscription.subscription === "none"
        ? "monthly"
        : userSubscription.subscription
    );

    // Reset willProvideCard to true on modal open
    setWillProvideCard(true);

    setShowPlanModal(true);
  };

  const handleBillingPeriodChange = (period: SubscriptionType) => {
    // Don't allow selecting the current plan if they already have one
    if (
      userSubscription.subscription !== "none" &&
      period === userSubscription.subscription
    ) {
      return;
    }
    setSelectedBillingPeriod(period);
  };

  // Wrapper function to handle the string parameter from PlanSelectionModal
  const handleIntervalChange = (interval: string) => {
    handleBillingPeriodChange(interval as SubscriptionType);
  };

  const handleCardToggleChange = (newValue: boolean) => {
    setWillProvideCard(newValue);
  };

  // Handle "Manage Billing" depending on subscription source
  const handleManageBilling = async () => {
    // If subscription is managed through the iOS App Store, send the user there
    if (userSubscription.subscription_source === "ios") {
      // For App Store subscriptions, billing is managed in the App Store / Apple ID settings,
      // not via Stripe. Redirect to Apple's subscriptions management page.
      try {
        window.location.href = "https://apps.apple.com/account/subscriptions";
      } catch {
        // If redirect fails for some reason, fall back to an explanatory message.
        setConfirmationTitle(
          t(
            "dashboard.billing.appStoreManageTitle",
            "Manage Subscription in App Store"
          )
        );
        setConfirmationMessage(
          t(
            "dashboard.billing.appStoreManageMessage",
            "This subscription is billed through the Apple App Store. Open the App Store on your device, tap your account avatar, then tap Subscriptions to manage or cancel."
          )
        );
        setShowConfirmationModal(true);
      }
      return;
    }

    // Stripe / web-managed subscriptions
    if (!user?.profile?.customer_id) {
      setConfirmationTitle("Error");
      setConfirmationMessage("No customer account found.");
      setShowConfirmationModal(true);
      return;
    }

    try {
      // Show loading spinner
      setIsPortalLoading(true);

      const { url, error } = await createCustomerPortalSession(
        user.profile.customer_id
      );

      if (url) {
        // Redirect to Stripe Customer Portal
        window.location.href = url;
      } else {
        // Hide loading spinner on error
        setIsPortalLoading(false);

        // Show error message
        setConfirmationTitle(t("dashboard.billing.error", "Error"));
        setConfirmationMessage(
          t(
            "dashboard.billing.portalAccessError",
            "Failed to access billing portal: {{error}}",
            {
              error: error || t("common.unknownError", "Unknown error"),
            }
          )
        );
        setShowConfirmationModal(true);
      }
    } catch (e) {
      // Hide loading spinner on error
      setIsPortalLoading(false);

      console.error("Billing portal error:", e);
      setConfirmationTitle(t("dashboard.billing.error", "Error"));
      setConfirmationMessage(
        t("dashboard.billing.errorOccurred", "An error occurred: {{error}}", {
          error:
            e instanceof Error
              ? e.message
              : t("common.unknownError", "Unknown error"),
        })
      );
      setShowConfirmationModal(true);
    }
  };

  // Debug: Log customer_id to help diagnose issues
  useEffect(() => {
    console.log("[BillingPage] customer_id:", userSubscription.customer_id);
    console.log("[BillingPage] invoices:", invoices.length);
    console.log("[BillingPage] isLoadingInvoices:", isLoadingInvoices);
  }, [userSubscription.customer_id, invoices.length, isLoadingInvoices]);

  return (
    <BillingContainer>
      {/* Loading overlay */}
      {isPortalLoading && (
        <LoadingOverlay>
          <LoadingComponent size="50px" text="" />
          <SpinnerText>
            {t(
              "dashboard.billing.redirectingPortal",
              "Redirecting to billing portal..."
            )}
          </SpinnerText>
        </LoadingOverlay>
      )}

      <SectionTitle>
        {t("dashboard.billing.title", "Billing & Subscription")}
      </SectionTitle>

      {shouldShowTrialContent && (
        <AlertBanner
          style={{
            backgroundColor: "rgba(249, 200, 70, 0.1)",
            borderColor: "rgba(249, 200, 70, 0.3)",
            color: "#F96E46",
          }}
        >
          <FaGift />
          <p>
            {t(
              "dashboard.billing.trialBanner",
              "You're currently on a {{trialDays}}-day free trial with full access to all premium features. {{daysLeft}} days remaining. Your first payment of ${{amount}} will be on {{date}}.",
              {
                trialDays: 7,
                daysLeft: daysLeftInTrial,
                amount: isLoadingUpcomingInvoice
                  ? "..."
                  : (upcomingInvoice.amount?.toFixed(2) || getCurrentPrice()),
                date: formatDate(userSubscription.trial_expiration),
              }
            )}
          </p>
        </AlertBanner>
      )}

      {priceError && (
        <AlertBanner style={{ backgroundColor: "rgba(255, 72, 66, 0.1)" }}>
          <FaTimes />
          <p>
            {priceError}{" "}
            {t(
              "dashboard.billing.showingDefaultPrices",
              "Showing default prices."
            )}
          </p>
        </AlertBanner>
      )}

      {isSubscriptionNone(userSubscription.subscription) && hasNfr === false ? (
        // Show subscription status and pricing card when user has no subscription and no NFR
        <div style={{ marginTop: "2rem" }}>
          {/* Subscription Status Card */}
          <BillingCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <CardTitle>
              <FaInfoCircle />{" "}
              {t("dashboard.billing.subscriptionStatus", "Subscription Status")}
            </CardTitle>
            <CardContent>
              <PlanDetails>
                {/* Left Column */}
                <div>
                  <PlanName>
                    {t(
                      "dashboard.billing.noActivePlan",
                      "No Active Subscription"
                    )}
                  </PlanName>
                  <PlanDescription>
                    {t(
                      "dashboard.billing.noActivePlanDesc",
                      "You currently don't have an active subscription. Subscribe below to unlock all premium features."
                    )}
                  </PlanDescription>
                </div>

                {/* Right Column */}
                <div>
                  {/* Trial Status */}
                  {hasHadTrial !== null && (
                    <div
                      style={{
                        marginTop: "0",
                        padding: "0.75rem",
                        background: hasHadTrial
                          ? "rgba(255, 87, 51, 0.1)"
                          : "rgba(16, 185, 129, 0.1)",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        color: hasHadTrial
                          ? "var(--warning)"
                          : "var(--success)",
                      }}
                    >
                      {hasHadTrial ? (
                        <>
                          <FaCheck
                            style={{ marginRight: "0.5rem", flexShrink: 0 }}
                          />
                          {t(
                            "dashboard.billing.trialCompleted",
                            "Free trial completed"
                          )}
                        </>
                      ) : (
                        <>
                          <FaGift
                            style={{ marginRight: "0.5rem", flexShrink: 0 }}
                          />
                          {t(
                            "dashboard.billing.trialAvailable",
                            "Free trial available - choose a plan below to start"
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </PlanDetails>
              
              {/* Show Manage Billing button if user has a customer_id */}
              {userSubscription.customer_id && (
                <ButtonContainer>
                  <Button onClick={handleManageBilling}>
                    {t("dashboard.billing.manageBilling", "Manage Billing")}
                  </Button>
                </ButtonContainer>
              )}
            </CardContent>
          </BillingCard>

          {/* Pricing Card */}
          <BillingToggle
            billingPeriod={selectedBillingPeriodForPricing}
            onBillingPeriodChange={(period) =>
              setSelectedBillingPeriodForPricing(period)
            }
            userSubscription={userSubscription.subscription}
            showSavingsInfo={true}
          />
          <PricingCard
            billingPeriod={selectedBillingPeriodForPricing}
            onBillingPeriodChange={(period) =>
              setSelectedBillingPeriodForPricing(period)
            }
            showTrialOptions={!hasHadTrial}
          />
        </div>
      ) : (
        // Show current plan card when user has a subscription
        <BillingCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <CardTitle>
            <FaCrown /> {t("dashboard.billing.currentPlan", "Current Plan")}
          </CardTitle>
          <CardContent>
            <PlanDetails>
              {/* Left Column */}
              <div>
                <PlanName>
                  <div className="logo-container">
                    <CymasphereLogo
                      size="36px"
                      fontSize="1.5rem"
                      showText={true}
                      onClick={(e: React.MouseEvent) => e.preventDefault()}
                      href=""
                      className=""
                    />
                    <span className="pro-label">PRO</span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: "1rem",
                    }}
                  >
                    <div className="plan-type">
                      {hasNfr
                        ? "Elite Access"
                        : isSubscriptionLifetime(userSubscription.subscription)
                        ? t("dashboard.billing.lifetimePlan", "Lifetime")
                        : isInTrialPeriod
                        ? t("dashboard.billing.trialPlan", "Free Trial")
                        : subscriptionInterval === "month"
                        ? t("dashboard.billing.monthly", "Monthly")
                        : t("dashboard.billing.yearly", "Yearly")}
                    </div>
                    {/* Hide hyphen and price for lifetime and Elite access */}
                    {!(
                      hasNfr ||
                      isSubscriptionLifetime(userSubscription.subscription)
                    ) && (
                      <>
                        <span
                          style={{
                            color: "var(--text-secondary)",
                            fontSize: "2.5rem",
                            fontWeight: 700,
                          }}
                        >
                          —
                        </span>
                        <PlanPrice>
                          {isSubscriptionNone(userSubscription.subscription)
                            ? "$0.00"
                            : `$${getCurrentPrice()} / ${
                                subscriptionInterval === "month"
                                  ? t("dashboard.billing.month", "month")
                                  : t("dashboard.billing.year", "year")
                              }`}
                        </PlanPrice>
                      </>
                    )}
                  </div>
                </PlanName>
                <PlanDescription>
                  {hasNfr
                    ? "Elite Access - Full access to all premium features"
                    : isSubscriptionNone(userSubscription.subscription)
                    ? t(
                        "dashboard.billing.noPlanDesc",
                        "No active subscription"
                      )
                    : isSubscriptionLifetime(userSubscription.subscription)
                    ? t(
                        "dashboard.billing.lifetimePlanDesc",
                        "Full access to all features forever with free updates"
                      )
                    : isInTrialPeriod
                    ? t(
                        "dashboard.billing.trialPlanDesc",
                        "Free trial active - Full access to all premium features. {{days}} days remaining.",
                        { days: daysLeftInTrial }
                      )
                    : t(
                        "dashboard.billing.paidPlanDesc",
                        "Full access to all premium features and content"
                      )}
                  {userSubscription.subscription_source === "ios" && (
                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.85rem",
                        color: "var(--text-secondary)",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.25rem",
                      }}
                    >
                      <FaApple style={{ fontSize: "0.9rem" }} />
                      <span>
                        {t(
                          "dashboard.billing.appStoreSubscription",
                          "Subscription managed through App Store"
                        )}
                      </span>
                    </div>
                  )}
                </PlanDescription>
              </div>

              {/* Right Column */}
              <div>
                {/* Trial Badge - Show prominently if in trial */}
                {isInTrialPeriod && (
                  <TrialBadge>
                    <TrialBadgeTitle>
                      <FaGift />
                      {t("dashboard.billing.onFreeTrial", "🎉 You're on a FREE TRIAL")}
                    </TrialBadgeTitle>
                    <TrialBadgeText>
                      {daysLeftInTrial === 1
                        ? t("dashboard.billing.trialLastDay", "Last day of your trial!")
                        : (
                            <>
                              <span className="days-count">{daysLeftInTrial}</span>
                              {" "}
                              {t("dashboard.billing.trialDaysLeft", "days left")}
                            </>
                          )}
                    </TrialBadgeText>
                    <TrialBadgeSubtext>
                      {t(
                        "dashboard.billing.trialExpires",
                        "Trial expires on {{date}}",
                        { date: formatDate(userSubscription.trial_expiration) }
                      )}
                    </TrialBadgeSubtext>
                  </TrialBadge>
                )}

                {/* Next billing date */}
                {!isSubscriptionNone(userSubscription.subscription) &&
                  !isSubscriptionLifetime(userSubscription.subscription) &&
                  hasNfr !== true && (
                    <div style={{ marginTop: "0" }}>
                      <div
                        style={{
                          fontSize: "0.9rem",
                          color: "var(--text-secondary)",
                          marginBottom: "0.25rem",
                        }}
                      >
                        {t(
                          "dashboard.billing.nextBilling",
                          "Next billing date"
                        )}
                        :
                      </div>
                      <div>
                        {formatDate(userSubscription.subscription_expiration)}
                      </div>
                    </div>
                  )}

                {userSubscription.cancel_at_period_end && (
                  <div
                    style={{
                      marginTop: "0.75rem",
                      padding: "0.75rem",
                      background: "rgba(255, 87, 51, 0.1)",
                      borderRadius: "6px",
                      color: "var(--warning)",
                      fontSize: "0.9rem",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <FaInfoCircle
                      style={{ marginRight: "0.5rem", flexShrink: 0 }}
                    />
                    {t(
                      "dashboard.billing.cancelNotice",
                      "Your subscription will be canceled on {{date}}. You will have access until then.",
                      {
                        date: formatDate(
                          userSubscription.subscription_expiration
                        ),
                      }
                    )}
                  </div>
                )}

                {/* Trial Status - show if we know the status, but not for lifetime or Elite access */}
                {hasHadTrial !== null &&
                  !hasNfr &&
                  !isSubscriptionLifetime(userSubscription.subscription) && (
                    <div
                      style={{
                        marginTop: "0.75rem",
                        padding: "0.75rem",
                        background: "rgba(16, 185, 129, 0.1)",
                        borderRadius: "6px",
                        fontSize: "0.9rem",
                        display: "flex",
                        alignItems: "center",
                        color: "var(--success)",
                      }}
                    >
                      <FaCheck
                        style={{ marginRight: "0.5rem", flexShrink: 0 }}
                      />
                      {t(
                        "dashboard.billing.usedFreeTrial",
                        "You used your free trial to start this subscription"
                      )}
                    </div>
                  )}
              </div>
            </PlanDetails>

            <ButtonContainer>
              <Button onClick={handleManageBilling}>
                {t("dashboard.billing.manageBilling", "Manage Billing")}
              </Button>
              {/* Show change plan only for non-lifetime subscriptions */}
              {!isSubscriptionLifetime(userSubscription.subscription) && (
                <Button
                  onClick={handlePlanChange}
                  style={{
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  {t("dashboard.billing.changePlan", "Change Plan")}
                </Button>
              )}
            </ButtonContainer>
          </CardContent>
        </BillingCard>
      )}

      {/* Always show billing history section - will show invoices if customer_id is found or empty state if not */}
      <BillingCard>
          <CardTitle>
            <FaHistory />{" "}
            {t("dashboard.billing.paymentHistory", "Payment History")}
          </CardTitle>
          <CardContent>
            {isLoadingInvoices ? (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  padding: "2rem 0",
                }}
              >
                <LoadingComponent
                  size="30px"
                  text={t(
                    "dashboard.billing.loadingInvoices",
                    "Loading invoices..."
                  )}
                />
              </div>
            ) : invoices.length === 0 ? (
              <div
                style={{ color: "var(--text-secondary)", padding: "1rem 0" }}
              >
                {t(
                  "dashboard.billing.noTransactions",
                  "No transaction history available"
                )}
              </div>
            ) : (
              <InvoicesList>
                {invoices.map((invoice) => (
                  <InvoiceItem key={invoice.id}>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <div>{invoice.number || invoice.id}</div>
                      <InvoiceDate>{formatDate(invoice.created)}</InvoiceDate>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "1rem",
                      }}
                    >
                      <InvoiceAmount>
                        ${invoice.amount.toFixed(2)}
                      </InvoiceAmount>
                      <InvoiceStatus
                        status={invoice.status === "paid" ? "paid" : "unpaid"}
                      >
                        {invoice.status === "paid"
                          ? t("dashboard.billing.paid", "Paid")
                          : t("dashboard.billing.unpaid", "Unpaid")}
                      </InvoiceStatus>
                      {invoice.receipt_url && (
                        <DownloadButton
                          onClick={() => {
                            window.open(invoice.receipt_url, "_blank");
                          }}
                        >
                          <FaExternalLinkAlt />
                          {t("dashboard.billing.viewReceipt", "View")}
                        </DownloadButton>
                      )}
                    </div>
                  </InvoiceItem>
                ))}
              </InvoicesList>
            )}
          </CardContent>
        </BillingCard>

      {/* Plan Selection Modal */}
      <AnimatePresence>
        {showPlanModal && (
          <PlanSelectionModal
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            profile={user.profile}
            onIntervalChange={handleIntervalChange}
            onConfirm={handleConfirmPlanChange}
            formatDate={formatDate}
            planName="Cymasphere Pro"
            monthlyPrice={prices.monthly ?? 0}
            yearlyPrice={prices.yearly ?? 0}
            lifetimePrice={prices.lifetime ?? 0}
            planDescription={t("pricing.proSolution")}
            isPlanChangeLoading={isPlanChangeLoading}
            planFeatures={(() => {
              // Use the same features array as the main pricing section
              try {
                const translatedFeatures = t("pricing.features", {
                  returnObjects: true,
                });

                // Check if it's an array and has elements
                if (
                  Array.isArray(translatedFeatures) &&
                  translatedFeatures.length > 0
                ) {
                  return translatedFeatures;
                }
              } catch (error) {
                console.log("Error loading translated features", error);
              }

              // Fallback to English features
              return [
                "Song Builder with Multi-Track Management",
                "Intelligent Pattern Editor & Chord Adaptation",
                "Gestural Harmony Palette Interface",
                "Advanced Voice Leading & Chord Voicings",
                "Interactive Chord Progression Timeline",
                "Complete Voice and Range Control",
                "Standalone App & DAW Plugin Support",
                "Real-Time Chord Reharmonization Tools",
                "Comprehensive Arrangement View",
                "Custom Voicing Generation Engine",
                "Premium Support & All Future Updates",
              ];
            })()}
            monthlyDiscount={prices.monthlyDiscount || undefined}
            yearlyDiscount={prices.yearlyDiscount || undefined}
            lifetimeDiscount={prices.lifetimeDiscount || undefined}
            onCardToggleChange={handleCardToggleChange}
            hasHadTrial={hasHadTrial}
          />
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismissConfirmation}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "500px" }}
            >
              <ModalHeader>
                <ModalTitle>{confirmationTitle}</ModalTitle>
                <CloseButton onClick={handleDismissConfirmation}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody
                style={{ textAlign: "center", padding: "2rem 1.5rem" }}
              >
                <div
                  style={{
                    fontSize: "4rem",
                    marginBottom: "1rem",
                    color:
                      confirmationTitle.includes("Error") ||
                      confirmationTitle.includes("Failed")
                        ? "var(--error)"
                        : "var(--primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {confirmationTitle.includes("Upgrading") ? (
                    <FaCrown />
                  ) : confirmationTitle.includes("Scheduled") ? (
                    <FaInfoCircle />
                  ) : confirmationTitle.includes("Error") ||
                    confirmationTitle.includes("Failed") ? (
                    <FaTimes />
                  ) : (
                    <FaCheck />
                  )}
                </div>
                <p
                  style={{
                    fontSize: "1.1rem",
                    color: "var(--text)",
                    marginBottom: "1.5rem",
                  }}
                >
                  {confirmationMessage}
                </p>
              </ModalBody>
              <ModalFooter style={{ justifyContent: "center" }}>
                <Button onClick={handleConfirmationClose}>
                  {confirmationTitle.includes("Upgrading")
                    ? t(
                        "dashboard.billing.continueToCheckout",
                        "Continue to Checkout"
                      )
                    : confirmationTitle.includes("Error") ||
                      confirmationTitle.includes("Failed")
                    ? t("dashboard.main.close", "Close")
                    : t("dashboard.billing.gotIt", "Got It")}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </BillingContainer>
  );
}
