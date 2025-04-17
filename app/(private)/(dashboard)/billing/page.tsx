"use client";
import React, { useState, useEffect, useMemo } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaReceipt,
  FaHistory,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaCrown,
  FaGift,
  FaExternalLinkAlt,
} from "react-icons/fa";
import PlanSelectionModal from "@/components/modals/PlanSelectionModal";
import { Profile, SubscriptionType } from "@/utils/supabase/types";
import {
  initiateCheckout,
  getPrices,
  getUpcomingInvoice,
  updateSubscription,
  createCustomerPortalSession,
} from "@/utils/stripe/actions";
import {
  getCustomerInvoices,
  InvoiceData,
} from "@/utils/stripe/supabase-stripe";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingComponent from "@/components/common/LoadingComponent";

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
`;

const PlanDetails = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1.5rem;
`;

const PlanName = styled.div`
  font-size: 1.3rem;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const PlanPrice = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;

  span {
    font-size: 1rem;
    color: var(--text-secondary);
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

const BillingInfo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background-color: rgba(108, 99, 255, 0.1);
  border-radius: 6px;
  font-size: 0.9rem;

  svg {
    color: var(--primary);
    margin-right: 0.5rem;
    flex-shrink: 0;
  }
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

interface PlanOption {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  lifetimePrice?: number;
  description: string;
  trialDays?: number;
  features: string[];
}

interface ProPlanOption extends PlanOption {
  lifetimePrice: number;
  trialDays: number;
}

interface PlanOptions {
  basic: PlanOption;
  pro: ProPlanOption;
  team: PlanOption;
}

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
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [selectedBillingPeriod, setSelectedBillingPeriod] =
    useState<SubscriptionType>("none");
  const [willProvideCard, setWillProvideCard] = useState(false);

  const router = useRouter();
  const { user, refreshUser } = useAuth();

  // State for plan prices and discounts
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);
  const [monthlyPrice, setMonthlyPrice] = useState(8);
  const [yearlyPrice, setYearlyPrice] = useState(69);
  const [lifetimePrice, setLifetimePrice] = useState(199);

  // State for discounts
  const [monthlyDiscount, setMonthlyDiscount] = useState<{
    percent_off?: number;
    amount_off?: number;
    promotion_code?: string;
  } | null>(null);

  const [yearlyDiscount, setYearlyDiscount] = useState<{
    percent_off?: number;
    amount_off?: number;
    promotion_code?: string;
  } | null>(null);

  const [lifetimeDiscount, setLifetimeDiscount] = useState<{
    percent_off?: number;
    amount_off?: number;
    promotion_code?: string;
  } | null>(null);

  // User subscription data
  const [userSubscription, setUserSubscription] = useState<Profile>(
    user?.profile || {
      avatar_url: null,
      customer_id: null,
      first_name: null,
      id: "",
      last_name: null,
      last_stripe_api_check: null,
      subscription: "none",
      subscription_expiration: null,
      trial_expiration: null,
      updated_at: null,
    }
  );

  // Add function to check if user is in trial period
  const isInTrialPeriod = useMemo(() => {
    return (
      userSubscription.trial_expiration &&
      new Date() < new Date(userSubscription.trial_expiration)
    );
  }, [userSubscription.trial_expiration]);

  // Add function to get days left in trial
  const daysLeftInTrial = useMemo(() => {
    if (!userSubscription.trial_expiration) return 0;
    const today = new Date();
    const trialEnd = new Date(userSubscription.trial_expiration);
    const diffTime = Math.abs(trialEnd.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }, [userSubscription.trial_expiration]);

  // State for upcoming invoice and invoices
  const [upcomingInvoiceAmount, setUpcomingInvoiceAmount] = useState<
    number | null
  >(null);
  const [isLoadingInvoice, setIsLoadingInvoice] = useState(false);
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoadingInvoices, setIsLoadingInvoices] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);

  // Add a new state to track when user data is updated
  const [lastUserUpdate, setLastUserUpdate] = useState<Date>(new Date());

  // Add state for portal redirect loading
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  // Helper function to format currency
  const formatCurrency = (amount: number, currency: string = "usd") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

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
  }, [userSubscription]);

  // Check if the user should see trial messaging
  const shouldShowTrialContent = useMemo(() => {
    // Only show trial content if user is currently in an active trial period
    return isInTrialPeriod && !hasCompletedTrial;
  }, [isInTrialPeriod, hasCompletedTrial]);

  // Watch for user changes and update userSubscription state
  useEffect(() => {
    if (user?.profile) {
      setUserSubscription(user.profile);
      // Update the lastUserUpdate timestamp to trigger data refetching
      setLastUserUpdate(new Date());
    }
  }, [user]);

  // Fetch all data: prices, upcoming invoice, invoices
  // This useEffect depends on lastUserUpdate to trigger refetching when user data changes
  useEffect(() => {
    // Function to fetch all pricing data
    async function fetchAllData() {
      // Fetch prices
      fetchPrices();

      // Only fetch user-specific data if they have a customer ID
      if (user?.profile?.customer_id) {
        // Fetch upcoming invoice if in a trial period
        if (isInTrialPeriod) {
          fetchUpcomingInvoice();
        }

        // Fetch invoice history
        fetchInvoices();
      }
    }

    // Fetch prices from Stripe
    async function fetchPrices() {
      try {
        setIsLoadingPrices(true);
        setPriceError(null);

        const { prices, error } = await getPrices();

        if (error) {
          setPriceError(error);
          return;
        }

        // Update state with fetched prices
        setMonthlyPrice(Math.round(prices.monthly.amount / 100));
        setYearlyPrice(Math.round(prices.annual.amount / 100));
        setLifetimePrice(Math.round(prices.lifetime.amount / 100));

        // Store discount information if available
        if (prices.monthly.discount) {
          setMonthlyDiscount(prices.monthly.discount);
        }

        if (prices.annual.discount) {
          setYearlyDiscount(prices.annual.discount);
        }

        if (prices.lifetime.discount) {
          setLifetimeDiscount(prices.lifetime.discount);
        }
      } catch (err) {
        console.error("Error fetching prices:", err);
        setPriceError("Failed to load pricing information");
      } finally {
        setIsLoadingPrices(false);
      }
    }

    // Fetch upcoming invoice
    async function fetchUpcomingInvoice() {
      if (!user?.profile?.customer_id) return;

      try {
        setIsLoadingInvoice(true);
        const { amount, error } = await getUpcomingInvoice(
          user.profile.customer_id
        );

        if (error) {
          console.error("Error fetching upcoming invoice:", error);
        } else {
          setUpcomingInvoiceAmount(amount);
        }
      } catch (err) {
        console.error("Error in fetchUpcomingInvoice:", err);
      } finally {
        setIsLoadingInvoice(false);
      }
    }

    // Fetch invoice history
    async function fetchInvoices() {
      if (!user?.profile?.customer_id) return;

      try {
        setIsLoadingInvoices(true);
        setInvoiceError(null);
        const { invoices, error } = await getCustomerInvoices(
          user.profile.customer_id
        );

        if (error) {
          console.error("Error fetching invoices:", error);
          setInvoiceError(error);
        } else {
          setInvoices(invoices);
        }
      } catch (err) {
        console.error("Error in fetchInvoices:", err);
        setInvoiceError("Failed to load invoice history");
      } finally {
        setIsLoadingInvoices(false);
      }
    }

    // Fetch all data when component mounts or lastUserUpdate changes
    fetchAllData();
  }, [user?.profile?.customer_id, isInTrialPeriod, lastUserUpdate]);

  // Function to refresh all data
  const refreshAllData = async () => {
    // Refresh user data from auth context
    await refreshUser();
    // Update lastUserUpdate to trigger data refetching in the useEffect
    setLastUserUpdate(new Date());
  };

  // Update handleConfirmationClose to use the new refreshAllData function
  const handleConfirmationClose = async () => {
    setShowConfirmationModal(false);

    // If it was an upgrade that required checkout (lifetime plan or new subscription)
    if (confirmationTitle === "Upgrading Your Plan") {
      if (user && selectedBillingPeriod !== "none") {
        // Get the appropriate promotion code based on the selected billing period
        // Only apply promo codes for new customers, not for plan upgrades
        let promotionCode: string | undefined;

        // Only apply automatic promo codes for NEW customers (ones without an existing plan)
        if (userSubscription.subscription === "none") {
          if (
            selectedBillingPeriod === "monthly" &&
            monthlyDiscount?.promotion_code
          ) {
            promotionCode = monthlyDiscount.promotion_code;
          } else if (
            selectedBillingPeriod === "annual" &&
            yearlyDiscount?.promotion_code
          ) {
            promotionCode = yearlyDiscount.promotion_code;
          } else if (
            selectedBillingPeriod === "lifetime" &&
            lifetimeDiscount?.promotion_code
          ) {
            promotionCode = lifetimeDiscount.promotion_code;
          }
        }
        // Else: For existing customers, don't pass a promo code - they can enter it manually at checkout

        // Show loading state
        setIsLoadingPrices(true);

        try {
          const { url, error } = await initiateCheckout(
            selectedBillingPeriod,
            user.email,
            user.profile.customer_id || undefined,
            promotionCode,
            // Card is always required for existing users
            userSubscription.subscription !== "none" ? true : willProvideCard
          );

          if (url) {
            router.push(url);
          } else {
            console.error("Error initiating checkout:", error);
            // Show error modal
            setConfirmationTitle("Error");
            setConfirmationMessage(
              `Failed to create checkout session: ${error || "Unknown error"}`
            );
            setShowConfirmationModal(true);
          }
        } catch (e) {
          console.error("Checkout error:", e);
          // Show error modal
          setConfirmationTitle("Error");
          setConfirmationMessage(
            `An error occurred during checkout: ${
              e instanceof Error ? e.message : "Unknown error"
            }`
          );
          setShowConfirmationModal(true);
        } finally {
          setIsLoadingPrices(false);
        }
      }
    } else {
      // Always refresh all data after any confirmation dialog is closed
      await refreshAllData();
    }
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
      setConfirmationTitle("Upgrading Your Plan");
      setConfirmationMessage(
        `You're upgrading to the lifetime plan. You'll be redirected to checkout to complete your purchase.`
      );
      setShowConfirmationModal(true);
      setShowPlanModal(false);
      setIsPlanChangeLoading(false);
      return;
    }

    // For users without a plan, direct to checkout
    if (userSubscription.subscription === "none") {
      setConfirmationTitle("Upgrading Your Plan");
      setConfirmationMessage(
        `You're starting a ${
          planOptions.pro.trialDays
        }-day free trial of the ${selectedBillingPeriod} plan. ${
          willProvideCard
            ? "You'll be asked to provide your payment details, but won't be charged until your trial ends."
            : "You can use basic features without providing payment information."
        }`
      );
      setShowConfirmationModal(true);
      setShowPlanModal(false);
      setIsPlanChangeLoading(false);
      return;
    }

    // For users with an existing plan switching between monthly/annual
    // Update the subscription in Stripe and refresh the user
    try {
      // Call the updateSubscription function with user's customer ID and plan type
      if (
        user &&
        user.profile.customer_id &&
        (selectedBillingPeriod === "monthly" ||
          selectedBillingPeriod === "annual")
      ) {
        // Modified to use just customer_id and plan type
        const { success, error } = await updateSubscription(
          user.profile.customer_id,
          selectedBillingPeriod
        );

        if (!success) {
          throw new Error(error || "Failed to update subscription");
        }

        // Refresh all data after subscription update
        await refreshAllData();

        // Close the plan modal first
        setShowPlanModal(false);

        // Then show appropriate confirmation message based on what changed
        if (
          userSubscription.subscription === "annual" &&
          selectedBillingPeriod === "monthly"
        ) {
          setConfirmationTitle("Plan Change Scheduled");
          setConfirmationMessage(
            `Your plan will be changed to monthly at the end of your current billing period on ${formatDate(
              userSubscription.subscription_expiration
            )}.`
          );
        } else {
          setConfirmationTitle("Plan Updated");
          setConfirmationMessage(
            `Your subscription has been changed to the ${selectedBillingPeriod} plan. The changes will take effect immediately.`
          );
        }

        // Show confirmation modal after plan update completes
        setShowConfirmationModal(true);
      }
    } catch (error) {
      console.error("Error updating subscription:", error);
      // Show error notification
      setConfirmationTitle("Subscription Update Failed");

      // Provide a more user-friendly error message based on the error
      let errorMessage =
        "An unexpected error occurred while updating your subscription.";

      if (error instanceof Error) {
        const errorText = error.message;

        if (errorText.includes("No active subscription found")) {
          errorMessage =
            "We couldn't find an active subscription for your account. Please contact support for assistance.";
        } else if (errorText.includes("billing cycle")) {
          errorMessage =
            "We couldn't change your billing cycle. Please contact support for assistance with changing between monthly and annual plans.";
        } else if (errorText.includes("payment method")) {
          errorMessage =
            "There was an issue with your payment method. Please update your payment information and try again.";
        } else if (
          errorText.includes("permission") ||
          errorText.includes("unauthorized")
        ) {
          errorMessage =
            "You don't have permission to make this change. Please contact support for assistance.";
        } else if (errorText.includes("proration")) {
          errorMessage =
            "There was an issue calculating your bill for the new plan. Please try again later or contact support.";
        } else {
          // If it's a specific error we want to show to the user
          errorMessage = `Failed to update your subscription: ${errorText}`;
        }
      }

      setConfirmationMessage(errorMessage);
      setShowConfirmationModal(true);
      setShowPlanModal(false);
    } finally {
      setIsPlanChangeLoading(false);
    }
  };

  // Define the plan details for Pro tier
  const planOptions: PlanOptions = {
    basic: {
      name: "Cymasphere Basic",
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: "Basic features for casual users",
      features: [
        "Simple Harmony Interface",
        "Basic Voice Leading",
        "Limited Saved Progressions",
        "Standard Sound Library",
        "Community Support",
      ],
    },
    pro: {
      name: "Cymasphere Pro",
      monthlyPrice: 8,
      yearlyPrice: 69,
      lifetimePrice: 199,
      description: "Complete solution for music producers",
      trialDays: 7,
      features: [
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
    },
    team: {
      name: "Cymasphere Team",
      monthlyPrice: 20,
      yearlyPrice: 190,
      description: "Collaborative features for teams",
      features: [
        "All Pro Features",
        "Team Collaboration Tools",
        "Project Sharing",
        "User Management",
        "Team Workspaces",
        "Advanced Analytics",
        "Dedicated Support",
        "Custom Onboarding",
        "API Access",
        "Volume Discounts",
      ],
    },
  };

  // Format the date for display
  const formatDate = (date: string | number | null | undefined) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get the price for the current subscription
  const getCurrentPrice = () => {
    return userSubscription.subscription === "monthly"
      ? monthlyPrice
      : userSubscription.subscription === "annual"
      ? yearlyPrice
      : lifetimePrice;
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

  // Add a new state for tracking the plan change loading state
  const [isPlanChangeLoading, setIsPlanChangeLoading] = useState(false);

  const handleCardToggleChange = (newValue: boolean) => {
    setWillProvideCard(newValue);
  };

  // Update the handleManageBilling function to show loading state
  const handleManageBilling = async () => {
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
        setConfirmationTitle("Error");
        setConfirmationMessage(
          `Failed to access billing portal: ${error || "Unknown error"}`
        );
        setShowConfirmationModal(true);
      }
    } catch (e) {
      // Hide loading spinner on error
      setIsPortalLoading(false);

      console.error("Billing portal error:", e);
      setConfirmationTitle("Error");
      setConfirmationMessage(
        `An error occurred: ${e instanceof Error ? e.message : "Unknown error"}`
      );
      setShowConfirmationModal(true);
    }
  };

  return (
    <BillingContainer>
      {/* Loading overlay */}
      {isPortalLoading && (
        <LoadingOverlay>
          <LoadingComponent size="50px" text="" />
          <SpinnerText>Redirecting to billing portal...</SpinnerText>
        </LoadingOverlay>
      )}

      <SectionTitle>Billing & Subscription</SectionTitle>

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
            You&apos;re currently on a <strong>7-day free trial</strong> with
            full access to all premium features. {daysLeftInTrial} days
            remaining. Your first payment of $
            {isLoadingInvoice ? (
              <span style={{ display: "inline-block", margin: "0 4px" }}>
                <LoadingComponent size="12px" text="" />
              </span>
            ) : upcomingInvoiceAmount !== null ? (
              upcomingInvoiceAmount.toFixed(2)
            ) : (
              getCurrentPrice()
            )}{" "}
            will be on {formatDate(userSubscription.trial_expiration)}.
          </p>
        </AlertBanner>
      )}

      {priceError && (
        <AlertBanner style={{ backgroundColor: "rgba(255, 72, 66, 0.1)" }}>
          <FaTimes />
          <p>{priceError} Showing default prices.</p>
        </AlertBanner>
      )}

      <BillingCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle>
          <FaCrown /> Current Plan
          {userSubscription.subscription !== "none" && (
            <Button
              onClick={handleManageBilling}
              style={{
                marginLeft: "auto",
                fontSize: "0.9rem",
                padding: "0.5rem 1rem",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              Manage Billing{" "}
              <FaExternalLinkAlt
                style={{ color: "white", fontSize: "0.8rem" }}
              />
            </Button>
          )}
        </CardTitle>
        <CardContent>
          <PlanDetails>
            {userSubscription.subscription === "none" ? (
              <>
                <PlanName>No Active Plan</PlanName>
                <PlanDescription>
                  Your subscription is currently inactive. Upgrade to a paid
                  plan to access all features.
                </PlanDescription>
                <Button onClick={handlePlanChange} disabled={isLoadingPrices}>
                  {isLoadingPrices ? (
                    <span>
                      <LoadingComponent size="20px" text="" />
                    </span>
                  ) : (
                    "Choose a Plan"
                  )}
                </Button>
              </>
            ) : (
              <>
                <PlanName>
                  Cymasphere Pro -{" "}
                  {userSubscription.subscription.charAt(0).toUpperCase() +
                    userSubscription.subscription.slice(1)}
                  {shouldShowTrialContent && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "#F96E46",
                        background: "rgba(249, 110, 70, 0.1)",
                        padding: "3px 12px 3px 20px",
                        borderRadius: "10px",
                        marginLeft: "10px",
                      }}
                    >
                      7-day Trial
                    </span>
                  )}
                </PlanName>
                <PlanPrice>
                  {isLoadingPrices ? (
                    <>-</>
                  ) : (
                    <>
                      ${getCurrentPrice()}{" "}
                      <span>
                        {userSubscription.subscription !== "lifetime"
                          ? `/ ${userSubscription.subscription}`
                          : "(one-time payment)"}
                      </span>
                    </>
                  )}
                </PlanPrice>
                <PlanDescription>
                  Complete solution for music producers with full access to all
                  features.
                </PlanDescription>
                {shouldShowTrialContent ? (
                  <BillingInfo>
                    <FaInfoCircle /> Trial ends:{" "}
                    {formatDate(userSubscription.trial_expiration)} (
                    {daysLeftInTrial} days left)
                  </BillingInfo>
                ) : (
                  <BillingInfo>
                    <FaInfoCircle />
                    {userSubscription.subscription === "lifetime"
                      ? "You have lifetime access with free updates for life."
                      : `Next billing date: ${formatDate(
                          userSubscription.subscription_expiration
                        )}`}
                  </BillingInfo>
                )}
                <Button
                  onClick={handlePlanChange}
                  disabled={
                    isLoadingPrices ||
                    userSubscription.subscription === "lifetime"
                  }
                  title={
                    userSubscription.subscription === "lifetime"
                      ? "Lifetime plans cannot be changed"
                      : ""
                  }
                  style={{
                    cursor:
                      userSubscription.subscription === "lifetime"
                        ? "not-allowed"
                        : "pointer",
                    opacity:
                      userSubscription.subscription === "lifetime" ? 0.6 : 1,
                  }}
                >
                  {isLoadingPrices ? (
                    <span>
                      <LoadingComponent size="20px" text="" />
                    </span>
                  ) : shouldShowTrialContent ? (
                    "Choose Plan"
                  ) : userSubscription.subscription === "lifetime" ? (
                    "Lifetime Plan"
                  ) : (
                    "Change Plan"
                  )}
                </Button>
                {userSubscription.subscription === "lifetime" && (
                  <div
                    style={{
                      marginTop: "0.5rem",
                      fontSize: "0.85rem",
                      color: "var(--text-secondary)",
                      opacity: 0.8,
                    }}
                  >
                    Lifetime subscriptions cannot be changed to other plans.
                  </div>
                )}
              </>
            )}
          </PlanDetails>
        </CardContent>
      </BillingCard>

      <BillingCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <CardTitle>
          <FaHistory /> Billing History
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
              <LoadingComponent size="30px" text="Loading invoices..." />
            </div>
          ) : invoiceError ? (
            <div style={{ color: "var(--error)", padding: "1rem 0" }}>
              {invoiceError}
            </div>
          ) : invoices.length === 0 ? (
            <div style={{ color: "var(--text-secondary)", padding: "1rem 0" }}>
              No billing history available.
            </div>
          ) : (
            <InvoicesList>
              {invoices.map((invoice) => (
                <InvoiceItem key={invoice.id}>
                  <InvoiceDate>{formatDate(invoice.created)}</InvoiceDate>
                  <InvoiceAmount>
                    {formatCurrency(invoice.amount, invoice.currency)}
                  </InvoiceAmount>
                  <InvoiceStatus
                    status={invoice.status === "paid" ? "paid" : "unpaid"}
                  >
                    {invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)}
                  </InvoiceStatus>
                  {invoice.receipt_url && (
                    <DownloadButton
                      onClick={() => window.open(invoice.receipt_url, "_blank")}
                    >
                      <FaReceipt /> Receipt
                    </DownloadButton>
                  )}
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
            profile={userSubscription}
            onIntervalChange={handleBillingPeriodChange}
            onConfirm={handleConfirmPlanChange}
            formatDate={formatDate}
            planName="Cymasphere Pro"
            monthlyPrice={monthlyPrice}
            yearlyPrice={yearlyPrice}
            lifetimePrice={lifetimePrice}
            planDescription={planOptions.pro.description}
            trialDays={planOptions.pro.trialDays}
            planFeatures={planOptions.pro.features}
            monthlyDiscount={monthlyDiscount || undefined}
            yearlyDiscount={yearlyDiscount || undefined}
            lifetimeDiscount={lifetimeDiscount || undefined}
            onCardToggleChange={handleCardToggleChange}
            isPlanChangeLoading={isPlanChangeLoading}
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
            onClick={handleConfirmationClose}
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
                <CloseButton onClick={handleConfirmationClose}>
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
                    ? "Continue to Checkout"
                    : confirmationTitle.includes("Error") ||
                      confirmationTitle.includes("Failed")
                    ? "Close"
                    : "Got It"}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </BillingContainer>
  );
}
