"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaCreditCard,
  FaHeadphones,
  FaCheck,
  FaTimes,
  FaPaperPlane,
  FaLaptop,
  FaExclamationTriangle,
  FaInfoCircle,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { capitalize } from "@/utils/stringUtils";
import { getPrices } from "@/utils/stripe/actions";
import { useRouter } from "next/navigation";
import LoadingComponent from "@/components/common/LoadingComponent";

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

const StatIcon = styled.div`
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

  &:hover {
    color: var(--text);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 20px;
`;

const FormLabel = styled.label`
  display: block;
  margin-bottom: 7px;
  font-size: 0.95rem;
  color: var(--text);
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  font-size: 1rem;
  transition: all 0.2s;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 12px 15px;
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text);
  font-size: 1rem;
  min-height: 120px;
  transition: all 0.2s;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceList = styled.div`
  margin-top: 15px;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);

  &:last-child {
    border-bottom: none;
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;

  svg {
    color: var(--primary);
  }
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceName = styled.span`
  font-weight: 500;
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceLastUsed = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const DeviceCount = styled.div`
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  span {
    color: var(--text-secondary);
  }

  strong {
    color: var(--primary);
  }
`;

function DashboardPage() {
  const { user: userAuth } = useAuth();

  const user = userAuth!;

  const router = useRouter();

  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationTitle, setConfirmationTitle] = useState("");
  const [confirmationMessage, setConfirmationMessage] = useState("");
  const [confirmationIcon, setConfirmationIcon] = useState<"success" | "warning" | "info">("success");
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use actual subscription data from user
  const userSubscription = user.profile;

  // Add state for Stripe prices
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  const [priceError, setPriceError] = useState<string | null>(null);

  // Only keep the monthly price for display purposes
  const [monthlyPrice, setMonthlyPrice] = useState(8);
  const [trialDays] = useState(14);

  // Use actual connected devices if available
  // const connectedDevices = user.profile.connectedDevices || [
  const connectedDevices = [
    { id: 1, name: "MacBook Pro", lastUsed: "Last used 2 hours ago" },
    { id: 2, name: "Studio PC", lastUsed: "Last used yesterday" },
    { id: 3, name: "iPad Pro", lastUsed: "Last used 3 days ago" },
  ];

  const maxDevices = 5;

  // Helper functions
  const formatDate = (date: string | number | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isInTrialPeriod = () => {
    if (!userSubscription.trial_expiration) return false;
    return new Date() < new Date(userSubscription.trial_expiration);
  };

  const getDaysLeftInTrial = () => {
    if (!userSubscription.trial_expiration) return 0;
    const today = new Date();
    const trialEnd = new Date(userSubscription.trial_expiration);
    const diffTime = Number(trialEnd) - Number(today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Navigate to billing page instead of showing modal
  const handlePlanChange = () => {
    router.push("/billing");
  };

  const handleContactInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setContactForm({
      ...contactForm,
      [name]: value,
    });
  };

  const handleContactSubmit = async () => {
    try {
      // Set submitting state
      setIsSubmitting(true);
      
      // Prepare the data for the API request
      const contactData = {
        name: user.profile.first_name + " " + user.profile.last_name,
        email: user.email,
        subject: contactForm.subject,
        message: contactForm.message,
        userId: user.id, // Include user ID for tracking
      };

      // Send the contact form data to our API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contactData),
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Reset form
        setContactForm({
          subject: "",
          message: "",
        });

        // Close modal
        setShowContactModal(false);

        // Show confirmation
        setConfirmationTitle("Message Sent!");
        setConfirmationMessage(
          "Your message has been sent to our support team. We will respond to your inquiry as soon as possible."
        );
        setConfirmationIcon("success");
        setShowConfirmationModal(true);
      } else {
        // Show error message
        setConfirmationTitle("Error");
        setConfirmationMessage(
          `Failed to send message: ${result.error || "Unknown error"}. Please try again.`
        );
        setConfirmationIcon("warning");
        setShowConfirmationModal(true);
      }
    } catch (error) {
      console.error("Contact form error:", error);
      // Show error message
      setConfirmationTitle("Error");
      setConfirmationMessage(
        "An unexpected error occurred. Please try again later."
      );
      setConfirmationIcon("warning");
      setShowConfirmationModal(true);
    } finally {
      // Reset submitting state
      setIsSubmitting(false);
    }
  };

  // Fetch price from Stripe when component mounts
  useEffect(() => {
    async function fetchPrices() {
      try {
        setIsLoadingPrices(true);
        setPriceError(null);

        const { prices, error } = await getPrices();

        if (error) {
          setPriceError(error);
          return;
        }

        // Only update monthly price for dashboard display
        setMonthlyPrice(Math.round(prices.monthly.amount / 100));
      } catch (err) {
        console.error("Error fetching prices:", err);
        setPriceError("Failed to load pricing information");
      } finally {
        setIsLoadingPrices(false);
      }
    }

    fetchPrices();
  }, []);

  const handleModalClose = () => {
    setShowConfirmationModal(false);
  };

  // Function to render confirmation modal icon
  const renderConfirmationIcon = () => {
    switch (confirmationIcon) {
      case "warning":
        return <FaExclamationTriangle style={{ color: "var(--warning)" }} />;
      case "info":
        return <FaInfoCircle style={{ color: "var(--primary)" }} />;
      case "success":
      default:
        return <FaCheck style={{ color: "var(--success)" }} />;
    }
  };

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>
          Welcome back{" "}
          <span>{user.profile.first_name + " " + user.profile.last_name}</span>
        </WelcomeTitle>
        <WelcomeSubtitle>
          {user
            ? "Here's an overview of your CYMASPHERE account"
            : "Please sign in to access your dashboard"}
        </WelcomeSubtitle>
      </WelcomeSection>

      <StatsGrid>
        <StatCard whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <StatHeader>
            <StatTitle>Current Plan</StatTitle>
            <StatIcon color="linear-gradient(90deg, #6c63ff, #4ecdc4)">
              <FaCreditCard />
            </StatIcon>
          </StatHeader>
          <StatValue>{capitalize(userSubscription.subscription)}</StatValue>
          <StatDescription>
            {isInTrialPeriod()
              ? `${getDaysLeftInTrial()} days left in your free trial`
              : "Upgrade to access premium features"}
          </StatDescription>
        </StatCard>

        <StatCard whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <StatHeader>
            <StatTitle>Connected Devices</StatTitle>
            <StatIcon color="linear-gradient(90deg, #FF6B6B, #FF8E53)">
              <FaLaptop />
            </StatIcon>
          </StatHeader>
          <StatValue>
            {connectedDevices.length} / {maxDevices}
          </StatValue>
          <StatDescription>Active device connections</StatDescription>
        </StatCard>

        <StatCard whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <StatHeader>
            <StatTitle>Support</StatTitle>
            <StatIcon color="linear-gradient(90deg, #84fab0, #8fd3f4)">
              <FaHeadphones />
            </StatIcon>
          </StatHeader>
          <StatValue>24/7</StatValue>
          <StatDescription>Premium support available</StatDescription>
        </StatCard>
      </StatsGrid>

      <CardGrid>
        <Card whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          {isInTrialPeriod() && (
            <TrialBadge>{trialDays}-Day Free Trial</TrialBadge>
          )}
          <CardTitle>
            <FaCreditCard /> Subscription
          </CardTitle>
          <CardContent>
            {/* Show price error if there is one */}
            {priceError && (
              <div
                style={{
                  color: "var(--error)",
                  marginBottom: "10px",
                  fontSize: "0.9rem",
                }}
              >
                {priceError} Showing default prices.
              </div>
            )}
            <SubscriptionInfo>
              <InfoLabel>Current Plan</InfoLabel>
              <InfoValue>{capitalize(userSubscription.subscription)}</InfoValue>
            </SubscriptionInfo>
            {isInTrialPeriod() && (
              <SubscriptionInfo>
                <InfoLabel>Trial Status</InfoLabel>
                <InfoValue>{getDaysLeftInTrial()} days remaining</InfoValue>
              </SubscriptionInfo>
            )}
            <SubscriptionInfo>
              <InfoLabel>Renewal Date</InfoLabel>
              <InfoValue>
                {isInTrialPeriod()
                  ? formatDate(userSubscription.trial_expiration)
                  : userSubscription.subscription_expiration
                  ? formatDate(userSubscription.subscription_expiration)
                  : "N/A"}
              </InfoValue>
            </SubscriptionInfo>
            <SubscriptionInfo>
              <InfoLabel>Next Payment</InfoLabel>
              <InfoValue>
                {isInTrialPeriod()
                  ? `$${
                      isLoadingPrices ? "..." : monthlyPrice
                    }.00 on ${formatDate(userSubscription.trial_expiration)}`
                  : "$0.00"}
              </InfoValue>
            </SubscriptionInfo>
            <p>
              {isInTrialPeriod()
                ? `You're currently on a ${trialDays}-day free trial with full access to all premium features. No payment until your trial ends.`
                : "Upgrade to unlock premium features and advanced audio processing capabilities."}
            </p>
          </CardContent>
          <Button onClick={handlePlanChange} disabled={isLoadingPrices}>
            {isLoadingPrices ? (
              <LoadingComponent size="20px" text="" />
            ) : (
              "Manage Subscription"
            )}
          </Button>
        </Card>

        <Card whileHover={{ y: -5, transition: { duration: 0.2 } }}>
          <CardTitle>
            <FaHeadphones /> Support
          </CardTitle>
          <CardContent>
            <p>Need help with your account or have questions?</p>
            <p>
              Our team is ready to assist you with any questions or issues you
              might have.
            </p>
          </CardContent>
          <Button onClick={() => setShowContactModal(true)}>
            Contact Support
          </Button>
        </Card>
      </CardGrid>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmationModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleModalClose}
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
                <CloseButton onClick={handleModalClose}>
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
                  {renderConfirmationIcon()}
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
                <Button onClick={handleModalClose}>Got It</Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Contact Support Modal */}
      <AnimatePresence>
        {showContactModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowContactModal(false)}
          >
            <ModalContent
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: "550px" }}
            >
              <ModalHeader>
                <ModalTitle>Contact Support</ModalTitle>
                <CloseButton onClick={() => setShowContactModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody>
                <FormGroup>
                  <FormLabel>Your Name</FormLabel>
                  <FormInput
                    type="text"
                    value={
                      user.profile.first_name + " " + user.profile.last_name
                    }
                    readOnly
                    style={{
                      backgroundColor: "rgba(40, 40, 60, 0.5)",
                      cursor: "not-allowed",
                    }}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Your Email</FormLabel>
                  <FormInput
                    type="email"
                    value={user.email}
                    readOnly
                    style={{
                      backgroundColor: "rgba(40, 40, 60, 0.5)",
                      cursor: "not-allowed",
                    }}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="subject">Subject</FormLabel>
                  <FormInput
                    type="text"
                    id="subject"
                    name="subject"
                    placeholder="How can we help you?"
                    value={contactForm.subject}
                    onChange={handleContactInputChange}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel htmlFor="message">Message</FormLabel>
                  <FormTextarea
                    id="message"
                    name="message"
                    placeholder="Please describe your issue or question in detail..."
                    value={contactForm.message}
                    onChange={handleContactInputChange}
                  />
                </FormGroup>
              </ModalBody>
              <ModalFooter>
                <Button
                  onClick={() => setShowContactModal(false)}
                  style={{
                    marginRight: "0.5rem",
                    background: "rgba(255, 255, 255, 0.1)",
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleContactSubmit} disabled={isSubmitting}>
                  <FaPaperPlane style={{ marginRight: "0.5rem" }} /> 
                  {isSubmitting ? "Sending..." : "Send Message"}
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </DashboardContainer>
  );
}

export default DashboardPage;
