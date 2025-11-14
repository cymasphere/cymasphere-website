"use client";
import React, { useEffect, useState } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaUsers, 
  FaSearch,
  FaFilter,
  FaEye,
  FaEdit,
  FaEnvelope,
  FaTrash,
  FaCrown,
  FaDownload,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaTimes,
  FaChartLine,
  FaTicketAlt,
  FaEllipsisV,
  FaUserShield,
  FaBan,
  FaUndo,
  FaCheck,
  FaExclamationTriangle,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";
import StatLoadingSpinner from "@/components/common/StatLoadingSpinner";

import TableLoadingRow from "@/components/common/TableLoadingRow";
import { getAllUsersForCRM, UserData } from "@/utils/stripe/admin-analytics";
import { 
  refundPaymentIntent, 
  refundInvoice,
  cancelSubscriptionAdmin,
  reactivateSubscription,
  changeSubscriptionPlan,
  getCustomerSubscriptions,
  getPrices
} from "@/utils/stripe/actions";
import { deleteUserAccount } from "@/utils/stripe/supabase-stripe";

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: var(--error);
  font-size: 1.2rem;
  padding: 2rem;
`;

const StatContent = styled.div`
  text-align: center;
`;

const PaginationEllipsis = styled.span`
  padding: 0.5rem;
  color: var(--text-secondary);
`;

const CRMContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const CRMTitle = styled.h1`
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

const CRMSubtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const StatCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 1.25rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const FiltersSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const FiltersRow = styled.div`
  display: grid;
  grid-template-columns: 1fr auto auto;
  gap: 1rem;
  align-items: end;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const SearchContainer = styled.div`
  position: relative;
`;

const SearchInput = styled.input<{ $isLoading?: boolean }>`
  width: 100%;
  padding: 12px 16px 12px 44px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05) !important;
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
    background-color: rgba(255, 255, 255, 0.05) !important;
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus,
  &:-webkit-autofill:active,
  &:-webkit-autofill-selected {
    -webkit-box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important;
    -webkit-text-fill-color: var(--text) !important;
    background-color: rgba(255, 255, 255, 0.05) !important;
    background-clip: content-box !important;
    caret-color: var(--text) !important;
    transition: background-color 5000s ease-in-out 0s, color 5000s ease-in-out 0s !important;
  }

  &:-moz-autofill,
  &:-moz-autofill:hover,
  &:-moz-autofill:focus {
    background-color: rgba(255, 255, 255, 0.05) !important;
    color: var(--text) !important;
    box-shadow: 0 0 0 1000px rgba(255, 255, 255, 0.05) inset !important;
  }

  &::placeholder {
    color: var(--text-secondary);
  }

  ${props => props.$isLoading && `
    background-color: rgba(255, 255, 255, 0.08) !important;
    border-color: var(--primary);
  `}
`;

const SearchIcon = styled.div<{ $isLoading?: boolean }>`
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 1rem;
  
  ${props => props.$isLoading && `
    color: var(--primary);
    animation: pulse 1.5s ease-in-out infinite;
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
  `}
`;

const FilterSelect = styled.select`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  min-width: 150px;
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

const ExportButton = styled.button`
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

const TableContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  overflow-x: auto;
  overflow-y: visible;
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    overflow-x: auto;
    
    table {
      min-width: 1000px;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  /* Define column widths */
  th:nth-child(1), td:nth-child(1) { width: 200px; } /* Name */
  th:nth-child(2), td:nth-child(2) { width: 220px; } /* Email */
  th:nth-child(3), td:nth-child(3) { width: 140px; } /* Subscription */
  th:nth-child(4), td:nth-child(4) { width: 110px; } /* Join Date */
  th:nth-child(5), td:nth-child(5) { width: 110px; } /* Last Active */
  th:nth-child(6), td:nth-child(6) { width: 120px; } /* Support Tickets */
  th:nth-child(7), td:nth-child(7) { width: 120px; } /* Total Spent */
  th:nth-child(8), td:nth-child(8) { width: 80px; } /* Actions */
`;

const TableHeader = styled.thead`
  background-color: rgba(255, 255, 255, 0.02);
`;

const TableHeaderCell = styled.th`
  padding: 1rem;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  user-select: none;
  transition: background-color 0.2s ease;
  position: relative;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  svg {
    color: var(--text-secondary);
    font-size: 0.8rem;
    margin-left: 0.5rem;
    vertical-align: middle;
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  &:last-child {
    border-bottom: none;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  color: var(--text);
  font-size: 0.9rem;
  vertical-align: middle;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;

  /* Allow wrapping for action buttons */
  &:last-child {
    white-space: normal;
    overflow: visible;
  }
`;

const UserAvatar = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: ${props => props.$color};
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 14px;
  flex-shrink: 0;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserDetails = styled.div`
  display: flex;
  flex-direction: column;
`;

const UserName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const UserEmail = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 200px;
`;

const SubscriptionBadge = styled.span<{ $color: string; $variant?: 'default' | 'premium' }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
    
  background-color: ${props => props.$color};
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  ${props => props.$variant === 'premium' && `
    background: linear-gradient(135deg, ${props.$color}, ${props.$color}dd);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
  `}

  svg {
    font-size: 0.7rem;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
`;

