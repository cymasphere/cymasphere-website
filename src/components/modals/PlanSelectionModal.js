import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { motion, AnimatePresence } from 'framer-motion';
import { FaCheck, FaTimes, FaInfoCircle, FaCrown, FaGift } from 'react-icons/fa';

// Modal components
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
  max-width: 800px;
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
  max-height: 80vh;
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

const BillingSelector = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 25px;
  text-align: center;
`;

const BillingToggle = styled.div`
  display: inline-flex;
  background-color: rgba(0, 0, 0, 0.2);
  border-radius: 30px;
  padding: 5px;
  margin-top: 15px;
`;

const BillingOption = styled.button`
  background: ${props => props.active ? 'linear-gradient(90deg, var(--primary), var(--accent))' : 'transparent'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  border: none;
  border-radius: 25px;
  padding: 8px 20px;
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
  
  &:hover {
    color: ${props => !props.active && 'var(--text)'};
  }
`;

const SavingsBadge = styled.span`
  display: inline-block;
  background: linear-gradient(90deg, #00C853, #64DD17);
  color: #1a1a1a;
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 700;
  margin-left: 8px;
`;

const PlansGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PlanCard = styled.div`
  background-color: ${props => props.recommended ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.03)'};
  border: 2px solid ${props => props.recommended ? 'var(--primary)' : 'transparent'};
  border-radius: 10px;
  padding: 25px;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const RecommendedBadge = styled.div`
  position: absolute;
  top: -12px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
`;

const PlanName = styled.h4`
  font-size: 1.3rem;
  margin: 15px 0 5px;
  text-align: center;
`;

const PlanPrice = styled.div`
  text-align: center;
  margin-bottom: 20px;
  
  .amount {
    font-size: 2.5rem;
    font-weight: 700;
    
    .currency {
      font-size: 1.2rem;
      font-weight: 500;
      vertical-align: super;
    }
  }
  
  .period {
    color: var(--text-secondary);
    font-size: 0.9rem;
  }
`;

const FeaturesList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0 0 25px;
  
  li {
    display: flex;
    align-items: center;
    margin-bottom: 10px;
    font-size: 0.95rem;
    
    svg {
      color: #00C853;
      margin-right: 10px;
      flex-shrink: 0;
    }
  }
`;

const SelectButton = styled.button`
  width: 100%;
  background: ${props => props.recommended 
    ? 'linear-gradient(90deg, var(--primary), var(--accent))'
    : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.recommended ? 'white' : 'var(--text)'};
  border: none;
  padding: 12px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: auto;
  
  &:hover {
    background: ${props => props.recommended 
      ? 'linear-gradient(90deg, var(--primary), var(--accent))' 
      : 'rgba(255, 255, 255, 0.15)'};
    transform: translateY(-2px);
  }
`;

const Message = styled.p`
  text-align: center;
  color: var(--text-secondary);
  margin-bottom: 20px;
  font-size: 0.95rem;
`;

function PlanSelectionModal({ 
  isOpen, 
  onClose, 
  currentSubscription, 
  onIntervalChange, 
  onConfirm,
  formatDate,
  planOptions 
}) {
  const [billingInterval, setBillingInterval] = useState('monthly');
  
  const handleIntervalChange = (interval) => {
    setBillingInterval(interval);
    onIntervalChange(interval);
  };
  
  const calculateSavings = (monthlyPrice, yearlyPrice) => {
    const monthlyCost = monthlyPrice * 12;
    const yearlyCost = yearlyPrice;
    const savings = ((monthlyCost - yearlyCost) / monthlyCost) * 100;
    return Math.round(savings);
  };
  
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
              <BillingSelector>
                <div>Save money with annual billing</div>
                <BillingToggle>
                  <BillingOption 
                    active={billingInterval === 'monthly'} 
                    onClick={() => handleIntervalChange('monthly')}
                  >
                    Monthly
                  </BillingOption>
                  <BillingOption 
                    active={billingInterval === 'yearly'} 
                    onClick={() => handleIntervalChange('yearly')}
                  >
                    Yearly
                    {billingInterval === 'yearly' && (
                      <SavingsBadge>Save {calculateSavings(planOptions.pro.monthlyPrice, planOptions.pro.yearlyPrice)}%</SavingsBadge>
                    )}
                  </BillingOption>
                </BillingToggle>
              </BillingSelector>
              
              <PlansGrid>
                {/* Basic Plan */}
                <PlanCard>
                  <PlanName>Basic</PlanName>
                  <PlanPrice>
                    <div className="amount">
                      <span className="currency">$</span>0
                    </div>
                    <div className="period">Free forever</div>
                  </PlanPrice>
                  
                  <FeaturesList>
                    {planOptions.basic.features.map((feature, index) => (
                      <li key={index}>
                        <FaCheck />
                        {feature}
                      </li>
                    ))}
                  </FeaturesList>
                  
                  <SelectButton 
                    onClick={() => onConfirm('basic')}
                  >
                    Select Plan
                  </SelectButton>
                </PlanCard>
                
                {/* Pro Plan */}
                <PlanCard recommended>
                  <RecommendedBadge>Popular</RecommendedBadge>
                  <PlanName>Pro</PlanName>
                  <PlanPrice>
                    <div className="amount">
                      <span className="currency">$</span>
                      {billingInterval === 'monthly' 
                        ? planOptions.pro.monthlyPrice
                        : Math.round(planOptions.pro.yearlyPrice / 12)}
                    </div>
                    <div className="period">
                      per month{billingInterval === 'yearly' && ', billed annually'}
                    </div>
                  </PlanPrice>
                  
                  <FeaturesList>
                    {planOptions.pro.features.map((feature, index) => (
                      <li key={index}>
                        <FaCheck />
                        {feature}
                      </li>
                    ))}
                  </FeaturesList>
                  
                  <SelectButton 
                    recommended
                    onClick={() => onConfirm('pro')}
                  >
                    Select Plan
                  </SelectButton>
                </PlanCard>
                
                {/* Team Plan */}
                <PlanCard>
                  <PlanName>Team</PlanName>
                  <PlanPrice>
                    <div className="amount">
                      <span className="currency">$</span>
                      {billingInterval === 'monthly' 
                        ? planOptions.team.monthlyPrice
                        : Math.round(planOptions.team.yearlyPrice / 12)}
                    </div>
                    <div className="period">
                      per month{billingInterval === 'yearly' && ', billed annually'}
                    </div>
                  </PlanPrice>
                  
                  <FeaturesList>
                    {planOptions.team.features.map((feature, index) => (
                      <li key={index}>
                        <FaCheck />
                        {feature}
                      </li>
                    ))}
                  </FeaturesList>
                  
                  <SelectButton 
                    onClick={() => onConfirm('team')}
                  >
                    Select Plan
                  </SelectButton>
                </PlanCard>
              </PlansGrid>
              
              {currentSubscription?.trialEndDate && (
                <Message>
                  Your free trial ends on {formatDate(currentSubscription.trialEndDate)}. 
                  Choose a plan to continue using all features.
                </Message>
              )}
            </ModalBody>
            
            <ModalFooter>
              <button 
                onClick={onClose}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: 'var(--text)',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </ModalFooter>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
}

export default PlanSelectionModal; 