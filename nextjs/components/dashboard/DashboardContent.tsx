import React, { useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCreditCard,
  FaHeadphones,
  FaCheck,
  FaTimes,
  FaPaperPlane,
  FaLaptop,
} from "react-icons/fa";
import { useAuth } from "../../contexts/NextAuthContext";
import EmailVerification from "../EmailVerification";
import PlanSelectionModal from "../modals/PlanSelectionModal";
import DashboardLayout from "./DashboardLayout";

// Styled components
const DashboardContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 30px 20px;
  }
`;

const WelcomeSection = styled.div`
  margin-bottom: 30px;
`;

const WelcomeTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;

  span {
    background: linear-gradient(90deg, var(--primary), var(--accent));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const WelcomeSubtitle = styled.p`
  font-size: 1.2rem;
  color: var(--text-secondary);

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

interface StatIconProps {
  color?: string;
}

const StatCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 10px;
  padding: 25px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const StatTitle = styled.h3`
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
`;

const StatIcon = styled.div<StatIconProps>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background: ${(props) =>
    props.color || "linear-gradient(90deg, var(--primary), var(--accent))"};
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 10px;
`;

const StatDescription = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 30px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 15px;
  padding: 30px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
`;

const CardTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: var(--primary);
  }
`;

const CardContent = styled.div`
  flex: 1;
  margin-bottom: 20px;

  p {
    margin-bottom: 15px;
    color: var(--text-secondary);
  }
`;

const Button = styled.button`
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 7px 14px rgba(108, 99, 255, 0.2);
  }
`;

const SubscriptionInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-of-type {
    margin-bottom: 20px;
  }
`;

const InfoLabel = styled.span`
  color: var(--text-secondary);
`;

const InfoValue = styled.span`
  font-weight: 500;
`;

const TrialBadge = styled.div`
  position: absolute;
  top: 20px;
  right: -32px;
  background: linear-gradient(90deg, #ffd700, #ffa500);
  color: #1a1a1a;
  padding: 5px 40px;
  font-size: 0.8rem;
  font-weight: 700;
  transform: rotate(45deg);
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 10px;
  width: 100%;
  overflow: hidden;
  max-width: 600px;
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 25px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.3rem;
`;

const ModalBody = styled.div`
  padding: 20px 25px;
  max-height: 70vh;
  overflow-y: auto;
`;

const ModalFooter = styled.div`
  padding: 15px 25px;
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.2rem;
  cursor: pointer;
  transition: color 0.2s;
`;

// Define TypeScript interfaces for the component
interface User {
  name?: string;
  email?: string;
  subscription?: {
    plan: string;
    status: string;
    currentPeriodEnd: string;
    trialEnd?: string;
    billingPeriod: string;
  };
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

interface PlanOption {
  id: string;
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
}

// Mock data for demonstration, updated to match structure in Billing.js
const planOptions: PlanOption[] = [
  {
    id: "starter",
    name: "Starter",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: ["3 Projects", "Basic Analytics", "Community Support"],
  },
  {
    id: "pro",
    name: "Professional",
    monthlyPrice: 19,
    yearlyPrice: 190,
    features: [
      "Unlimited Projects",
      "Advanced Analytics",
      "Priority Support",
      "Custom Exports",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthlyPrice: 49,
    yearlyPrice: 490,
    features: [
      "All Pro Features",
      "Team Collaboration",
      "API Access",
      "Dedicated Account Manager",
    ],
  },
];

function DashboardContent(): JSX.Element {
  const { user } = useAuth();
  const [showPlanModal, setShowPlanModal] = useState<boolean>(false);
  const [selectedBillingPeriod, setSelectedBillingPeriod] = useState<
    "monthly" | "yearly"
  >("monthly");
  const [contactForm, setContactForm] = useState<ContactFormData>({
    name: "",
    email: "",
    message: "",
  });
  const [contactSuccess, setContactSuccess] = useState<boolean>(false);

  const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isInTrialPeriod = (): boolean => {
    if (!user?.subscription?.trialEnd) return false;
    return new Date(user.subscription.trialEnd) > new Date();
  };

  const getDaysLeftInTrial = (): number => {
    if (!user?.subscription?.trialEnd) return 0;
    const trialEnd = new Date(user.subscription.trialEnd);
    const today = new Date();
    const diffTime = trialEnd.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const handlePlanChange = (): void => {
    setShowPlanModal(true);
  };

  const handleBillingPeriodChange = (period: "monthly" | "yearly"): void => {
    setSelectedBillingPeriod(period);
  };

  const handleConfirmPlanChange = (plan: string): void => {
    // Implementation would go here to handle the plan change
    console.log(
      `Changing to ${plan} plan with ${selectedBillingPeriod} billing`
    );

    // In a real application, this would call an API to update the subscription
    // For demonstration purposes, we'll just close the modal
    setShowPlanModal(false);
  };

  const handleModalClose = (): void => {
    setShowPlanModal(false);
  };

  const handleContactInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value } = e.target;
    setContactForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContactSubmit = (): void => {
    // In a real application, this would submit the form data to an API
    console.log("Submitting contact form:", contactForm);

    // Simulate a successful submission
    setTimeout(() => {
      setContactSuccess(true);
      setContactForm({
        name: "",
        email: "",
        message: "",
      });

      // Reset success message after 3 seconds
      setTimeout(() => {
        setContactSuccess(false);
      }, 3000);
    }, 500);
  };

  // Component implementation
  // Render dashboard UI
  return (
    <DashboardContainer>
      {/* Dashboard content implementation */}
    </DashboardContainer>
  );
}

function DashboardWithLayout(): JSX.Element {
  return (
    <DashboardLayout>
      <DashboardContent />
    </DashboardLayout>
  );
}

export default DashboardWithLayout;
