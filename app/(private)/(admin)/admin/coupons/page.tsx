"use client";
import React, { useEffect, useState } from "react";
import NextSEO from "@/components/NextSEO";
import { 
  FaTicketAlt, 
  FaPlus,
  FaSearch,
  FaEye,
  FaTrash,
  FaBan,
  FaCopy,
  FaCheck,
  FaExclamationTriangle,
  FaPercent,
  FaDollarSign,
  FaCalendarAlt,
  FaHashtag,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";

import { 
  createOneTimeDiscountCode, 
  listPromotionCodes, 
  deactivatePromotionCode 
} from "@/utils/stripe/actions";

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: var(--primary);
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const ActionsBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 1rem;
`;

const CreateButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 20px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
  }

  svg {
    font-size: 0.9rem;
  }
`;

const CouponsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CouponCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }
`;

const CouponHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CouponCode = styled.div`
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--primary);
  font-family: 'Courier New', monospace;
  background-color: rgba(108, 99, 255, 0.1);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  border: 1px solid rgba(108, 99, 255, 0.2);
`;

const CouponStatus = styled.span<{ $active: boolean }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
  
  ${props => props.$active ? `
    background-color: rgba(46, 204, 113, 0.2);
    color: #2ecc71;
  ` : `
    background-color: rgba(231, 76, 60, 0.2);
    color: #e74c3c;
  `}
`;

const CouponDetails = styled.div`
  margin-bottom: 1rem;
`;

const CouponDetail = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const CouponLabel = styled.span`
  color: var(--text-secondary);
`;

const CouponValue = styled.span`
  color: var(--text);
  font-weight: 500;
`;

const CouponActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  font-weight: 500;
  
  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: rgba(108, 99, 255, 0.1);
          color: var(--primary);
          &:hover {
            background-color: rgba(108, 99, 255, 0.2);
          }
        `;
      case 'danger':
        return `
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          &:hover {
            background-color: rgba(220, 53, 69, 0.2);
          }
        `;
      default:
        return `
          background-color: rgba(255, 255, 255, 0.05);
          color: var(--text-secondary);
          &:hover {
            background-color: rgba(255, 255, 255, 0.1);
            color: var(--text);
          }
        `;
    }
  }}

  svg {
    font-size: 0.7rem;
  }
`;

// Create Coupon Modal Components
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
  z-index: 10000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 1.5rem;
  cursor: pointer;
  transition: color 0.3s ease;

  &:hover {
    color: var(--text);
  }
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const FormLabel = styled.label`
  display: block;
  font-size: 0.9rem;
  color: var(--text);
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

const FormInput = styled.input`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const FormSelect = styled.select`
  width: 100%;
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const SubmitButton = styled.button<{ disabled?: boolean }>`
  width: 100%;
  padding: 12px 20px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  svg {
    font-size: 0.9rem;
  }
`;

const LoadingSpinner = styled.div`
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const Notification = styled(motion.div)<{ type: 'success' | 'error' }>`
  position: fixed;
  top: 20px;
  right: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  color: white;
  font-weight: 500;
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  max-width: 400px;
  
  ${props => props.type === 'success' ? `
    background-color: #2ecc71;
    border: 1px solid #27ae60;
  ` : `
    background-color: #e74c3c;
    border: 1px solid #c0392b;
  `}
  
  svg {
    font-size: 1rem;
  }
`;

interface PromotionCodeData {
  id: string;
  code: string;
  active: boolean;
  coupon: {
    id: string;
    name: string | null;
    percent_off: number | null;
    amount_off: number | null;
    currency: string | null;
  };
  max_redemptions: number | null;
  times_redeemed: number;
  expires_at: number | null;
  created: number;
}

