/**
 * @fileoverview Admin Promotions Manager — create, edit, and toggle promotional campaigns.
 * @module app/(private)/(admin)/admin/promotions/page
 * @description Lists promotions sorted by date, hides inactive by default, and supports
 * Stripe coupon creation plus banner/pricing configuration.
 */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import styled, { keyframes } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaBullhorn,
  FaPlus,
  FaEdit,
  FaTrash,
  FaToggleOn,
  FaToggleOff,
  FaFire,
  FaCalendarAlt,
  FaDollarSign,
  FaPercent,
  FaSave,
  FaTimes,
  FaCheckCircle,
  FaExclamationTriangle,
  FaEye,
  FaEyeSlash,
  FaEllipsisV,
  FaSync,
  FaStripe,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import LoadingComponent from "@/components/common/LoadingComponent";
import TableLoadingRow from "@/components/common/TableLoadingRow";
import { utcToPSTDate, formatPSTDate } from "@/utils/timezoneUtils";
import { CYMASPHERE_SALE_PRICES_USD } from "@/lib/pricing";

// Types
interface Promotion {
  id: string;
  name: string;
  title: string;
  description: string;
  active: boolean;
  start_date: string | null;
  end_date: string | null;
  applicable_plans: string[];
  discount_type: 'percentage' | 'amount';
  discount_value: number;
  sale_price_monthly: number | null;
  sale_price_annual: number | null;
  sale_price_lifetime: number | null;
  stripe_coupon_code: string;
  stripe_coupon_id: string | null;
  stripe_coupon_created: boolean;
  banner_theme: {
    background: string;
    textColor: string;
    accentColor: string;
  };
  priority: number;
  views: number;
  conversions: number;
  revenue: number;
  created_at: string;
  updated_at: string;
}

const spin = keyframes`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`;

const SpinningIcon = styled(FaSync)`
  animation: ${spin} 1s linear infinite;
`;

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const HeaderContent = styled.div``;

const HeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
  }
`;

/**
 * @brief Toggle control to show or hide inactive promotions in the table.
 */
const InactiveToggle = styled.button<{ $on: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: ${(props) =>
    props.$on ? "rgba(108, 99, 255, 0.15)" : "rgba(255, 255, 255, 0.05)"};
  color: ${(props) => (props.$on ? "var(--primary)" : "var(--text-secondary)")};
  border: 1px solid
    ${(props) =>
      props.$on ? "rgba(108, 99, 255, 0.4)" : "rgba(255, 255, 255, 0.15)"};
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text);
    border-color: rgba(255, 255, 255, 0.3);
  }

  svg {
    font-size: 1rem;
  }
`;

const FilterHint = styled.p`
  margin: -1rem 0 1.25rem;
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: #ffffff;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
`;