const SupportTicketsCount = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
`;

const TicketBadge = styled.span<{ $count: number }>`
  background-color: ${props => props.$count > 0 ? '#e74c3c' : '#95a5a6'};
  color: white;
  border-radius: 12px;
  padding: 2px 8px;
  font-size: 0.75rem;
  font-weight: 600;
  min-width: 20px;
  text-align: center;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  
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
    font-size: 0.8rem;
  }
`;

const Pagination = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const PaginationInfo = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const SearchLoadingSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(108, 99, 255, 0.3);
  border-top: 2px solid var(--primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

const PaginationButton = styled.button<{ $active?: boolean }>`
  padding: 0.5rem 1rem;
  margin: 0 0.25rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background-color: ${props => props.$active ? 'var(--primary)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text)'};
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    background-color: var(--primary);
    color: white;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
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

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
`;

const MobileFooterSection = styled.div`
  width: 80%;
  max-width: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

// User Detail Modal Components
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
  max-width: 1000px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
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

const ModalSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const InfoItem = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const InfoLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 0.5rem;
`;

const InfoValue = styled.div`
  font-size: 1rem;
  color: var(--text);
  font-weight: 500;
`;

const DataTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
`;

const DataTableHeader = styled.thead`
  background-color: rgba(255, 255, 255, 0.02);
`;

const DataTableHeaderCell = styled.th`
  padding: 0.75rem;
  text-align: left;
  font-size: 0.9rem;
  color: var(--text-secondary);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const DataTableBody = styled.tbody``;

const DataTableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }
`;

const DataTableCell = styled.td`
  padding: 0.75rem;
  font-size: 0.9rem;
  color: var(--text);
`;

const StatusBadge = styled.span<{ $status: string }>`
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: capitalize;
  background-color: ${({ $status }) => {
    switch ($status) {
      case 'active':
      case 'succeeded':
      case 'paid':
        return 'rgba(46, 204, 113, 0.2)';
      case 'canceled':
      case 'failed':
        return 'rgba(231, 76, 60, 0.2)';
      case 'pending':
      case 'processing':
        return 'rgba(241, 196, 15, 0.2)';
      default:
        return 'rgba(149, 165, 166, 0.2)';
    }
  }};
  color: ${({ $status }) => {
    switch ($status) {
      case 'active':
      case 'succeeded':
      case 'paid':
        return '#2ecc71';
      case 'canceled':
      case 'failed':
        return '#e74c3c';
      case 'pending':
      case 'processing':
        return '#f1c40f';
      default:
        return '#95a5a6';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 2rem;
  color: var(--text-secondary);
  font-style: italic;
`;

// More Menu Components
const MoreMenuContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const MoreMenuButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }

  svg {
    font-size: 1rem;
  }
`;

const MoreMenuDropdown = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  z-index: 10000;
  min-width: 160px;
  overflow: hidden;
  margin-top: 4px;
`;

const MoreMenuItem = styled.button<{ variant?: 'danger' }>`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: ${props => props.variant === 'danger' ? '#e74c3c' : 'var(--text)'};
  text-align: left;
  cursor: pointer;
  transition: background-color 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.9rem;

  &:hover {
    background-color: ${props => props.variant === 'danger' ? 'rgba(231, 76, 60, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  }

  svg {
    font-size: 0.8rem;
    width: 16px;
  }
`;

// Refund Components
const RefundButton = styled.button<{ variant?: 'primary' | 'danger'; disabled?: boolean }>`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.disabled && `
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  `}
  
  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
          &:hover:not(:disabled) {
            background-color: rgba(220, 53, 69, 0.2);
          }
        `;
      default:
        return `
          background-color: rgba(108, 99, 255, 0.1);
          color: var(--primary);
          border: 1px solid rgba(108, 99, 255, 0.2);
          &:hover:not(:disabled) {
            background-color: rgba(108, 99, 255, 0.2);
          }
        `;
    }
  }}

  svg {
    font-size: 0.7rem;
  }
`;

const RefundNotification = styled(motion.div)<{ type: 'success' | 'error' }>`
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

const LoadingSpinner = styled.div`
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Confirmation Modal Components
const ConfirmationModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10002;
  padding: 20px;
`;

const ConfirmationModalContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const ConfirmationTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
`;

const ConfirmationMessage = styled.p`
  font-size: 1rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
  line-height: 1.5;
`;

const ConfirmationDetails = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ConfirmationDetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const ConfirmationDetailLabel = styled.span`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const ConfirmationDetailValue = styled.span`
  font-size: 0.9rem;
  color: var(--text);
  font-weight: 500;
`;

const ConfirmationButtons = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ConfirmationButton = styled.button<{ variant: 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 120px;
  justify-content: center;
  
  ${props => props.variant === 'danger' ? `
    background-color: #dc3545;
    color: white;
    &:hover:not(:disabled) {
      background-color: #c82333;
      transform: translateY(-1px);
    }
  ` : `
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text);
    border: 1px solid rgba(255, 255, 255, 0.2);
    &:hover:not(:disabled) {
      background-color: rgba(255, 255, 255, 0.15);
    }
  `}
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 0.9rem;
  }
