"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCreditCard,
  FaReceipt,
  FaHistory,
  FaTimes,
  FaCheck,
  FaInfoCircle,
  FaCrown,
  FaLock,
  FaGift,
} from "react-icons/fa";
import PlanSelectionModal from "@/components/modals/PlanSelectionModal";

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

const PaymentMethodsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
`;

const PaymentMethod = styled.div`
  display: flex;
  align-items: center;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background-color: rgba(30, 30, 46, 0.5);
`;

const CardIcon = styled.div`
  background: rgba(108, 99, 255, 0.1);
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;

  svg {
    color: var(--primary);
    font-size: 1.5rem;
  }
`;

const CardDetails = styled.div`
  flex: 1;
`;

const CardNumber = styled.div`
  font-size: 1rem;
  font-weight: 600;
  color: var(--text);
`;

const CardExpiry = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
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

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PlanGrid = styled.div`
  width: 100%;
  max-width: 700px;
  margin: 0 auto;
`;

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PlanNameStyled = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
`;

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PlanFeatures = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem 1rem;
  margin: 1.5rem 0;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PlanButton = styled(Button)`
  margin-top: 1.5rem;
  width: 100%;
`;

const ModalFooter = styled.div`
  padding: 1rem 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: flex-end;
`;

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const YearlyInfo = styled.div`
  display: flex;
  align-items: center;
  margin-top: 0.5rem;
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

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const PlanChangeInfo = styled.div`
  display: flex;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 6px;

  svg {
    color: var(--warning);
    margin-right: 0.75rem;
    font-size: 1.2rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }

  p {
    margin: 0;
    font-size: 0.95rem;
    color: var(--text-secondary);
    line-height: 1.5;
  }
`;

// Styled components for the billing toggle from PricingSection
// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BillingToggleContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30px;
`;

interface BillingToggleButtonProps {
  $active: boolean;
}

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const BillingToggleButton = styled.button<BillingToggleButtonProps>`
  background: ${(props) =>
    props.$active
      ? "linear-gradient(135deg, var(--primary), var(--accent))"
      : "transparent"};
  color: ${(props) => (props.$active ? "white" : "var(--text-secondary)")};
  border: ${(props) =>
    props.$active ? "none" : "1px solid rgba(255, 255, 255, 0.2)"};
  border-radius: 30px;
  padding: 8px 16px;
  font-weight: ${(props) => (props.$active ? "600" : "400")};
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 6px;

  &:hover {
    background: ${(props) =>
      props.$active
        ? "linear-gradient(135deg, var(--primary), var(--accent))"
        : "rgba(255, 255, 255, 0.1)"};
    color: ${(props) => (props.$active ? "white" : "var(--text)")};
  }
`;

// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const SaveLabel = styled.span`
  background: linear-gradient(135deg, var(--accent), var(--primary));
  color: white;
  padding: 3px 7px;
  border-radius: 12px;
  font-size: 0.65rem;
  font-weight: 600;
  margin-left: 6px;
`;

// Add a current plan indicator
// Unused in the current implementation but kept for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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

const FormGroup = styled.div`
  margin-bottom: 1.25rem;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text);
  font-size: 0.9rem;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(30, 30, 46, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const InputRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 576px) {
    grid-template-columns: 1fr;
  }
`;

const ErrorMessage = styled.div`
  color: var(--error);
  font-size: 0.8rem;
  margin-top: 0.25rem;
`;

const SecurityNote = styled.div`
  display: flex;
  align-items: center;
  margin-top: 1.5rem;
  padding: 0.75rem;
  background-color: rgba(30, 30, 46, 0.7);
  border-radius: 6px;
  font-size: 0.85rem;
  color: var(--text-secondary);

  svg {
    color: var(--primary);
    margin-right: 0.75rem;
    flex-shrink: 0;
  }
