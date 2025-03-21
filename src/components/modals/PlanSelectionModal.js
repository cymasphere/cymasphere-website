import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaInfoCircle, FaCrown, FaGift } from 'react-icons/fa';

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

const BillingToggleButton = styled.button`
  background: ${props => props.$active ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'rgba(30, 30, 46, 0.5)'};
  color: ${props => props.$active ? 'white' : 'var(--text)'};
  border: 1px solid ${props => props.$active ? 'transparent' : 'rgba(255, 255, 255, 0.1)'};
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
  background: linear-gradient(90deg, #F9C846, #F96E46);
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
  background: linear-gradient(135deg, rgba(249, 200, 70, 0.1), rgba(249, 110, 70, 0.1));
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
    color: #F96E46;
  }
`;

const PromotionSubtext = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0;
`;

const PlanSelectionModal = ({ 
  isOpen, 
  onClose, 
  currentSubscription,
  onIntervalChange,
  onConfirm,
  formatDate,
  planOptions = {
    pro: {
      name: "Cymasphere Pro",
      monthlyPrice: 8,
      yearlyPrice: 69,
      lifetimePrice: 199,
      description: "Complete solution for music producers",
      trialDays: 14,
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
  }
}) => {
  // Improved body overflow management to prevent memory leaks
  useEffect(() => {
    const originalStyle = window.getComputedStyle(document.body).overflow;
    
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalStyle;
    }
    
    return () => {
      document.body.style.overflow = originalStyle;
    };
  }, [isOpen]);

  // Helper function to format date
  const formatDateHelper = useCallback((date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  if (!isOpen) return null;

  return (
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
          <ModalTitle>Change Your Billing Plan</ModalTitle>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
        </ModalHeader>
        <ModalBody>
          <PromotionBanner>
            <TrialBadge><FaGift /> Limited Time Offer</TrialBadge>
            <PromotionText>Start with a <span>14-day FREE trial</span> on any plan!</PromotionText>
            <PromotionSubtext>Experience all premium features without commitment. No credit card required to start.</PromotionSubtext>
          </PromotionBanner>
          
          {currentSubscription.interval === 'yearly' && (
            <PlanChangeInfo>
              <FaInfoCircle />
              <p>Your subscription is currently billed yearly. If you switch to a monthly plan, the change will take effect after your current billing period ends on {formatDateHelper(currentSubscription.endDate)}.</p>
            </PlanChangeInfo>
          )}
          
          <BillingToggleContainer>                  
            <BillingToggleButton 
              $active={currentSubscription.interval === 'monthly'} 
              onClick={() => onIntervalChange('monthly')}
            >
              Monthly
            </BillingToggleButton>
            
            <BillingToggleButton 
              $active={currentSubscription.interval === 'yearly'} 
              onClick={() => onIntervalChange('yearly')}
            >
              Yearly
              <SaveLabel>Save 25%</SaveLabel>
            </BillingToggleButton>
            
            <BillingToggleButton 
              $active={currentSubscription.interval === 'lifetime'} 
              onClick={() => onIntervalChange('lifetime')}
            >
              Lifetime
              <SaveLabel>Best Value</SaveLabel>
            </BillingToggleButton>
          </BillingToggleContainer>
          
          <PlanGrid>
            <PlanCard style={{ position: 'relative' }}>
              {currentSubscription.interval === (currentSubscription.isLifetime ? "lifetime" : currentSubscription.interval) && (
                <CurrentPlanIndicator>
                  <FaCrown /> Current Plan
                </CurrentPlanIndicator>
              )}
              <PlanHeader>
                <PlanNameStyled>Cymasphere Pro</PlanNameStyled>
                {currentSubscription.interval === 'monthly' && (
                  <PlanPriceStyled>
                    ${planOptions.pro.monthlyPrice} <span>/month</span>
                    <div style={{ fontSize: '0.9rem', marginTop: '5px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      After your 14-day free trial
                    </div>
                    <div style={{ fontSize: '0.9rem', marginTop: '5px', color: 'var(--text-secondary)' }}>
                      {currentSubscription.inTrial 
                        ? `First payment: ${formatDateHelper(currentSubscription.trialEndDate)}`
                        : `Next billing: ${formatDateHelper(currentSubscription.endDate)}`}
                    </div>
                  </PlanPriceStyled>
                )}
                {currentSubscription.interval === 'yearly' && (
                  <PlanPriceStyled>
                    ${planOptions.pro.yearlyPrice} <span>/year</span>
                    <div style={{ fontSize: '1rem', marginTop: '5px' }}>$5.75/month billed annually</div>
                    <div style={{ fontSize: '0.9rem', marginTop: '5px', color: 'var(--primary)', fontWeight: 'bold' }}>
                      After your 14-day free trial
                    </div>
                    <div style={{ fontSize: '0.9rem', marginTop: '5px', color: 'var(--text-secondary)' }}>
                      {currentSubscription.inTrial 
                        ? `First payment: ${formatDateHelper(currentSubscription.trialEndDate)}`
                        : `Next billing: ${formatDateHelper(currentSubscription.endDate)}`}
                    </div>
                  </PlanPriceStyled>
                )}
                {currentSubscription.interval === 'lifetime' && (
                  <PlanPriceStyled>
                    ${planOptions.pro.lifetimePrice}
                    <div style={{ fontSize: '1rem', marginTop: '5px' }}>one-time purchase</div>
                    {currentSubscription.isLifetime && (
                      <div style={{ fontSize: '0.9rem', marginTop: '5px', color: 'var(--text-secondary)' }}>
                        Purchased: {formatDateHelper(currentSubscription.purchaseDate)}
                      </div>
                    )}
                  </PlanPriceStyled>
                )}
                <PlanDescription>Complete solution for music producers</PlanDescription>
              </PlanHeader>
              
              <h4 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>All Plans Include:</h4>
              <PlanFeatures>
                {planOptions.pro.features.map((feature, index) => (
                  <PlanFeature key={index}><FaCheck /> {feature}</PlanFeature>
                ))}
              </PlanFeatures>
            </PlanCard>
          </PlanGrid>
        </ModalBody>
        <ModalFooter>
          <Button onClick={onClose} style={{ marginRight: '0.5rem', background: 'rgba(255, 255, 255, 0.1)' }}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>
            {currentSubscription.inTrial && currentSubscription.interval !== 'lifetime' 
              ? "Choose Plan" 
              : currentSubscription.interval === 'lifetime' 
                ? "Purchase Lifetime License" 
                : "Confirm Change"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default PlanSelectionModal; 