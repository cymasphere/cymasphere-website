import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import DashboardLayout from './dashboard/DashboardLayout';
import { FaCreditCard, FaHeadphones, FaTimes, FaCheck, FaPaperPlane } from 'react-icons/fa';
import LoadingSpinner from './common/LoadingSpinner';
import EmailVerification from './EmailVerification';
import PlanSelectionModal from './modals/PlanSelectionModal';

const DashboardContainer = styled.div`
  width: 100%;
`;

const WelcomeSection = styled.div`
  margin-bottom: 2rem;
`;

const WelcomeTitle = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  
  span {
    color: var(--primary);
  }
`;

const WelcomeSubtitle = styled.p`
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatTitle = styled.h3`
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: ${props => props.color || 'var(--primary)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  opacity: 0.9;
`;

const StatValue = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const StatDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const Card = styled(motion.div)`
  position: relative;
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CardTitle = styled.h2`
  margin-top: 0;
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  
  svg {
    margin-right: 0.5rem;
    color: var(--primary);
  }
`;

const CardContent = styled.div`
  flex-grow: 1;
  color: var(--text-secondary);
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
  margin-top: 1rem;
  
  &:hover {
    box-shadow: 0 5px 15px rgba(108, 99, 255, 0.4);
    transform: translateY(-2px);
  }
`;

const SubscriptionInfo = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  
  &:last-child {
    border-bottom: none;
  }
`;

const InfoLabel = styled.span`
  color: var(--text-secondary);
`;

const InfoValue = styled.span`
  color: var(--text);
  font-weight: 600;
`;

const LoadingContainer = styled.div`
  width: 100%;
  min-height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;
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

const PlanGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  
  @media (min-width: 768px) {
    grid-template-columns: repeat(3, 1fr);
  }
`;

const PlanCard = styled.div`
  position: relative;
  background-color: ${props => props.active ? 'rgba(108, 99, 255, 0.1)' : 'rgba(30, 30, 46, 0.5)'};
  border: 2px solid ${props => props.active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 10px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    border-color: ${props => props.active ? 'var(--primary)' : 'var(--accent)'};
  }
`;

const PlanHeader = styled.div`
  text-align: center;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const PlanName = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
`;

const PlanPrice = styled.div`
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
  margin: 0;
  flex-grow: 1;
`;

const PlanFeature = styled.li`
  display: flex;
  align-items: flex-start;
  margin-bottom: 0.75rem;
  color: var(--text);
  font-size: 0.9rem;
  
  svg {
    color: var(--primary);
    margin-right: 0.5rem;
    margin-top: 0.2rem;
    flex-shrink: 0;
  }
`;

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

// Add a contact form component
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

const FormTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  background-color: rgba(30, 30, 46, 0.7);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--text);
  font-size: 1rem;
  transition: border-color 0.2s;
  min-height: 120px;
  resize: vertical;
  
  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.2);
  }
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.3);
  }