export default function AdminCoupons() {
  const { user } = useAuth();

  const [promotionCodes, setPromotionCodes] = useState<PromotionCodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  
  // Form state
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [couponName, setCouponName] = useState('');
  const [expirationDays, setExpirationDays] = useState('');
  
  // Notification state
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const fetchPromotionCodes = async () => {
    try {
      setLoading(true);
      const result = await listPromotionCodes({ active: true });
      
      if (result.error) {
        setError(result.error);
      } else {
        setPromotionCodes(result.promotionCodes as PromotionCodeData[]);
      }
    } catch (err) {
      console.error("Error fetching promotion codes:", err);
      setError("Failed to load promotion codes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchPromotionCodes();
    }
  }, [user]);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!discountValue) {
      showNotification('error', 'Please enter a discount value');
      return;
    }

    try {
      setCreateLoading(true);
      
      const value = parseFloat(discountValue);
      const options: any = {};
      
      if (customCode) options.code = customCode;
      if (couponName) options.name = couponName;
      if (expirationDays) {
        const expiresAt = Math.floor(Date.now() / 1000) + (parseInt(expirationDays) * 24 * 60 * 60);
        options.expiresAt = expiresAt;
      }
      
      const result = await createOneTimeDiscountCode(
        discountType,
        discountType === 'amount' ? Math.round(value * 100) : value, // Convert dollars to cents for amount
        options
      );
      
      if (result.success) {
        showNotification('success', `Coupon created successfully! Code: ${result.code}`);
        setShowCreateModal(false);
        resetForm();
        fetchPromotionCodes();
      } else {
        showNotification('error', result.error || 'Failed to create coupon');
      }
    } catch (error) {
      showNotification('error', 'An unexpected error occurred');
      console.error('Create coupon error:', error);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeactivateCoupon = async (promotionCodeId: string) => {
    try {
      const result = await deactivatePromotionCode(promotionCodeId);
      
      if (result.success) {
        showNotification('success', 'Coupon deactivated successfully');
        fetchPromotionCodes();
      } else {
        showNotification('error', result.error || 'Failed to deactivate coupon');
      }
    } catch (error) {
      showNotification('error', 'An unexpected error occurred');
      console.error('Deactivate coupon error:', error);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      showNotification('success', 'Code copied to clipboard!');
    } catch (error) {
      showNotification('error', 'Failed to copy code');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const resetForm = () => {
    setDiscountType('percent');
    setDiscountValue('');
    setCustomCode('');
    setCouponName('');
    setExpirationDays('');
  };

  const formatDiscount = (coupon: PromotionCodeData['coupon']) => {
    if (coupon.percent_off) {
      return `${coupon.percent_off}% off`;
    } else if (coupon.amount_off && coupon.currency) {
      return `$${(coupon.amount_off / 100).toFixed(2)} off`;
    }
    return 'Unknown discount';
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const filteredCoupons = promotionCodes.filter(code =>
    code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (code.coupon.name && code.coupon.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Show page immediately - no early returns
  const showContent = user && !loading;

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  return (
    <Container>
      <NextSEO title="Coupon Management - Admin" />
      
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Header>
          <Title>
            <FaTicketAlt />
            {showContent ? "Coupon Management" : "Coupon Management"}
          </Title>
          <Subtitle>{showContent ? "Create and manage discount codes and promotion coupons" : "Create and manage discount codes and promotion coupons"}</Subtitle>
        </Header>

        {showContent && (
          <>

        <ActionsBar>
          <SearchContainer>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search coupons by code or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <CreateButton onClick={() => setShowCreateModal(true)}>
            <FaPlus />
            Create Coupon
          </CreateButton>
        </ActionsBar>

        {error && (
          <div style={{ color: 'var(--error)', textAlign: 'center', padding: '2rem' }}>
            {error}
          </div>
        )}

        <CouponsGrid>
          {filteredCoupons.map((code, index) => (
            <CouponCard
              key={code.id}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              transition={{ delay: index * 0.1 }}
            >
              <CouponHeader>
                <CouponCode>{code.code}</CouponCode>
                <CouponStatus $active={code.active}>
                  {code.active ? 'Active' : 'Inactive'}
                </CouponStatus>
              </CouponHeader>
              
              <CouponDetails>
                <CouponDetail>
                  <CouponLabel>Discount:</CouponLabel>
                  <CouponValue>{formatDiscount(code.coupon)}</CouponValue>
                </CouponDetail>
                <CouponDetail>
                  <CouponLabel>Used:</CouponLabel>
                  <CouponValue>
                    {code.times_redeemed} / {code.max_redemptions || '∞'}
                  </CouponValue>
                </CouponDetail>
                <CouponDetail>
                  <CouponLabel>Created:</CouponLabel>
                  <CouponValue>{formatDate(code.created)}</CouponValue>
                </CouponDetail>
                {code.expires_at && (
                  <CouponDetail>
                    <CouponLabel>Expires:</CouponLabel>
                    <CouponValue>{formatDate(code.expires_at)}</CouponValue>
                  </CouponDetail>
                )}
              </CouponDetails>
              
              <CouponActions>
                <ActionButton
                  variant="primary"
                  onClick={() => handleCopyCode(code.code)}
                >
                  <FaCopy />
                  Copy
                </ActionButton>
                {code.active && (
                  <ActionButton
                    variant="danger"
                    onClick={() => handleDeactivateCoupon(code.id)}
                  >
                    <FaBan />
                    Deactivate
                  </ActionButton>
                )}
              </CouponActions>
            </CouponCard>
          ))}
        </CouponsGrid>

        {filteredCoupons.length === 0 && !loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem' }}>
            {searchTerm ? 'No coupons found matching your search.' : 'No coupons created yet.'}
          </div>
        )}

        {/* Create Coupon Modal */}
        {showCreateModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCreateModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>
                  <FaPlus />
                  Create New Coupon
                </ModalTitle>
                <CloseButton onClick={() => setShowCreateModal(false)}>
                  ×
                </CloseButton>
              </ModalHeader>

              <form onSubmit={handleCreateCoupon}>
                <FormGroup>
                  <FormLabel>Discount Type</FormLabel>
                  <FormSelect
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value as 'percent' | 'amount')}
                  >
                    <option value="percent">Percentage</option>
                    <option value="amount">Fixed Amount</option>
                  </FormSelect>
                </FormGroup>

                <FormRow>
                  <FormGroup>
                    <FormLabel>
                      {discountType === 'percent' ? 'Percentage (%)' : 'Amount ($)'}
                    </FormLabel>
                    <FormInput
                      type="number"
                      step={discountType === 'percent' ? '1' : '0.01'}
                      min="0"
                      max={discountType === 'percent' ? '100' : undefined}
                      placeholder={discountType === 'percent' ? '10' : '5.00'}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      required
                    />
                  </FormGroup>
                  
                  <FormGroup>
                    <FormLabel>Expiration (Days)</FormLabel>
                    <FormInput
                      type="number"
                      min="1"
                      placeholder="30"
                      value={expirationDays}
                      onChange={(e) => setExpirationDays(e.target.value)}
                    />
                  </FormGroup>
                </FormRow>

                <FormGroup>
                  <FormLabel>Custom Code (Optional)</FormLabel>
                  <FormInput
                    type="text"
                    placeholder="SAVE20 (leave empty for auto-generated)"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value.toUpperCase())}
                  />
                </FormGroup>

                <FormGroup>
                  <FormLabel>Coupon Name (Optional)</FormLabel>
                  <FormInput
                    type="text"
                    placeholder="Holiday Sale 2024"
                    value={couponName}
                    onChange={(e) => setCouponName(e.target.value)}
                  />
                </FormGroup>

                <SubmitButton type="submit" disabled={createLoading}>
                  {createLoading ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <FaPlus />
                      Create Coupon
                    </>
                  )}
                </SubmitButton>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Notifications */}
        {notification && (
          <Notification
            type={notification.type}
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            onClick={() => setNotification(null)}
          >
            {notification.type === 'success' ? <FaCheck /> : <FaExclamationTriangle />}
            {notification.message}
          </Notification>
        )}
        </>
        )}
      </motion.div>
    </Container>
  );
} 