`;

const RemoveButton = styled.button`
  background: none;
  border: none;
  color: var(--error);
  font-size: 0.9rem;
  cursor: pointer;
  margin-left: auto;
  display: flex;
  align-items: center;

  svg {
    margin-right: 0.5rem;
  }

  &:hover {
    text-decoration: underline;
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

interface UserSubscription {
  interval: "monthly" | "yearly" | "lifetime" | null;
  endDate: Date;
  isLifetime: boolean;
  purchaseDate: Date;
  yearlyExpiryDate: null;
  subscriptionFailed: boolean;
  inTrial: boolean;
  trialEndDate: Date;
}

interface PaymentMethod {
  id: string;
  last4: string;
  brand: string;
  expMonth: number;
  expYear: number;
}

interface CardFormData {
  cardNumber: string;
  cardName: string;
  expiryDate: string;
  cvv: string;
}

interface FormErrors {
  cardNumber?: string;
  cardName?: string;
  expiryDate?: string;
  cvv?: string;
  [key: string]: string | undefined;
}

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

export default function BillingPage() {
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationTitle, setConfirmationTitle] = useState("");

  // Mock user subscription data - in a real app, this would come from context/API
  const [userSubscription, setUserSubscription] = useState<UserSubscription>({
    interval: "monthly", // 'monthly', 'yearly', 'lifetime', null (for no plan)
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    isLifetime: false,
    purchaseDate: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // When lifetime license was purchased (60 days ago example)
    // If user is on yearly plan, this would be the date the yearly subscription expires
    yearlyExpiryDate: null,
    subscriptionFailed: false,
    inTrial: true, // Is the user in a trial period
    trialEndDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
  });

  // Mock payment methods
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "pm_1234567890",
      last4: "4242",
      brand: "Visa",
      expMonth: 12,
      expYear: 25,
    },
  ]);

  // Payment method to remove
  const [paymentMethodToRemove, setPaymentMethodToRemove] =
    useState<PaymentMethod | null>(null);

  // Form state for credit card
  const [cardForm, setCardForm] = useState<CardFormData>({
    cardNumber: "",
    cardName: "",
    expiryDate: "",
    cvv: "",
  });

  // Form validation errors
  const [formErrors, setFormErrors] = useState<FormErrors>({});

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
      trialDays: 14, // Added trial days info
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

  const handlePlanChange = () => {
    setShowPlanModal(true);
  };

  const handleBillingPeriodChange = (
    interval: "monthly" | "yearly" | "lifetime"
  ) => {
    if (interval === "lifetime" && !userSubscription.isLifetime) {
      // When switching to lifetime, set isLifetime to true
      setUserSubscription((prev) => ({
        ...prev,
        interval,
        isLifetime: true,
        purchaseDate: new Date(), // In a real app, this would only be set after purchase
      }));
    } else {
      // For non-lifetime plans
      setUserSubscription((prev) => ({
        ...prev,
        interval,
        isLifetime: false,
      }));
    }
  };

  const handleConfirmPlanChange = () => {
    // If user is changing to a more expensive plan (monthly -> yearly -> lifetime)
    const shouldRedirectToCheckout =
      (userSubscription.interval === "monthly" &&
        userSubscription.interval !== "monthly") ||
      (userSubscription.interval === "yearly" &&
        userSubscription.interval !== "yearly" &&
        userSubscription.interval === "lifetime");

    if (shouldRedirectToCheckout) {
      // Show confirmation modal instead of alert
      setConfirmationTitle("Upgrading Your Plan");
      setConfirmationMessage(
        `You're upgrading to the ${userSubscription.interval} plan. You'll be redirected to checkout to complete your purchase.`
      );
      setShowConfirmationModal(true);
      setShowPlanModal(false);
      return;
    }

    // If downgrading from yearly to monthly
    if (userSubscription.interval === "yearly") {
      setConfirmationTitle("Plan Change Scheduled");
      setConfirmationMessage(
        `Your plan will be changed to monthly at the end of your current billing period on ${formatDate(
          userSubscription.endDate
        )}.`
      );
      setShowConfirmationModal(true);
    } else {
      setConfirmationTitle("Plan Updated");
      setConfirmationMessage(
        `Your plan has been changed to ${userSubscription.interval}.`
      );
      setShowConfirmationModal(true);
    }

    setShowPlanModal(false);
  };

  const handleConfirmationClose = () => {
    setShowConfirmationModal(false);

    // If it was an upgrade that required checkout, redirect here
    if (confirmationTitle === "Upgrading Your Plan") {
      // In a real app, you would navigate to checkout
      console.log(
        `Redirecting to checkout for upgrade to ${userSubscription.interval}`
      );
      // router.push('/checkout', { state: { interval: userSubscription.interval, upgrading: true } });
    }
  };

  // Format the date for display
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Get the price for the current subscription
  const getCurrentPrice = () => {
    if (userSubscription.isLifetime) return planOptions.pro.lifetimePrice;
    return userSubscription.interval === "monthly"
      ? planOptions.pro.monthlyPrice
      : planOptions.pro.yearlyPrice;
  };

  // Get the name of the current subscription plan
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getCurrentPlanName = () => {
    if (userSubscription.isLifetime) return "Lifetime Pro";
    return userSubscription.interval === "monthly"
      ? "Monthly Pro"
      : "Yearly Pro";
  };

  const handleAddPaymentMethod = () => {
    setShowPaymentModal(true);
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || "";
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(" ");
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, "").replace(/[^0-9]/gi, "");

    if (v.length > 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }

    return v;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let formattedValue = value;

    if (name === "cardNumber") {
      formattedValue = formatCardNumber(value);
    } else if (name === "expiryDate") {
      formattedValue = formatExpiryDate(value);
    } else if (name === "cvv") {
      formattedValue = value.replace(/\D/g, "");
    }

    setCardForm((prevForm) => ({
      ...prevForm,
      [name]: formattedValue,
    }));

    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        [name]: undefined,
      }));
    }
  };

  const validateCardForm = () => {
    const errors: FormErrors = {};

    if (!cardForm.cardNumber.trim()) {
      errors.cardNumber = "Card number is required";
    } else if (!/^\d{16}$/.test(cardForm.cardNumber.replace(/\s/g, ""))) {
      errors.cardNumber = "Please enter a valid 16-digit card number";
    }

    if (!cardForm.cardName.trim()) {
      errors.cardName = "Cardholder name is required";
    }

    if (!cardForm.expiryDate.trim()) {
      errors.expiryDate = "Expiry date is required";
    } else if (!/^\d{2}\/\d{2}$/.test(cardForm.expiryDate)) {
      errors.expiryDate = "Please use MM/YY format";
    }

    if (!cardForm.cvv.trim()) {
      errors.cvv = "CVV is required";
    } else if (!/^\d{3,4}$/.test(cardForm.cvv)) {
      errors.cvv = "CVV must be 3 or 4 digits";
    }

    return errors;
  };

  const handleSubmitPaymentMethod = () => {
    const errors = validateCardForm();

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // In a real app, you would submit the card details to your payment processor
    // For this demo, we'll just add a mock card and show confirmation

    setConfirmationTitle("Payment Method Added");
    setConfirmationMessage(
      "Your new payment method has been added successfully."
    );
    setShowPaymentModal(false);
    setShowConfirmationModal(true);

    // Reset the form
    setCardForm({
      cardNumber: "",
      cardName: "",
      expiryDate: "",
      cvv: "",
    });
  };

  const handleRemovePaymentMethod = (paymentMethod: PaymentMethod) => {
    setPaymentMethodToRemove(paymentMethod);
    setShowRemoveConfirmModal(true);
  };

  const confirmRemovePaymentMethod = () => {
    // In a real app, you would call an API to remove the payment method
    if (paymentMethodToRemove) {
      setPaymentMethods((prevMethods) =>
        prevMethods.filter((method) => method.id !== paymentMethodToRemove.id)
      );

      setShowRemoveConfirmModal(false);
      setConfirmationTitle("Payment Method Removed");
      setConfirmationMessage(
        "Your payment method has been successfully removed."
      );
      setShowConfirmationModal(true);
    }
  };

  // Toggle subscription failed state (for demo purposes)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const toggleSubscriptionFailed = () => {
    setUserSubscription((prev) => ({
      ...prev,
      subscriptionFailed: !prev.subscriptionFailed,
      interval: prev.subscriptionFailed ? "monthly" : null,
    }));
  };

  // Add function to check if user is in trial period
  const isInTrialPeriod = () => {
    return (
      userSubscription.inTrial &&
      new Date() < new Date(userSubscription.trialEndDate) &&
      !userSubscription.isLifetime
    );
  };

  // Add function to get days left in trial
  const getDaysLeftInTrial = () => {
    if (!userSubscription.inTrial) return 0;
    const today = new Date();
    const trialEnd = new Date(userSubscription.trialEndDate);
    const diffTime = Math.abs(trialEnd.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <BillingContainer>
      <SectionTitle>Billing & Subscription</SectionTitle>

      {isInTrialPeriod() && (
        <AlertBanner
          style={{
            backgroundColor: "rgba(249, 200, 70, 0.1)",
            borderColor: "rgba(249, 200, 70, 0.3)",
            color: "#F96E46",
          }}
        >
          <FaGift />
          <p>
            You&apos;re currently on a <strong>14-day free trial</strong> with
            full access to all premium features.
            {getDaysLeftInTrial()} days remaining. Your first payment of $
            {getCurrentPrice()} will be on{" "}
            {formatDate(userSubscription.trialEndDate)}.
          </p>
        </AlertBanner>
      )}

      {userSubscription.subscriptionFailed && (
        <AlertBanner>
          <FaTimes />
          <p>
            Your subscription payment has failed. Please update your payment
            method to reactivate your subscription and regain access to all
            features.
          </p>
        </AlertBanner>
      )}

      <BillingCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <CardTitle>
          <FaCrown /> Current Plan
        </CardTitle>
        <CardContent>
          <PlanDetails>
            {userSubscription.subscriptionFailed ||
            userSubscription.interval === null ? (
              <>
                <PlanName>No Active Plan</PlanName>
                <PlanDescription>
                  Your subscription is currently inactive. Upgrade to a paid
                  plan to access all features.
                </PlanDescription>
                <Button onClick={handlePlanChange}>Choose a Plan</Button>
              </>
            ) : (
              <>
                <PlanName>
                  Cymasphere Pro -{" "}
                  {userSubscription.isLifetime
                    ? "Lifetime"
                    : userSubscription.interval.charAt(0).toUpperCase() +
                      userSubscription.interval.slice(1)}
                  {isInTrialPeriod() && (
                    <span
                      style={{
                        fontSize: "0.8rem",
                        fontWeight: "bold",
                        color: "#F96E46",
                        background: "rgba(249, 110, 70, 0.1)",
                        padding: "3px 8px",
                        borderRadius: "10px",
                        marginLeft: "10px",
                      }}
                    >
                      Trial
                    </span>
                  )}
                </PlanName>
                <PlanPrice>
                  {userSubscription.isLifetime
                    ? "$199"
                    : `$${getCurrentPrice()} `}
                  {!userSubscription.isLifetime && (
                    <span>/ {userSubscription.interval}</span>
                  )}
                  {userSubscription.isLifetime && <span>Lifetime License</span>}
                </PlanPrice>
                <PlanDescription>
                  Complete solution for music producers with full access to all
                  features.
                </PlanDescription>
                {isInTrialPeriod() ? (
                  <BillingInfo>
                    <FaInfoCircle /> Trial ends:{" "}
                    {formatDate(userSubscription.trialEndDate)} (
                    {getDaysLeftInTrial()} days left)
                  </BillingInfo>
                ) : userSubscription.isLifetime ? (
                  <BillingInfo>
                    <FaInfoCircle /> Purchase date:{" "}
                    {formatDate(userSubscription.purchaseDate)}
                  </BillingInfo>
                ) : (
                  <BillingInfo>
                    <FaInfoCircle /> Next billing date:{" "}
                    {formatDate(userSubscription.endDate)}
                  </BillingInfo>
                )}
                {!userSubscription.isLifetime && (
                  <Button onClick={handlePlanChange}>
                    {isInTrialPeriod() ? "Choose Plan" : "Change Plan"}
                  </Button>
                )}
                {userSubscription.isLifetime && (
                  <Button
                    disabled
                    style={{
                      opacity: 0.5,
                      cursor: "not-allowed",
                      background: "rgba(108, 99, 255, 0.3)",
                    }}
                  >
                    Lifetime License Active
                  </Button>
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
          <FaCreditCard /> Payment Methods
        </CardTitle>
        <CardContent>
          {paymentMethods.length > 0 ? (
            <PaymentMethodsGrid>
              {paymentMethods.map((method) => (
                <PaymentMethod key={method.id}>
                  <CardIcon>
                    <FaCreditCard />
                  </CardIcon>
                  <CardDetails>
                    <CardNumber>•••• •••• •••• {method.last4}</CardNumber>
                    <CardExpiry>
                      Expires {method.expMonth}/{method.expYear}
                    </CardExpiry>
                  </CardDetails>
                  <RemoveButton
                    onClick={() => handleRemovePaymentMethod(method)}
                  >
                    <FaTimes /> Remove
                  </RemoveButton>
                </PaymentMethod>
              ))}
            </PaymentMethodsGrid>
          ) : (
            <div
              style={{ marginBottom: "1rem", color: "var(--text-secondary)" }}
            >
              No payment methods added yet.
            </div>
          )}
          <Button
            style={{ marginTop: "1rem" }}
            onClick={handleAddPaymentMethod}
          >
            Add Payment Method
          </Button>
        </CardContent>
      </BillingCard>

      <BillingCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <CardTitle>
          <FaHistory /> Billing History
        </CardTitle>
        <CardContent>
          <InvoicesList>
            <InvoiceItem>
              <InvoiceDate>March 15, 2023</InvoiceDate>
              <InvoiceAmount>$8.00</InvoiceAmount>
              <InvoiceStatus status="paid">Paid</InvoiceStatus>
              <DownloadButton>
                <FaReceipt /> Receipt
              </DownloadButton>
            </InvoiceItem>
            <InvoiceItem>
              <InvoiceDate>February 15, 2023</InvoiceDate>
              <InvoiceAmount>$8.00</InvoiceAmount>
              <InvoiceStatus status="paid">Paid</InvoiceStatus>
              <DownloadButton>
                <FaReceipt /> Receipt
              </DownloadButton>
            </InvoiceItem>
            <InvoiceItem>
              <InvoiceDate>January 15, 2023</InvoiceDate>
              <InvoiceAmount>$8.00</InvoiceAmount>
              <InvoiceStatus status="paid">Paid</InvoiceStatus>
              <DownloadButton>
                <FaReceipt /> Receipt
              </DownloadButton>
            </InvoiceItem>
          </InvoicesList>
        </CardContent>
      </BillingCard>

      {/* Plan Selection Modal - Updated to use shared component */}
      <AnimatePresence>
        {showPlanModal && (
          <PlanSelectionModal
            isOpen={showPlanModal}
            onClose={() => setShowPlanModal(false)}
            currentSubscription={userSubscription}
            onIntervalChange={handleBillingPeriodChange}
            onConfirm={handleConfirmPlanChange}
            formatDate={formatDate}
            planOptions={planOptions}
          />
        )}
      </AnimatePresence>

      {/* Payment Method Modal */}
      <AnimatePresence>
        {showPaymentModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPaymentModal(false)}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "550px" }}
            >
              <ModalHeader>
                <ModalTitle>Add Payment Method</ModalTitle>
                <CloseButton onClick={() => setShowPaymentModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <FormGroup>
                  <FormLabel htmlFor="cardNumber">Card Number</FormLabel>
                  <FormInput
                    type="tel"
                    inputMode="numeric"
                    id="cardNumber"
                    name="cardNumber"
                    placeholder="1234 5678 9012 3456"
                    value={cardForm.cardNumber}
                    onChange={handleInputChange}
                    maxLength={19}
                    autoComplete="cc-number"
                  />
                  {formErrors.cardNumber && (
                    <ErrorMessage>{formErrors.cardNumber}</ErrorMessage>
                  )}
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="cardName">Cardholder Name</FormLabel>
                  <FormInput
                    type="text"
                    id="cardName"
                    name="cardName"
                    placeholder="John Doe"
                    value={cardForm.cardName}
                    onChange={handleInputChange}
                    autoComplete="cc-name"
                  />
                  {formErrors.cardName && (
                    <ErrorMessage>{formErrors.cardName}</ErrorMessage>
                  )}
                </FormGroup>

                <InputRow>
                  <FormGroup>
                    <FormLabel htmlFor="expiryDate">Expiry Date</FormLabel>
                    <FormInput
                      type="tel"
                      inputMode="numeric"
                      id="expiryDate"
                      name="expiryDate"
                      placeholder="MM/YY"
                      value={cardForm.expiryDate}
                      onChange={handleInputChange}
                      maxLength={5}
                      autoComplete="cc-exp"
                    />
                    {formErrors.expiryDate && (
                      <ErrorMessage>{formErrors.expiryDate}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <FormLabel htmlFor="cvv">CVV</FormLabel>
                    <FormInput
                      type="tel"
                      inputMode="numeric"
                      id="cvv"
                      name="cvv"
                      placeholder="123"
                      value={cardForm.cvv}
                      onChange={handleInputChange}
                      maxLength={4}
                      autoComplete="cc-csc"
                    />
                    {formErrors.cvv && (
                      <ErrorMessage>{formErrors.cvv}</ErrorMessage>
                    )}
                  </FormGroup>
                </InputRow>

                <SecurityNote>
                  <FaLock />
                  <div>
                    Your payment information is securely processed and
                    encrypted. We do not store your full card details on our
                    servers.
                  </div>
                </SecurityNote>
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => setShowPaymentModal(false)}
                  style={{
                    marginRight: "0.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmitPaymentMethod}>
                  Add Payment Method
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Remove Payment Method Confirmation Modal */}
      <AnimatePresence>
        {showRemoveConfirmModal && paymentMethodToRemove && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowRemoveConfirmModal(false)}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "500px" }}
            >
              <ModalHeader>
                <ModalTitle>Remove Payment Method</ModalTitle>
                <CloseButton onClick={() => setShowRemoveConfirmModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody style={{ padding: "1.5rem" }}>
                <p style={{ marginBottom: "1rem" }}>
                  Are you sure you want to remove this payment method?
                </p>
                {paymentMethodToRemove && (
                  <PaymentMethod style={{ marginBottom: "1rem" }}>
                    <CardIcon>
                      <FaCreditCard />
                    </CardIcon>
                    <CardDetails>
                      <CardNumber>
                        •••• •••• •••• {paymentMethodToRemove.last4}
                      </CardNumber>
                      <CardExpiry>
                        Expires {paymentMethodToRemove.expMonth}/
                        {paymentMethodToRemove.expYear}
                      </CardExpiry>
                    </CardDetails>
                  </PaymentMethod>
                )}
                {paymentMethods.length === 1 &&
                  !userSubscription.isLifetime &&
                  userSubscription.interval !== null && (
                    <AlertBanner style={{ marginBottom: "0" }}>
                      <FaInfoCircle />
                      <p>
                        This is your only payment method. Removing it may affect
                        your active subscription. Please add a new payment
                        method before removing this one.
                      </p>
                    </AlertBanner>
                  )}
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => setShowRemoveConfirmModal(false)}
                  style={{
                    marginRight: "0.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={confirmRemovePaymentMethod}
                  style={{ background: "var(--error)" }}
                >
                  Remove
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
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
                    color: "var(--primary)",
                  }}
                >
                  {confirmationTitle.includes("Upgrading") ? (
                    <FaCrown />
                  ) : confirmationTitle.includes("Scheduled") ? (
                    <FaInfoCircle />
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