`;

// Add these styled components near the other styled components
const TrialBadge = styled.div`
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(90deg, #F9C846, #F96E46);
  color: white;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.4rem 0.8rem;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(249, 110, 70, 0.3);
  z-index: 1;
`;

function Dashboard() {
  const { currentUser, userDetails } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [confirmationTitle, setConfirmationTitle] = useState('');
  
  // Add state for contact modal
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  
  // Add trial state
  const [userSubscription, setUserSubscription] = useState({
    interval: 'monthly', // 'monthly', 'yearly', 'lifetime', null (for no plan)
    endDate: new Date(Date.now() + 30*24*60*60*1000), // 30 days from now
    isLifetime: false,
    purchaseDate: new Date(Date.now() - 60*24*60*60*1000), // When lifetime license was purchased (60 days ago example)
    inTrial: true, // Is the user in a trial period
    trialEndDate: new Date(Date.now() + 14*24*60*60*1000), // 14 days from now
  });
  
  // TEMPORARY: Create mock data for demo dashboard when user is not logged in
  const mockUserDetails = {
    displayName: 'Demo User',
    email: 'demo@cymasphere.com',
    subscriptionStatus: 'active',
    subscriptionTier: 'pro',
    subscriptionEndDate: { seconds: (Date.now() + 30*24*60*60*1000)/1000 } // 30 days from now
  };
  
  // Use real user data if available, otherwise use mock data
  const resolvedUserData = (currentUser && userDetails) ? userDetails : mockUserDetails;
  const subscriptionStatus = resolvedUserData.subscriptionStatus || 'free';
  const subscriptionTier = resolvedUserData.subscriptionTier || 'free';
  const subscriptionEndDate = resolvedUserData.subscriptionEndDate 
    ? new Date(resolvedUserData.subscriptionEndDate.seconds * 1000) 
    : null;

  // Define the plan details for Pro tier
  const planOptions = {
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
        "Free Updates"
      ]
    }
  };

  const handlePlanChange = () => {
    setShowPlanModal(true);
  };

  const handleBillingPeriodChange = (interval) => {
    if (interval === 'lifetime' && !userSubscription.isLifetime) {
      // When switching to lifetime, set isLifetime to true
      setUserSubscription(prev => ({
        ...prev, 
        interval,
        isLifetime: true,
        purchaseDate: new Date() // In a real app, this would only be set after purchase
      }));
    } else {
      // For non-lifetime plans
      setUserSubscription(prev => ({
        ...prev, 
        interval,
        isLifetime: false
      }));
    }
  };

  const handleConfirmPlanChange = () => {
    // Logic to update the plan
    console.log(`Changing plan to: ${userSubscription.interval}`);
    
    setShowPlanModal(false);
    setConfirmationTitle('Plan Updated');
    setConfirmationMessage(`Your plan will be changed to: ${userSubscription.interval.charAt(0).toUpperCase() + userSubscription.interval.slice(1)}`);
    setShowConfirmationModal(true);
  };

  const handleModalClose = () => {
    setShowConfirmationModal(false);
  };
  
  // Format the date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Handle contact form submission
  const handleContactSubmit = () => {
    // In a real app, you would send this data to your backend
    console.log('Contact form submitted:', {
      name: resolvedUserData.displayName,
      email: resolvedUserData.email,
      subject: contactForm.subject,
      message: contactForm.message
    });
    
    // Close contact modal
    setShowContactModal(false);
    
    // Show confirmation
    setConfirmationTitle('Message Sent');
    setConfirmationMessage('Thank you for your message. Our support team will get back to you soon.');
    setShowConfirmationModal(true);
    
    // Reset form
    setContactForm({
      name: '',
      email: '',
      subject: '',
      message: ''
    });
  };
  
  // Handle contact input changes
  const handleContactInputChange = (e) => {
    const { name, value } = e.target;
    setContactForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add function to check if user is in trial period
  const isInTrialPeriod = () => {
    return userSubscription.inTrial && new Date() < new Date(userSubscription.trialEndDate);
  };
  
  // Add function to get days left in trial
  const getDaysLeftInTrial = () => {
    if (!userSubscription.inTrial) return 0;
    const today = new Date();
    const trialEnd = new Date(userSubscription.trialEndDate);
    const diffTime = Math.abs(trialEnd - today);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <DashboardContainer>
      <WelcomeSection>
        <WelcomeTitle>
          Welcome{currentUser ? ' back' : ''}, <span>{resolvedUserData?.displayName || 'User'}</span>
        </WelcomeTitle>
        <WelcomeSubtitle>
          {currentUser 
            ? "Here's an overview of your CYMASPHERE account" 
            : "This is a demo dashboard (no login required)"}
        </WelcomeSubtitle>
      </WelcomeSection>
      
      {/* Show email verification banner only for real users */}
      {currentUser && <EmailVerification />}
      
      <StatsGrid>
        <StatCard
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <StatHeader>
            <StatTitle>Current Plan</StatTitle>
            <StatIcon color="linear-gradient(90deg, #6c63ff, #4ecdc4)">
              <FaCreditCard />
            </StatIcon>
          </StatHeader>
          <StatValue>{userSubscription.interval.charAt(0).toUpperCase() + userSubscription.interval.slice(1)}</StatValue>
          <StatDescription>
            {isInTrialPeriod() 
              ? `${getDaysLeftInTrial()} days left in your free trial`
              : "Upgrade to access premium features"}
          </StatDescription>
        </StatCard>
        
        <StatCard
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
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
        <Card
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          {isInTrialPeriod() && (
            <TrialBadge>14-Day Free Trial</TrialBadge>
          )}
          <CardTitle>
            <FaCreditCard /> Subscription
          </CardTitle>
          <CardContent>
            <SubscriptionInfo>
              <InfoLabel>Current Plan</InfoLabel>
              <InfoValue>{userSubscription.interval.charAt(0).toUpperCase() + userSubscription.interval.slice(1)}</InfoValue>
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
                  ? formatDate(userSubscription.trialEndDate) 
                  : userSubscription.endDate 
                    ? formatDate(userSubscription.endDate) 
                    : 'N/A'}
              </InfoValue>
            </SubscriptionInfo>
            <SubscriptionInfo>
              <InfoLabel>Next Payment</InfoLabel>
              <InfoValue>
                {isInTrialPeriod() 
                  ? `$${planOptions.pro.monthlyPrice}.00 on ${formatDate(userSubscription.trialEndDate)}`
                  : "$0.00"}
              </InfoValue>
            </SubscriptionInfo>
            <p>
              {isInTrialPeriod() 
                ? "You're currently on a 14-day free trial with full access to all premium features. No payment until your trial ends." 
                : "Upgrade to unlock premium features and advanced audio processing capabilities."}
            </p>
          </CardContent>
          <Button onClick={handlePlanChange}>
            {isInTrialPeriod() ? "Choose Plan" : "Change Plan"}
          </Button>
        </Card>
        
        <Card
          whileHover={{ y: -5, transition: { duration: 0.2 } }}
        >
          <CardTitle>
            <FaHeadphones /> Support
          </CardTitle>
          <CardContent>
            <p>Need help with your account or have questions?</p>
            <p>Our team is ready to assist you with any questions or issues you might have.</p>
          </CardContent>
          <Button onClick={() => setShowContactModal(true)}>Contact Support</Button>
        </Card>
      </CardGrid>

      {/* Shared Plan Selection Modal */}
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
              style={{ maxWidth: '500px' }}
            >
              <ModalHeader>
                <ModalTitle>{confirmationTitle}</ModalTitle>
                <CloseButton onClick={handleModalClose}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>
              <ModalBody style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
                <div style={{ fontSize: '4rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                  <FaCheck />
                </div>
                <p style={{ fontSize: '1.1rem', color: 'var(--text)', marginBottom: '1.5rem' }}>
                  {confirmationMessage}
                </p>
              </ModalBody>
              <ModalFooter style={{ justifyContent: 'center' }}>
                <Button onClick={handleModalClose}>
                  Got It
                </Button>
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
              style={{ maxWidth: '550px' }}
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
                    value={resolvedUserData.displayName}
                    readOnly
                    style={{ backgroundColor: 'rgba(40, 40, 60, 0.5)', cursor: 'not-allowed' }}
                  />
                </FormGroup>
                
                <FormGroup>
                  <FormLabel>Your Email</FormLabel>
                  <FormInput
                    type="email"
                    value={resolvedUserData.email}
                    readOnly
                    style={{ backgroundColor: 'rgba(40, 40, 60, 0.5)', cursor: 'not-allowed' }}
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
                <Button onClick={() => setShowContactModal(false)} style={{ marginRight: '0.5rem', background: 'rgba(255, 255, 255, 0.1)' }}>
                  Cancel
                </Button>
                <Button onClick={handleContactSubmit}>
                  <FaPaperPlane style={{ marginRight: '0.5rem' }} /> Send Message
                </Button>
              </ModalFooter>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </DashboardContainer>
  );
}

function DashboardWithLayout() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}

export default DashboardWithLayout; 