const Button = styled.button<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  background: ${props => {
    switch (props.$variant) {
      case 'primary': return 'linear-gradient(135deg, var(--primary), var(--accent))';
      case 'danger': return 'linear-gradient(135deg, #ef4444, #dc2626)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  color: ${props => props.$variant === 'secondary' ? 'var(--text)' : 'white'};
  border: 1px solid ${props => props.$variant === 'secondary' ? 'rgba(255, 255, 255, 0.2)' : 'transparent'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow: hidden;
`;

const Thead = styled.thead`
  background: rgba(108, 99, 255, 0.1);
`;

const Th = styled.th`
  padding: 1rem;
  text-align: left;
  color: var(--text);
  font-weight: 600;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.9rem;

  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
`;

const Tbody = styled.tbody``;

const Tr = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.02);
  }
`;

const Td = styled.td`
  padding: 1rem;
  color: var(--text-secondary);
  font-size: 0.9rem;

  @media (max-width: 768px) {
    padding: 0.75rem 0.5rem;
    font-size: 0.8rem;
  }
`;

/** @brief Dates column — slightly wider so start/end ranges don’t wrap tightly. */
const DatesTh = styled(Th)`
  min-width: 9.5rem;
  white-space: nowrap;
`;

const DatesTd = styled(Td)`
  min-width: 9.5rem;
  white-space: nowrap;
`;

/** @brief Discount column — slightly wider for percentage/amount labels. */
const DiscountTh = styled(Th)`
  min-width: 7.5rem;
  white-space: nowrap;
`;

const DiscountTd = styled(Td)`
  min-width: 7.5rem;
  white-space: nowrap;
`;

/** @brief Coupon column — slightly wider for codes + Stripe status. */
const CouponTh = styled(Th)`
  min-width: 8.5rem;
  white-space: nowrap;
`;

const CouponTd = styled(Td)`
  min-width: 8.5rem;
  white-space: nowrap;
`;

/** @brief Stats column — slightly wider for views/conversions/revenue lines. */
const StatsTh = styled(Th)`
  min-width: 8.5rem;
  white-space: nowrap;
`;

const StatsTd = styled(Td)`
  min-width: 8.5rem;
  white-space: nowrap;
`;

/**
 * @brief Clickable on/off control for promotion active status (icon only).
 */
const StatusToggle = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.25rem;
  margin: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  color: ${(props) => (props.$active ? "#10b981" : "#6b7280")};
  font-size: 1.75rem;
  line-height: 1;
  transition: color 0.2s ease, transform 0.15s ease;

  &:hover:not(:disabled) {
    color: ${(props) => (props.$active ? "#34d399" : "#9ca3af")};
    transform: scale(1.08);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:focus-visible {
    outline: 2px solid ${(props) => (props.$active ? "#10b981" : "#6b7280")};
    outline-offset: 2px;
    border-radius: 4px;
  }
`;

const PriceBadge = styled.span`
  display: inline-block;
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  background: rgba(255, 107, 107, 0.2);
  color: #FF6B6B;
  border: 1px solid rgba(255, 107, 107, 0.3);
`;

const MoreMenuContainer = styled.div`
  position: relative;
  display: inline-flex;
  justify-content: flex-end;
  width: 100%;
`;

const MoreMenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background: transparent;
  border: none;
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.08);
    color: var(--text);
  }

  svg {
    font-size: 1.05rem;
  }
`;

const MoreMenuDropdown = styled(motion.div)<{ $top: number; $right: number }>`
  position: fixed;
  top: ${(props) => props.$top}px;
  right: ${(props) => props.$right}px;
  min-width: 160px;
  background: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.45);
  z-index: 10050;
  overflow: hidden;
  backdrop-filter: blur(10px);
`;

const MoreMenuItem = styled.button<{ $variant?: "danger" }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.75rem 1rem;
  border: none;
  background: none;
  color: ${(props) =>
    props.$variant === "danger" ? "#ef4444" : "var(--text)"};
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${(props) =>
      props.$variant === "danger"
        ? "rgba(239, 68, 68, 0.12)"
        : "rgba(255, 255, 255, 0.06)"};
  }

  svg {
    font-size: 0.85rem;
    width: 1rem;
    flex-shrink: 0;
  }
`;

const Modal = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 1rem;
  overflow-y: auto;
`;

const ModalContent = styled(motion.div)`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  max-width: 800px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ModalTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 1.5rem;
  padding: 0.5rem;
  transition: color 0.2s ease;

  &:hover {
    color: var(--text);
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const FormGroup = styled.div<{ $fullWidth?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  grid-column: ${props => props.$fullWidth ? '1 / -1' : 'auto'};
`;

const Label = styled.label`
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const Input = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Textarea = styled.textarea`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 1rem;
  min-height: 80px;
  resize: vertical;
  font-family: inherit;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.1);
  }

  option {
    background: var(--card-bg);
    color: var(--text);
  }
`;

const CheckboxGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  color: var(--text-secondary);

  input[type="checkbox"] {
    cursor: pointer;
  }
`;

const Alert = styled(motion.div)<{ $type: 'success' | 'error' | 'warning' }>`
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  background: ${props => {
    switch (props.$type) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$type) {
      case 'success': return 'rgba(16, 185, 129, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
    }
  }};
  color: ${props => {
    switch (props.$type) {
      case 'success': return '#10b981';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
    }
  }};

  svg {
    font-size: 1.25rem;
    flex-shrink: 0;
  }
`;

const HelpText = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
  font-style: italic;
`;

const ModalFooter = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  justify-content: flex-end;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  color: var(--text-secondary);

  svg {
    font-size: 4rem;
    margin-bottom: 1rem;
    opacity: 0.3;
  }

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: var(--text);
  }

  p {
    margin-bottom: 1.5rem;
  }
`;

/**
 * @brief Admin page for managing promotional sales campaigns.
 * @returns Promotions manager UI with inactive rows hidden by default.
 */
export default function PromotionsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  /** @brief When false (default), inactive promotions are hidden from the table. */
  const [showInactive, setShowInactive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [promotionToDelete, setPromotionToDelete] = useState<Promotion | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'warning'; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null);
  const [moreMenuPosition, setMoreMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  const visiblePromotions = useMemo(
    () =>
      showInactive
        ? promotions
        : promotions.filter((promotion) => promotion.active),
    [promotions, showInactive],
  );
  const inactiveCount = useMemo(
    () => promotions.filter((promotion) => !promotion.active).length,
    [promotions],
  );

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    description: '',
    active: false,
    start_date: '',
    end_date: '',
    applicable_plans: ['lifetime'] as string[],
    discount_type: 'amount' as 'percentage' | 'amount',
    discount_value: 50,
    stripe_coupon_code: '',
    create_stripe_coupon: true,
    priority: 0,
  });

  const NORMAL_PRICES = CYMASPHERE_SALE_PRICES_USD;

  useEffect(() => {
    loadPromotions();
  }, []);

  useEffect(() => {
    if (!openMoreMenuId) return;

    const closeMenu = () => {
      setOpenMoreMenuId(null);
      setMoreMenuPosition(null);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu();
    };

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);

    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [openMoreMenuId]);

  const loadPromotions = async () => {
    try {
      const response = await fetch('/api/admin/promotions');
      const data = await response.json();

      if (data.success) {
        setPromotions(data.promotions || []);
      }
    } catch (error) {
      console.error('Error loading promotions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      title: '',
      description: '',
      active: false,
      start_date: '',
      end_date: '',
      applicable_plans: ['lifetime'],
      discount_type: 'amount',
      discount_value: 50,
      stripe_coupon_code: '',
      create_stripe_coupon: true,
      priority: 0,
    });
    setShowModal(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setEditingPromotion(promotion);
    
    // Convert UTC dates to PST date format for input (YYYY-MM-DD)
    const formatDateForInput = (dateString: string | null) => {
      if (!dateString) return '';
      return utcToPSTDate(dateString) || '';
    };
    
    // If coupon code exists but coupon wasn't created, allow creating it
    const shouldAllowCouponCreation = promotion.stripe_coupon_code && !promotion.stripe_coupon_created;

    setFormData({
      name: promotion.name,
      title: promotion.title,
      description: promotion.description || '',
      active: promotion.active,
      start_date: formatDateForInput(promotion.start_date),
      end_date: formatDateForInput(promotion.end_date),
      applicable_plans: promotion.applicable_plans,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value,
      stripe_coupon_code: promotion.stripe_coupon_code,
      create_stripe_coupon: Boolean(shouldAllowCouponCreation),
      priority: promotion.priority,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(editingPromotion && { id: editingPromotion.id }),
          ...formData,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Promotion ${editingPromotion ? 'updated' : 'created'} successfully!${data.stripe_coupon_created ? ' Stripe coupon created.' : ''}`,
        });
        setShowModal(false);
        loadPromotions();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to save promotion',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to save promotion',
      });
    } finally {
      setSaving(false);
    }
  };

  /**
   * @brief Opens or closes the row actions menu and anchors it to the trigger.
   * @param promotionId Promotion row id
   * @param event Click event from the more-menu button
   */
  const handleMoreMenuClick = (
    promotionId: string,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    if (openMoreMenuId === promotionId) {
      setOpenMoreMenuId(null);
      setMoreMenuPosition(null);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    setMoreMenuPosition({
      top: rect.bottom + 6,
      right: Math.max(8, window.innerWidth - rect.right),
    });
    setOpenMoreMenuId(promotionId);
  };

  const handleDeleteClick = (promotion: Promotion) => {
    setOpenMoreMenuId(null);
    setMoreMenuPosition(null);
    setPromotionToDelete(promotion);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!promotionToDelete) return;

    setDeleting(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/admin/promotions?id=${promotionToDelete.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage({
          type: 'success',
          text: `Promotion "${promotionToDelete.title}" deleted successfully`,
        });
        setShowDeleteModal(false);
        setPromotionToDelete(null);
        loadPromotions();
      } else {
        setMessage({
          type: 'error',
          text: data.error || 'Failed to delete promotion',
        });
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: 'Failed to delete promotion',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setPromotionToDelete(null);
  };

  const handleToggle = async (promotion: Promotion) => {
    try {
      // Convert UTC dates back to PST date format (YYYY-MM-DD) for the API
      const formatDateForAPI = (isoString: string | null) => {
        if (!isoString) return '';
        return utcToPSTDate(isoString) || '';
      };

      // Only send the fields needed for toggle - preserve all other data
      const response = await fetch('/api/admin/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: promotion.id,
          name: promotion.name,
          title: promotion.title,
          description: promotion.description,
          active: !promotion.active, // Toggle the active status
          start_date: formatDateForAPI(promotion.start_date),
          end_date: formatDateForAPI(promotion.end_date),
          applicable_plans: promotion.applicable_plans,
          discount_type: promotion.discount_type,
          discount_value: promotion.discount_value,
          stripe_coupon_code: promotion.stripe_coupon_code,
          stripe_coupon_id: promotion.stripe_coupon_id,
          stripe_coupon_created: promotion.stripe_coupon_created,
          banner_theme: promotion.banner_theme,
          priority: promotion.priority,
        }),
      });

      const data = await response.json();

      if (data.success) {
        loadPromotions();
      } else {
        console.error('Error toggling promotion:', data.error);
      }
    } catch (error) {
      console.error('Error toggling promotion:', error);
    }
  };

  const calculateSalePrice = (plan: 'monthly' | 'annual' | 'lifetime') => {
    const normalPrice = NORMAL_PRICES[plan];
    if (formData.discount_type === 'percentage') {
      return Math.round(normalPrice * (1 - formData.discount_value / 100));
    } else {
      return normalPrice - formData.discount_value;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No limit';
    // Display dates in PST timezone
    return formatPSTDate(dateString);
  };

  if (!user || !user.is_admin) {
    return <LoadingComponent fullScreen={true} />;
  }

  if (loading) {
    return <LoadingComponent fullScreen={true} />;
  }

  return (
    <Container>
      <Header>
        <HeaderContent>
          <Title>
            <FaBullhorn />
            Promotions Manager
          </Title>
          <Subtitle>
            Manage sales, discounts, and promotional campaigns
          </Subtitle>
        </HeaderContent>
        <HeaderActions>
          <InactiveToggle
            type="button"
            $on={showInactive}
            onClick={() => setShowInactive((prev) => !prev)}
            aria-pressed={showInactive}
            title={
              showInactive
                ? "Hide inactive promotions"
                : "Show inactive promotions"
            }
          >
            {showInactive ? <FaEye /> : <FaEyeSlash />}
            {showInactive
              ? `Showing inactive (${inactiveCount})`
              : `Show inactive (${inactiveCount})`}
          </InactiveToggle>
          <Button $variant="primary" onClick={handleCreate}>
            <FaPlus />
            Create Promotion
          </Button>
        </HeaderActions>
      </Header>

      {!showInactive && inactiveCount > 0 && (
        <FilterHint>
          Hiding {inactiveCount} inactive promotion
          {inactiveCount === 1 ? "" : "s"}. Toggle &quot;Show inactive&quot; to
          view them.
        </FilterHint>
      )}

      {message && (
        <Alert
          $type={message.type}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {message.type === 'success' && <FaCheckCircle />}
          {message.type === 'error' && <FaExclamationTriangle />}
          {message.type === 'warning' && <FaExclamationTriangle />}
          <span>{message.text}</span>
        </Alert>
      )}

      {promotions.length === 0 ? (
        <EmptyState>
          <FaBullhorn />
          <h3>No Promotions Yet</h3>
          <p>Create your first promotional campaign to get started</p>
          <Button $variant="primary" onClick={handleCreate}>
            <FaPlus />
            Create Your First Promotion
          </Button>
        </EmptyState>
      ) : visiblePromotions.length === 0 ? (
        <EmptyState>
          <FaEyeSlash />
          <h3>No Active Promotions</h3>
          <p>
            {inactiveCount} inactive promotion
            {inactiveCount === 1 ? "" : "s"} hidden. Show inactive to manage
            them, or create a new campaign.
          </p>
          <Button $variant="secondary" onClick={() => setShowInactive(true)}>
            <FaEye />
            Show Inactive
          </Button>
        </EmptyState>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Status</Th>
              <Th>Campaign</Th>
              <DiscountTh>Discount</DiscountTh>
              <Th>Sale Price</Th>
              <DatesTh>Dates</DatesTh>
              <CouponTh>Coupon</CouponTh>
              <StatsTh>Stats</StatsTh>
              <Th>Actions</Th>
            </tr>
          </Thead>
          <Tbody>
            {visiblePromotions.map(promotion => (
              <Tr key={promotion.id}>
                <Td>
                  <StatusToggle
                    type="button"
                    $active={promotion.active}
                    onClick={() => handleToggle(promotion)}
                    aria-pressed={promotion.active}
                    aria-label={
                      promotion.active
                        ? `Deactivate ${promotion.title}`
                        : `Activate ${promotion.title}`
                    }
                    title={promotion.active ? "On — click to deactivate" : "Off — click to activate"}
                  >
                    {promotion.active ? <FaToggleOn /> : <FaToggleOff />}
                  </StatusToggle>
                </Td>
                <Td>
                  <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '0.25rem' }}>
                    {promotion.title}
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    {promotion.description}
                  </div>
                </Td>
                <DiscountTd>
                  {promotion.discount_type === 'percentage' 
                    ? `${promotion.discount_value}% OFF`
                    : `$${promotion.discount_value} OFF`
                  }
                </DiscountTd>
                <Td>
                  {promotion.applicable_plans.map(plan => (
                    <PriceBadge key={plan} style={{ marginRight: '0.5rem' }}>
                      {plan}: ${promotion[`sale_price_${plan}` as keyof Promotion] as number}
                    </PriceBadge>
                  ))}
                </Td>
                <DatesTd>
                  <div style={{ fontSize: '0.8rem' }}>
                    {formatDate(promotion.start_date)}
                    <br />
                    to {formatDate(promotion.end_date)}
                  </div>
                </DatesTd>
                <CouponTd>
                  <div style={{ fontSize: '0.8rem' }}>
                    {promotion.stripe_coupon_code}
                    {promotion.stripe_coupon_created && (
                      <div style={{ color: '#10b981', marginTop: '0.25rem' }}>
                        ✓ Created in Stripe
                      </div>
                    )}
                  </div>
                </CouponTd>
                <StatsTd>
                  <div style={{ fontSize: '0.8rem' }}>
                    <div>Views: {promotion.views}</div>
                    <div>Conversions: {promotion.conversions}</div>
                    <div>Revenue: ${promotion.revenue || 0}</div>
                  </div>
                </StatsTd>
                <Td>
                  <MoreMenuContainer onMouseDown={(e) => e.stopPropagation()}>
                    <MoreMenuButton
                      type="button"
                      aria-label={`Actions for ${promotion.title}`}
                      aria-haspopup="menu"
                      aria-expanded={openMoreMenuId === promotion.id}
                      onClick={(e) => handleMoreMenuClick(promotion.id, e)}
                    >
                      <FaEllipsisV />
                    </MoreMenuButton>
                    <AnimatePresence>
                      {openMoreMenuId === promotion.id && moreMenuPosition && (
                        <MoreMenuDropdown
                          role="menu"
                          $top={moreMenuPosition.top}
                          $right={moreMenuPosition.right}
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ duration: 0.12 }}
                          onMouseDown={(e) => e.stopPropagation()}
                        >
                          <MoreMenuItem
                            type="button"
                            role="menuitem"
                            onClick={() => {
                              setOpenMoreMenuId(null);
                              setMoreMenuPosition(null);
                              handleEdit(promotion);
                            }}
                          >
                            <FaEdit />
                            Edit
                          </MoreMenuItem>
                          <MoreMenuItem
                            type="button"
                            role="menuitem"
                            $variant="danger"
                            onClick={() => handleDeleteClick(promotion)}
                          >
                            <FaTrash />
                            Delete
                          </MoreMenuItem>
                        </MoreMenuDropdown>
                      )}
                    </AnimatePresence>
                  </MoreMenuContainer>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {/* Create/Edit Modal */}
      <AnimatePresence mode="wait">
        {showModal && (
          <Modal
            key="edit-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowModal(false)}
          >
            <ModalContent
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>
                  <FaBullhorn />
                  {editingPromotion ? 'Edit Promotion' : 'Create Promotion'}
                </ModalTitle>
                <CloseButton onClick={() => setShowModal(false)}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>

              <FormGrid>
                <FormGroup $fullWidth>
                  <Label>Campaign Name (Internal ID)</Label>
                  <Input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="black_friday_2025"
                    disabled={!!editingPromotion}
                  />
                  <HelpText>Unique identifier (lowercase, underscores only)</HelpText>
                </FormGroup>

                <FormGroup $fullWidth>
                  <Label>
                    <FaFire />
                    Banner Title
                  </Label>
                  <Input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="🔥 Black Friday Sale"
                  />
                </FormGroup>

                <FormGroup $fullWidth>
                  <Label>Banner Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Lifetime access for just $99 - Save $150!"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FaCalendarAlt />
                    Start Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                  />
                  <HelpText>Leave empty for no start date</HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FaCalendarAlt />
                    End Date
                  </Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                  <HelpText>Leave empty for no end date</HelpText>
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FaPercent />
                    Discount Type
                  </Label>
                  <Select
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'percentage' | 'amount' })}
                  >
                    <option value="amount">Fixed Amount ($)</option>
                    <option value="percentage">Percentage (%)</option>
                  </Select>
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FaDollarSign />
                    Discount Value
                  </Label>
                  <Input
                    type="number"
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) })}
                    min="0"
                    max={formData.discount_type === 'percentage' ? 100 : 200}
                  />
                  <HelpText>
                    {formData.discount_type === 'percentage' 
                      ? '% off normal price' 
                      : '$ off normal price'
                    }
                  </HelpText>
                </FormGroup>

                <FormGroup $fullWidth>
                  <Label>Applicable Plans</Label>
                  <CheckboxGroup>
                    {['monthly', 'annual', 'lifetime'].map(plan => (
                      <CheckboxLabel key={plan}>
                        <input
                          type="checkbox"
                          checked={formData.applicable_plans.includes(plan)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                applicable_plans: [...formData.applicable_plans, plan],
                              });
                            } else {
                              setFormData({
                                ...formData,
                                applicable_plans: formData.applicable_plans.filter(p => p !== plan),
                              });
                            }
                          }}
                        />
                        {plan.charAt(0).toUpperCase() + plan.slice(1)}
                      </CheckboxLabel>
                    ))}
                  </CheckboxGroup>
                </FormGroup>

                <FormGroup>
                  <Label>
                    <FaStripe />
                    Stripe Coupon Code
                  </Label>
                  <Input
                    type="text"
                    value={formData.stripe_coupon_code}
                    onChange={(e) => setFormData({ ...formData, stripe_coupon_code: e.target.value })}
                    placeholder="BLACKFRIDAY2025"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Priority</Label>
                  <Input
                    type="number"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: Number(e.target.value) })}
                    min="0"
                  />
                  <HelpText>Higher priority = shown first (if multiple active)</HelpText>
                </FormGroup>

                {formData.stripe_coupon_code && (
                  <FormGroup $fullWidth>
                    <CheckboxLabel>
                      <input
                        type="checkbox"
                        checked={formData.create_stripe_coupon}
                        onChange={(e) => setFormData({ ...formData, create_stripe_coupon: e.target.checked })}
                      />
                      {editingPromotion && editingPromotion.stripe_coupon_created 
                        ? 'Stripe coupon already created' 
                        : 'Auto-create Stripe coupon if it doesn\'t exist'}
                    </CheckboxLabel>
                    {editingPromotion && !editingPromotion.stripe_coupon_created && formData.stripe_coupon_code && (
                      <HelpText style={{ color: '#ffc107', marginTop: '8px' }}>
                        ⚠️ Coupon code exists but Stripe coupon hasn't been created yet. Check the box above to create it.
                      </HelpText>
                    )}
                  </FormGroup>
                )}
              </FormGrid>

              {/* Preview */}
              {formData.applicable_plans.length > 0 && (
                <div style={{ 
                  background: 'rgba(255, 107, 107, 0.05)', 
                  border: '1px solid rgba(255, 107, 107, 0.3)',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginTop: '1rem',
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text)' }}>
                    Sale Prices Preview:
                  </div>
                  {formData.applicable_plans.map(plan => (
                    <div key={plan} style={{ fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                      <strong>{plan.charAt(0).toUpperCase() + plan.slice(1)}:</strong> $
                      {NORMAL_PRICES[plan as keyof typeof NORMAL_PRICES]} → <strong style={{ color: '#FF6B6B' }}>
                        ${calculateSalePrice(plan as 'monthly' | 'annual' | 'lifetime')}
                      </strong>
                    </div>
                  ))}
                  <div style={{ fontSize: '0.85rem', marginTop: '0.5rem', color: 'var(--text-secondary)' }}>
                    Stripe coupon will be <strong>${formData.discount_type === 'amount' ? formData.discount_value : Math.round(NORMAL_PRICES.lifetime * (formData.discount_value / 100))}</strong> off
                  </div>
                </div>
              )}

              <ModalFooter>
                <Button $variant="secondary" onClick={() => setShowModal(false)}>
                  <FaTimes />
                  Cancel
                </Button>
                <Button $variant="primary" onClick={handleSave} disabled={saving || !formData.name || !formData.title}>
                  <FaSave />
                  {saving ? 'Saving...' : editingPromotion ? 'Update' : 'Create'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence mode="wait">
        {showDeleteModal && promotionToDelete && (
          <Modal
            key="delete-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleDeleteCancel}
            >
              <ModalContent
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ maxWidth: '500px' }}
              >
                <ModalHeader>
                  <ModalTitle style={{ color: '#ff5e62', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FaExclamationTriangle />
                    Delete Promotion
                  </ModalTitle>
                  <CloseButton onClick={handleDeleteCancel}>
                    <FaTimes />
                  </CloseButton>
                </ModalHeader>

                <div style={{ padding: '24px' }}>
                  <p style={{ marginBottom: '16px', color: 'var(--text)', fontSize: '16px', lineHeight: '1.6' }}>
                    Are you sure you want to delete this promotion? This action cannot be undone.
                  </p>
                  
                  <div style={{
                    background: 'rgba(255, 94, 98, 0.1)',
                    border: '1px solid rgba(255, 94, 98, 0.3)',
                    borderRadius: '8px',
                    padding: '16px',
                    marginBottom: '24px'
                  }}>
                    <p style={{ margin: 0, fontWeight: 600, color: 'var(--text)', marginBottom: '8px' }}>
                      {promotionToDelete.title}
                    </p>
                    {promotionToDelete.description && (
                      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
                        {promotionToDelete.description}
                      </p>
                    )}
                    <div style={{ marginTop: '12px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Coupon: <strong>{promotionToDelete.stripe_coupon_code || 'N/A'}</strong>
                      </span>
                      {promotionToDelete.stripe_coupon_created && (
                        <span style={{ fontSize: '12px', color: '#ff5e62' }}>
                          ⚠️ Stripe coupon will remain in Stripe
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                    <Button
                      $variant="secondary"
                      onClick={handleDeleteCancel}
                      disabled={deleting}
                      style={{ minWidth: '100px' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      $variant="danger"
                      onClick={handleDeleteConfirm}
                      disabled={deleting}
                      style={{ minWidth: '100px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      {deleting ? (
                        <>
                          <SpinningIcon />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <FaTrash />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </ModalContent>
            </Modal>
          )}
        </AnimatePresence>
      </Container>
    );
  }