`;

export default function AdminCRM() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [previousSearchTerm, setPreviousSearchTerm] = useState("");
  const [subscriptionFilter, setSubscriptionFilter] = useState("all");
  const [sortField, setSortField] = useState<keyof UserData>("createdAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const usersPerPage = 10;
  
  // Modal state
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // More menu state
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);

  // Refund state
  const [refundLoading, setRefundLoading] = useState<string | null>(null);
  const [refundSuccess, setRefundSuccess] = useState<string | null>(null);
  const [refundError, setRefundError] = useState<string | null>(null);

  // Confirmation modal state
  const [showRefundConfirmation, setShowRefundConfirmation] = useState(false);
  const [refundConfirmationData, setRefundConfirmationData] = useState<{
    id: string;
    type: 'purchase' | 'invoice';
    amount: number;
    description: string;
  } | null>(null);

  // Subscription management state
  const [subscriptionLoading, setSubscriptionLoading] = useState<string | null>(null);
  const [subscriptionSuccess, setSubscriptionSuccess] = useState<string | null>(null);
  const [subscriptionError, setSubscriptionError] = useState<string | null>(null);
  const [availablePlans, setAvailablePlans] = useState<any>(null);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [newPlanType, setNewPlanType] = useState<'monthly' | 'annual'>('monthly');

  // Delete user state
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [deleteConfirmationData, setDeleteConfirmationData] = useState<{
    userId: string;
    userName: string;
    userEmail: string;
  } | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      // Reset to first page when search changes
      if (searchTerm !== debouncedSearchTerm) {
        setCurrentPage(1);
      }
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchTerm, debouncedSearchTerm]);

  const fetchUsers = async (isSearchOperation = false) => {
    try {
      if (isSearchOperation) {
        setSearchLoading(true);
      } else {
      setLoading(true);
      }
      
      const result = await getAllUsersForCRM(
        currentPage,
        usersPerPage,
        debouncedSearchTerm || undefined,
        subscriptionFilter
      );
      
      // Sort the users locally since the API doesn't handle sorting yet
      const sortedUsers = [...result.users].sort((a, b) => {
        const aValue = a[sortField];
        const bValue = b[sortField];
        
        if (aValue === undefined) return 1;
        if (bValue === undefined) return -1;
        
        if (typeof aValue === "string" && typeof bValue === "string") {
          const comparison = aValue.localeCompare(bValue);
          return sortDirection === "asc" ? comparison : -comparison;
        }
        
        if (typeof aValue === "number" && typeof bValue === "number") {
          const comparison = aValue - bValue;
          return sortDirection === "asc" ? comparison : -comparison;
        }
        
        return 0;
      });

      setUsers(sortedUsers);
      setTotalPages(result.totalPages);
      setTotalCount(result.totalCount);
    } catch (err) {
      console.error("Error fetching users:", err);
      setError("Failed to load user data");
    } finally {
      if (isSearchOperation) {
        setSearchLoading(false);
      } else {
      setLoading(false);
      }
    }
  };

  useEffect(() => {
    // Only fetch users if we have a user and language is loaded
    if (user && !languageLoading) {
      // Determine if this is a search operation by checking if search term changed
      const isSearchOperation = debouncedSearchTerm !== previousSearchTerm;
      
      fetchUsers(isSearchOperation);
      
      // Update previous search term
      setPreviousSearchTerm(debouncedSearchTerm);
    }
  }, [currentPage, debouncedSearchTerm, subscriptionFilter, sortField, sortDirection, user, languageLoading]);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      // Only close if clicking outside of any more menu container
      if (!target.closest('[data-more-menu]')) {
        setOpenMoreMenu(null);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleSort = (field: keyof UserData) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof UserData) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === "asc" ? <FaSortUp /> : <FaSortDown />;
  };

  const getSubscriptionBadgeColor = (subscription: string) => {
    switch (subscription) {
      case "monthly":
        return "#4c46d6"; // Darker purple
      case "annual":
        return "#2d8a7a"; // Darker teal
      case "lifetime":
        return "#d4a017"; // Darker gold
      case "admin":
        return "#d63447"; // Darker red
      default:
        return "#6c757d"; // Darker gray
    }
  };

  const getSubscriptionIcon = (subscription: string) => {
    switch (subscription) {
      case "admin":
        return <FaUserShield />;
      case "lifetime":
        return <FaCrown />;
      default:
        return null;
    }
  };

  const isSubscriptionPremium = (subscription: string) => {
    return ["lifetime", "admin"].includes(subscription);
  };

  // Mock function to get support ticket count for a user
  const getSupportTicketCount = (userId: string) => {
    // This would normally come from your database
    const mockCounts = [0, 1, 2, 3, 5];
    const hash = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return mockCounts[hash % mockCounts.length];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getDisplayName = (user: UserData) => {
    if (user.firstName && user.lastName && user.firstName.trim() && user.lastName.trim()) {
      return `${user.firstName.trim()} ${user.lastName.trim()}`;
    }
    if (user.email && user.email.includes("@")) {
      return user.email.split("@")[0];
    }
    return "Unknown User";
  };

  const getInitials = (user: UserData) => {
    if (user.firstName && user.lastName && user.firstName.length > 0 && user.lastName.length > 0) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.email && user.email.length > 0) {
      return user.email[0].toUpperCase();
    }
    return "?";
  };

  const getAvatarColor = (email: string) => {
    const colors = [
      "#6c63ff", "#4ecdc4", "#ffd93d", "#ff6b6b", "#95a5a6",
      "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6"
    ];
    if (!email || email.length === 0) {
      return colors[0]; // Default to first color
    }
    const index = email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  const closeModal = () => {
    setShowUserModal(false);
    setSelectedUser(null);
  };

  // Mock detailed data for demonstration
  const getMockUserDetails = (user: UserData) => {
    const mockSubscriptions = user.subscription !== "none" ? [
      {
        id: `sub_${user.id.slice(0, 8)}`,
        status: "active",
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
        priceId: `price_${user.subscription}`,
        amount: user.subscription === "monthly" ? 0 : user.subscription === "annual" ? 0 : 0,
        interval: user.subscription === "monthly" ? "month" : user.subscription === "annual" ? "year" : "lifetime",
      }
    ] : [];

    const mockPurchases = user.totalSpent > 0 ? [
      {
        id: `pi_${user.id.slice(0, 8)}`,
        amount: user.totalSpent,
        status: "succeeded",
        createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        description: user.subscription === "lifetime" ? "Lifetime Access Purchase" : "One-time purchase",
      }
    ] : [];

    const mockInvoices = user.subscription !== "none" ? [
      {
        id: `in_${user.id.slice(0, 8)}`,
        number: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
        amount: user.subscription === "monthly" ? 0 : user.subscription === "annual" ? 0 : 0,
        status: "paid",
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        paidAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000).toISOString(),
        dueDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: `${user.subscription.charAt(0).toUpperCase() + user.subscription.slice(1)} subscription`,
      }
    ] : [];

    return {
      subscriptions: mockSubscriptions,
      purchases: mockPurchases,
      invoices: mockInvoices,
    };
  };

  const handleMoreMenuClick = (userId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMoreMenu(openMoreMenu === userId ? null : userId);
  };

  const handleMoreMenuAction = (action: string, user: UserData) => {
    setOpenMoreMenu(null);
    
    switch (action) {
      case 'view':
        handleViewUser(user);
        break;
      case 'edit':
        console.log('Edit user:', user.id);
        break;
      case 'email':
        console.log('Send email to:', user.email);
        break;
      case 'ban':
        console.log('Ban user:', user.id);
        break;
      case 'delete':
        setDeleteConfirmationData({
          userId: user.id,
          userName: getDisplayName(user),
          userEmail: user.email,
        });
        setShowDeleteConfirmation(true);
        break;
    }
  };

  // Refund handlers
  const showRefundConfirmationDialog = (id: string, type: 'purchase' | 'invoice', amount: number, description: string) => {
    setRefundConfirmationData({ id, type, amount, description });
    setShowRefundConfirmation(true);
  };

  const handleConfirmRefund = async () => {
    if (!refundConfirmationData) return;

    const { id, type, amount } = refundConfirmationData;
    
    try {
      setRefundLoading(id);
      setRefundError(null);
      setRefundSuccess(null);
      setShowRefundConfirmation(false);
      setRefundConfirmationData(null);

      let result;
      if (type === 'purchase') {
        result = await refundPaymentIntent(id);
      } else {
        result = await refundInvoice(id);
      }
      
      if (result.success) {
        setRefundSuccess(id);
        // Refresh user data to show updated information
        fetchUsers();
      } else {
        setRefundError(result.error || 'Failed to process refund');
      }
    } catch (error) {
      setRefundError('An unexpected error occurred');
      console.error('Refund error:', error);
    } finally {
      setRefundLoading(null);
    }
  };

  const handleCancelRefund = () => {
    setShowRefundConfirmation(false);
    setRefundConfirmationData(null);
  };

  const handleRefundPurchase = (purchaseId: string, amount: number, description: string) => {
    showRefundConfirmationDialog(purchaseId, 'purchase', amount, description);
  };

  const handleRefundInvoiceClick = (invoiceId: string, amount: number, description: string) => {
    showRefundConfirmationDialog(invoiceId, 'invoice', amount, description);
  };

  const clearRefundMessages = () => {
    setRefundSuccess(null);
    setRefundError(null);
  };

  // Delete user handlers
  const handleConfirmDelete = async () => {
    if (!deleteConfirmationData) return;

    const { userId } = deleteConfirmationData;
    
    try {
      setDeleteLoading(userId);
      setDeleteError(null);
      setDeleteSuccess(null);
      setShowDeleteConfirmation(false);

      const result = await deleteUserAccount(userId);
      
      if (result.success) {
        setDeleteSuccess(userId);
        // Refresh user data to remove deleted user
        fetchUsers();
        // Clear confirmation data after a delay
        setTimeout(() => {
          setDeleteConfirmationData(null);
        }, 2000);
      } else {
        setDeleteError(result.error || 'Failed to delete user');
        setShowDeleteConfirmation(true); // Keep modal open on error
      }
    } catch (error) {
      setDeleteError('An unexpected error occurred');
      console.error('Delete user error:', error);
      setShowDeleteConfirmation(true); // Keep modal open on error
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setDeleteConfirmationData(null);
  };

  const clearDeleteMessages = () => {
    setDeleteSuccess(null);
    setDeleteError(null);
  };

  // Auto-dismiss refund notifications
  useEffect(() => {
    if (refundSuccess) {
      const timer = setTimeout(() => {
        setRefundSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [refundSuccess]);

  useEffect(() => {
    if (refundError) {
      const timer = setTimeout(() => {
        setRefundError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [refundError]);

  // Auto-dismiss delete notifications
  useEffect(() => {
    if (deleteSuccess) {
      const timer = setTimeout(() => {
        setDeleteSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteSuccess]);

  useEffect(() => {
    if (deleteError) {
      const timer = setTimeout(() => {
        setDeleteError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [deleteError]);

  // Show page immediately - no early returns
  const showContent = !languageLoading && user;

  // Temporarily disabled admin check for testing
  // if (user.profile?.subscription !== "admin") {
  //   return null;
  // }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  return (
    <Container>
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Header>
          <Title>
            <FaUsers />
            {showContent ? t("admin.usersPage.title", "Users Management") : "Users Management"}
          </Title>
          <Subtitle>{showContent ? t("admin.usersPage.subtitle", "Manage users, subscriptions, purchases, and invoices") : "Manage users, subscriptions, purchases, and invoices"}</Subtitle>
        </Header>

        {showContent && (
          <>

        <StatsGrid>
          <StatCard variants={fadeIn}>
            <StatContent>
              <StatValue>{loading ? <StatLoadingSpinner size={20} /> : totalCount}</StatValue>
              <StatLabel>Total Users</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard variants={fadeIn}>
            <StatContent>
              <StatValue>{loading ? <StatLoadingSpinner size={20} /> : users.filter(u => u.subscription !== "none").length}</StatValue>
              <StatLabel>Paid Users</StatLabel>
            </StatContent>
          </StatCard>
          <StatCard variants={fadeIn}>
            <StatContent>
              <StatValue>
                {loading ? <StatLoadingSpinner size={20} /> : formatCurrency(users.reduce((sum, u) => sum + u.totalSpent, 0))}
              </StatValue>
              <StatLabel>Total Revenue</StatLabel>
            </StatContent>
          </StatCard>
        </StatsGrid>

        <FiltersSection>
          <FiltersRow>
            <SearchContainer>
              <SearchIcon $isLoading={searchLoading}>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="search"
                placeholder={searchLoading ? "Loading..." : t("admin.crmPage.searchPlaceholder", "Search users by name, email, or ID...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                $isLoading={searchLoading}
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck="false"
                data-lpignore="true"
                data-form-type="other"
              />
            </SearchContainer>
            
            <FilterSelect
              value={subscriptionFilter}
              onChange={(e) => setSubscriptionFilter(e.target.value)}
            >
              <option value="all">{t("admin.crmPage.filters.all", "All Users")}</option>
              <option value="none">{t("admin.crmPage.filters.free", "Free Users")}</option>
              <option value="monthly">{t("admin.crmPage.filters.monthly", "Monthly Subscribers")}</option>
              <option value="annual">{t("admin.crmPage.filters.annual", "Annual Subscribers")}</option>
              <option value="lifetime">{t("admin.crmPage.filters.lifetime", "Lifetime Users")}</option>
              <option value="admin">{t("admin.crmPage.filters.admin", "Admin Users")}</option>
            </FilterSelect>

            <ExportButton>
              <FaDownload />
              {t("common.export", "Export")}
            </ExportButton>
          </FiltersRow>
        </FiltersSection>

        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell onClick={() => handleSort('firstName')}>
                  {t("admin.crmPage.userTable.name", "Name")}
                  {getSortIcon('firstName')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('email')}>
                  {t("admin.crmPage.userTable.email", "Email")}
                  {getSortIcon('email')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('subscription')}>
                  {t("admin.crmPage.userTable.subscription", "Subscription")}
                  {getSortIcon('subscription')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('createdAt')}>
                  {t("admin.crmPage.userTable.joinDate", "Join Date")}
                  {getSortIcon('createdAt')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('lastActive')}>
                  Last Active
                  {getSortIcon('lastActive')}
                </TableHeaderCell>
                <TableHeaderCell>
                  Support Tickets
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('totalSpent')}>
                  {t("admin.crmPage.userTable.totalSpent", "Total Spent")}
                  {getSortIcon('totalSpent')}
                </TableHeaderCell>
                <TableHeaderCell>
                  Actions
                </TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableLoadingRow colSpan={8} message="Loading users..." />
              ) : users.map((userData, index) => {
                const supportTicketCount = getSupportTicketCount(userData.id);
                return (
                <TableRow
                  key={userData.id}
                  as={motion.tr}
                  variants={fadeIn}
                  custom={index}
                  initial="hidden"
                  animate="visible"
                    onClick={() => handleViewUser(userData)}
                >
                  <TableCell>
                    <UserInfo>
                      <UserAvatar $color={getAvatarColor(userData.email)}>
                        {getInitials(userData)}
                      </UserAvatar>
                      <UserDetails>
                        <UserName>{getDisplayName(userData)}</UserName>
                      </UserDetails>
                    </UserInfo>
                  </TableCell>
                  <TableCell>
                    <UserEmail>{userData.email}</UserEmail>
                  </TableCell>
                  <TableCell>
                      <SubscriptionBadge 
                        $color={getSubscriptionBadgeColor(userData.subscription)}
                        $variant={isSubscriptionPremium(userData.subscription) ? 'premium' : 'default'}
                      >
                        {getSubscriptionIcon(userData.subscription)}
                      {userData.subscription}
                    </SubscriptionBadge>
                  </TableCell>
                  <TableCell>{formatDate(userData.createdAt)}</TableCell>
                    <TableCell>{userData.lastActive ? formatDate(userData.lastActive) : 'Never'}</TableCell>
                    <TableCell>
                      <SupportTicketsCount>
                        <FaTicketAlt />
                        <TicketBadge $count={supportTicketCount}>
                          {supportTicketCount}
                        </TicketBadge>
                      </SupportTicketsCount>
                    </TableCell>
                  <TableCell>{formatCurrency(userData.totalSpent)}</TableCell>
                  <TableCell>
                      <MoreMenuContainer data-more-menu onClick={(e) => e.stopPropagation()}>
                        <MoreMenuButton 
                          onClick={(e) => handleMoreMenuClick(userData.id, e)}
                        >
                          <FaEllipsisV />
                        </MoreMenuButton>
                        
                        {openMoreMenu === userData.id && (
                          <MoreMenuDropdown
                            initial={{ opacity: 0, scale: 0.95, y: -10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <MoreMenuItem onClick={() => handleMoreMenuAction('view', userData)}>
                        <FaEye />
                              View Profile
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('edit', userData)}>
                        <FaEdit />
                              Edit User
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('email', userData)}>
                        <FaEnvelope />
                              Send Email
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('ban', userData)}>
                              <FaBan />
                              Ban User
                            </MoreMenuItem>
                            <MoreMenuItem 
                              variant="danger" 
                              onClick={() => handleMoreMenuAction('delete', userData)}
                            >
                        <FaTrash />
                              Delete User
                            </MoreMenuItem>
                          </MoreMenuDropdown>
                        )}
                      </MoreMenuContainer>
                  </TableCell>
                </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          <Pagination>
            <PaginationInfo>
              {searchLoading ? (
                <>
                  {t("admin.crmPage.loading", "Loading...")}
                  <SearchLoadingSpinner />
                </>
              ) : (
                `Showing ${((currentPage - 1) * usersPerPage) + 1} to ${Math.min(currentPage * usersPerPage, totalCount)} of ${totalCount} users`
              )}
            </PaginationInfo>
            <PaginationButtons>
              <PaginationButton 
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft />
              </PaginationButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 2
                )
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <PaginationEllipsis>...</PaginationEllipsis>
                    )}
                    <PaginationButton
                      onClick={() => setCurrentPage(page)}
                      $active={currentPage === page}
                    >
                      {page}
                    </PaginationButton>
                  </React.Fragment>
                ))}
              <PaginationButton 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                <FaChevronRight />
              </PaginationButton>
            </PaginationButtons>
          </Pagination>
        </TableContainer>
        </>
        )}

        {/* User Detail Modal */}
        {showUserModal && selectedUser && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <ModalTitle>
                  <FaUser />
                  {getDisplayName(selectedUser)}
                </ModalTitle>
                <CloseButton onClick={closeModal}>
                  <FaTimes />
                </CloseButton>
              </ModalHeader>

              {/* User Information */}
              <ModalSection>
                <SectionTitle>
                  <FaUser />
                  User Information
                </SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Email</InfoLabel>
                    <InfoValue>{selectedUser.email}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Subscription</InfoLabel>
                    <InfoValue>
                      <SubscriptionBadge 
                        $color={getSubscriptionBadgeColor(selectedUser.subscription)}
                        $variant={isSubscriptionPremium(selectedUser.subscription) ? 'premium' : 'default'}
                      >
                        {getSubscriptionIcon(selectedUser.subscription)}
                        {selectedUser.subscription}
                      </SubscriptionBadge>
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Join Date</InfoLabel>
                    <InfoValue>{formatDate(selectedUser.createdAt)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Last Active</InfoLabel>
                    <InfoValue>{selectedUser.lastActive ? formatDate(selectedUser.lastActive) : 'Never'}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Total Spent</InfoLabel>
                    <InfoValue>{formatCurrency(selectedUser.totalSpent)}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Customer ID</InfoLabel>
                    <InfoValue>{selectedUser.customerId || 'N/A'}</InfoValue>
                  </InfoItem>
                </InfoGrid>
              </ModalSection>

              {/* Subscriptions */}
              <ModalSection>
                <SectionTitle>
                  <FaCrown />
                  Subscriptions
                </SectionTitle>
                {(() => {
                  const details = getMockUserDetails(selectedUser);
                  return details.subscriptions.length > 0 ? (
                    <DataTable>
                      <DataTableHeader>
                        <tr>
                          <DataTableHeaderCell>ID</DataTableHeaderCell>
                          <DataTableHeaderCell>Status</DataTableHeaderCell>
                          <DataTableHeaderCell>Amount</DataTableHeaderCell>
                          <DataTableHeaderCell>Interval</DataTableHeaderCell>
                          <DataTableHeaderCell>Current Period</DataTableHeaderCell>
                          <DataTableHeaderCell>Auto Renew</DataTableHeaderCell>
                        </tr>
                      </DataTableHeader>
                      <DataTableBody>
                        {details.subscriptions.map((sub) => (
                          <DataTableRow key={sub.id}>
                            <DataTableCell>{sub.id}</DataTableCell>
                            <DataTableCell>
                              <StatusBadge $status={sub.status}>{sub.status}</StatusBadge>
                            </DataTableCell>
                            <DataTableCell>{formatCurrency(sub.amount)}</DataTableCell>
                            <DataTableCell>{sub.interval}</DataTableCell>
                            <DataTableCell>
                              {formatDate(sub.currentPeriodStart)} - {formatDate(sub.currentPeriodEnd)}
                            </DataTableCell>
                            <DataTableCell>{sub.cancelAtPeriodEnd ? 'No' : 'Yes'}</DataTableCell>
                          </DataTableRow>
                        ))}
                      </DataTableBody>
                    </DataTable>
                  ) : (
                    <EmptyState>No active subscriptions</EmptyState>
                  );
                })()}
              </ModalSection>

              {/* Purchases */}
              <ModalSection>
                <SectionTitle>
                  <FaChartLine />
                  Purchases
                </SectionTitle>
                {(() => {
                  const details = getMockUserDetails(selectedUser);
                  return details.purchases.length > 0 ? (
                    <DataTable>
                      <DataTableHeader>
                        <tr>
                          <DataTableHeaderCell>ID</DataTableHeaderCell>
                          <DataTableHeaderCell>Description</DataTableHeaderCell>
                          <DataTableHeaderCell>Amount</DataTableHeaderCell>
                          <DataTableHeaderCell>Status</DataTableHeaderCell>
                          <DataTableHeaderCell>Date</DataTableHeaderCell>
                          <DataTableHeaderCell>Actions</DataTableHeaderCell>
                        </tr>
                      </DataTableHeader>
                      <DataTableBody>
                        {details.purchases.map((purchase) => (
                          <DataTableRow key={purchase.id}>
                            <DataTableCell>{purchase.id}</DataTableCell>
                            <DataTableCell>{purchase.description}</DataTableCell>
                            <DataTableCell>{formatCurrency(purchase.amount)}</DataTableCell>
                            <DataTableCell>
                              <StatusBadge $status={purchase.status}>{purchase.status}</StatusBadge>
                            </DataTableCell>
                            <DataTableCell>{formatDate(purchase.createdAt)}</DataTableCell>
                            <DataTableCell>
                              {purchase.status === 'succeeded' && (
                                <RefundButton
                                  variant="danger"
                                  disabled={refundLoading === purchase.id}
                                  onClick={() => handleRefundPurchase(purchase.id, purchase.amount, purchase.description)}
                                >
                                  {refundLoading === purchase.id ? (
                                    <LoadingSpinner />
                                  ) : (
                                    <FaUndo />
                                  )}
                                  {refundSuccess === purchase.id ? 'Refunded' : 'Refund'}
                                </RefundButton>
                              )}
                            </DataTableCell>
                          </DataTableRow>
                        ))}
                      </DataTableBody>
                    </DataTable>
                  ) : (
                    <EmptyState>No purchases found</EmptyState>
                  );
                })()}
              </ModalSection>

              {/* Invoices */}
              <ModalSection>
                <SectionTitle>
                  <FaTicketAlt />
                  Invoices
                </SectionTitle>
                {(() => {
                  const details = getMockUserDetails(selectedUser);
                  return details.invoices.length > 0 ? (
                    <DataTable>
                      <DataTableHeader>
                        <tr>
                          <DataTableHeaderCell>ID</DataTableHeaderCell>
                          <DataTableHeaderCell>Number</DataTableHeaderCell>
                          <DataTableHeaderCell>Amount</DataTableHeaderCell>
                          <DataTableHeaderCell>Status</DataTableHeaderCell>
                          <DataTableHeaderCell>Created</DataTableHeaderCell>
                          <DataTableHeaderCell>Paid</DataTableHeaderCell>
                          <DataTableHeaderCell>Actions</DataTableHeaderCell>
                        </tr>
                      </DataTableHeader>
                      <DataTableBody>
                        {details.invoices.map((invoice) => (
                          <DataTableRow key={invoice.id}>
                            <DataTableCell>{invoice.id}</DataTableCell>
                            <DataTableCell>{invoice.number}</DataTableCell>
                            <DataTableCell>{formatCurrency(invoice.amount)}</DataTableCell>
                            <DataTableCell>
                              <StatusBadge $status={invoice.status}>{invoice.status}</StatusBadge>
                            </DataTableCell>
                            <DataTableCell>{formatDate(invoice.createdAt)}</DataTableCell>
                            <DataTableCell>{invoice.paidAt ? formatDate(invoice.paidAt) : 'N/A'}</DataTableCell>
                            <DataTableCell>
                              {invoice.status === 'paid' && (
                                <RefundButton
                                  variant="danger"
                                  disabled={refundLoading === invoice.id}
                                  onClick={() => handleRefundInvoiceClick(invoice.id, invoice.amount, invoice.number)}
                                >
                                  {refundLoading === invoice.id ? (
                                    <LoadingSpinner />
                                  ) : (
                                    <FaUndo />
                                  )}
                                  {refundSuccess === invoice.id ? 'Refunded' : 'Refund'}
                                </RefundButton>
                              )}
                            </DataTableCell>
                          </DataTableRow>
                        ))}
                      </DataTableBody>
                    </DataTable>
                  ) : (
                    <EmptyState>No invoices found</EmptyState>
                  );
                })()}
              </ModalSection>
            </ModalContent>
          </ModalOverlay>
        )}

        {/* Refund Notifications */}
        {refundSuccess && (
          <RefundNotification
            type="success"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            onClick={clearRefundMessages}
          >
            <FaCheck />
            Refund processed successfully!
          </RefundNotification>
        )}

        {refundError && (
          <RefundNotification
            type="error"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            onClick={clearRefundMessages}
          >
            <FaExclamationTriangle />
            {refundError}
          </RefundNotification>
        )}

        {/* Delete User Notifications */}
        {deleteSuccess && (
          <RefundNotification
            type="success"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            onClick={clearDeleteMessages}
          >
            <FaCheck />
            User deleted successfully!
          </RefundNotification>
        )}

        {deleteError && !showDeleteConfirmation && (
          <RefundNotification
            type="error"
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            onClick={clearDeleteMessages}
          >
            <FaExclamationTriangle />
            {deleteError}
          </RefundNotification>
        )}

        {/* Refund Confirmation Modal */}
        {showRefundConfirmation && (
          <ConfirmationModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelRefund}
          >
            <ConfirmationModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ConfirmationTitle>
                <FaCheck />
                Refund Confirmation
              </ConfirmationTitle>
              <ConfirmationMessage>
                Are you sure you want to refund this transaction?
              </ConfirmationMessage>
              <ConfirmationDetails>
                <ConfirmationDetailItem>
                  <ConfirmationDetailLabel>Amount</ConfirmationDetailLabel>
                  <ConfirmationDetailValue>{refundConfirmationData ? formatCurrency(refundConfirmationData.amount) : 'N/A'}</ConfirmationDetailValue>
                </ConfirmationDetailItem>
                <ConfirmationDetailItem>
                  <ConfirmationDetailLabel>Description</ConfirmationDetailLabel>
                  <ConfirmationDetailValue>{refundConfirmationData?.description}</ConfirmationDetailValue>
                </ConfirmationDetailItem>
              </ConfirmationDetails>
              <ConfirmationButtons>
                <ConfirmationButton variant="danger" onClick={handleConfirmRefund}>
                  <FaTrash />
                  Refund
                </ConfirmationButton>
                <ConfirmationButton variant="secondary" onClick={handleCancelRefund}>
                  <FaTimes />
                  Cancel
                </ConfirmationButton>
              </ConfirmationButtons>
            </ConfirmationModalContent>
          </ConfirmationModalOverlay>
        )}

        {/* Delete User Confirmation Modal */}
        {showDeleteConfirmation && deleteConfirmationData && (
          <ConfirmationModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelDelete}
          >
            <ConfirmationModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ConfirmationTitle>
                <FaExclamationTriangle />
                Delete User Confirmation
              </ConfirmationTitle>
              <ConfirmationMessage>
                Are you sure you want to delete this user? This action cannot be undone. All subscriptions will be canceled and the user account will be permanently deleted.
              </ConfirmationMessage>
              <ConfirmationDetails>
                <ConfirmationDetailItem>
                  <ConfirmationDetailLabel>Name</ConfirmationDetailLabel>
                  <ConfirmationDetailValue>{deleteConfirmationData.userName}</ConfirmationDetailValue>
                </ConfirmationDetailItem>
                <ConfirmationDetailItem>
                  <ConfirmationDetailLabel>Email</ConfirmationDetailLabel>
                  <ConfirmationDetailValue>{deleteConfirmationData.userEmail}</ConfirmationDetailValue>
                </ConfirmationDetailItem>
                <ConfirmationDetailItem>
                  <ConfirmationDetailLabel>User ID</ConfirmationDetailLabel>
                  <ConfirmationDetailValue style={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>{deleteConfirmationData.userId}</ConfirmationDetailValue>
                </ConfirmationDetailItem>
              </ConfirmationDetails>
              {deleteError && (
                <ConfirmationMessage style={{ color: '#e74c3c', marginTop: '1rem', marginBottom: '1rem' }}>
                  <FaExclamationTriangle style={{ marginRight: '0.5rem' }} />
                  {deleteError}
                </ConfirmationMessage>
              )}
              <ConfirmationButtons>
                <ConfirmationButton 
                  variant="danger" 
                  onClick={handleConfirmDelete}
                  disabled={deleteLoading === deleteConfirmationData.userId}
                >
                  {deleteLoading === deleteConfirmationData.userId ? (
                    <>
                      <LoadingSpinner />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <FaTrash />
                      Delete User
                    </>
                  )}
                </ConfirmationButton>
                <ConfirmationButton variant="secondary" onClick={handleCancelDelete} disabled={deleteLoading === deleteConfirmationData.userId}>
                  <FaTimes />
                  Cancel
                </ConfirmationButton>
              </ConfirmationButtons>
            </ConfirmationModalContent>
          </ConfirmationModalOverlay>
        )}
      </motion.div>
    </Container>
  );
} 