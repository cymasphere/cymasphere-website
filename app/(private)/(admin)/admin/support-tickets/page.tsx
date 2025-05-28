"use client";
import React, { useState, useEffect, useRef } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaTicketAlt, 
  FaSearch,
  FaEye,
  FaReply,
  FaUserCog,
  FaEdit,
  FaTimes,
  FaPlus,
  FaDownload,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaExclamationTriangle,
  FaExclamationCircle,
  FaCheckCircle,
  FaClock,
  FaChevronLeft,
  FaChevronRight,
  FaEllipsisV,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaVideo,
  FaFile,
  FaUser,
  FaUserTie
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const TicketsContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const TicketsTitle = styled.h1`
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

const TicketsSubtitle = styled.p`
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
  grid-template-columns: 1fr auto auto auto;
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'success' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  ${(props) => {
    switch (props.variant) {
      case 'success':
        return `
          background: linear-gradient(90deg, #28a745, #20c997);
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(40, 167, 69, 0.4);
          }
        `;
      case 'primary':
      default:
        return `
          background: linear-gradient(90deg, var(--primary), var(--accent));
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
          }
        `;
    }
  }}

  svg {
    font-size: 0.9rem;
  }
`;

const TableContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    overflow-x: auto;
    
    table {
      min-width: 1200px;
    }
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;

  /* Define column widths */
  th:nth-child(1), td:nth-child(1) { width: 100px; } /* Ticket ID */
  th:nth-child(2), td:nth-child(2) { width: 250px; } /* Subject */
  th:nth-child(3), td:nth-child(3) { width: 180px; } /* User */
  th:nth-child(4), td:nth-child(4) { width: 120px; } /* Status */
  th:nth-child(5), td:nth-child(5) { width: 120px; } /* Priority */
  th:nth-child(6), td:nth-child(6) { width: 110px; } /* Created */
  th:nth-child(7), td:nth-child(7) { width: 140px; } /* Assigned To */
  th:nth-child(8), td:nth-child(8) { width: 160px; } /* Actions */
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

const TableBody = styled.tbody`
  /* Ensure dropdowns can extend outside table body */
  overflow: visible;
`;

const TableRow = styled.tr`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background-color 0.2s ease;

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
  position: relative;

  /* Allow wrapping and overflow for action buttons */
  &:last-child {
    white-space: normal;
    overflow: visible;
  }
`;

const TicketId = styled.span`
  font-family: monospace;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-weight: 600;
`;

const TicketSubject = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TicketUser = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  ${(props) => {
    switch (props.status) {
      case 'open':
        return `
          background-color: #28a745;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'inProgress':
        return `
          background-color: #ffc107;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'resolved':
        return `
          background-color: var(--primary);
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'closed':
        return `
          background-color: #6c757d;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      default:
        return `
          background-color: #6c757d;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
    }
  }}

  svg {
    font-size: 0.7rem;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
`;

const PriorityBadge = styled.span<{ priority: string }>`
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  
  ${(props) => {
    switch (props.priority) {
      case 'urgent':
        return `
          background-color: #dc3545;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'high':
        return `
          background-color: #ff6600;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'medium':
        return `
          background-color: #ffc107;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      case 'low':
        return `
          background-color: #28a745;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
      default:
        return `
          background-color: #6c757d;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.2);
        `;
    }
  }}

  svg {
    font-size: 0.7rem;
    filter: drop-shadow(0 1px 1px rgba(0, 0, 0, 0.2));
  }
`;

const AssignedTo = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-style: italic;
  opacity: 0.8;
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
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

const PaginationEllipsis = styled.span`
  padding: 0.5rem;
  color: var(--text-secondary);
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

// More Menu Components
const MoreMenuContainer = styled.div`
  position: relative;
  display: inline-block;
  z-index: 10;
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
  position: relative;
  z-index: 11;

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
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  min-width: 160px;
  overflow: visible;
  backdrop-filter: blur(10px);
  transform: translateZ(0);
  
  /* Ensure dropdown appears above table content */
  margin-top: 4px;
  
  /* Handle edge cases where dropdown might go off-screen */
  @media (max-width: 768px) {
    right: auto;
    left: 0;
    min-width: 140px;
  }
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

// Expandable Row Components
const ExpandButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 8px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }

  svg {
    font-size: 0.9rem;
    transition: transform 0.2s ease;
  }
`;

const ExpandableRow = styled(motion.tr)`
  background-color: rgba(255, 255, 255, 0.02);
`;

const ExpandableCell = styled.td`
  padding: 0;
  border: none;
`;

const ConversationContainer = styled(motion.div)`
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.01);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const ConversationHeader = styled.div`
  display: flex;
  justify-content: between;
  align-items: center;
  margin-bottom: 1rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const ConversationTitle = styled.h4`
  color: var(--text);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
`;

const ConversationMeta = styled.div`
  color: var(--text-secondary);
  font-size: 0.85rem;
  display: flex;
  gap: 1rem;
`;

const MessagesContainer = styled.div`
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 1rem;
  padding-right: 8px;

  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Message = styled.div<{ isAdmin?: boolean }>`
  display: flex;
  margin-bottom: 1rem;
  align-items: flex-start;
  gap: 0.75rem;
  flex-direction: ${props => props.isAdmin ? 'row-reverse' : 'row'};
`;

const MessageAvatar = styled.div<{ isAdmin?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.isAdmin ? 'linear-gradient(135deg, var(--primary), var(--accent))' : 'linear-gradient(135deg, #6c757d, #495057)'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 0.8rem;
  flex-shrink: 0;
`;

const MessageBubble = styled.div<{ isAdmin?: boolean }>`
  max-width: 70%;
  padding: 0.75rem 1rem;
  border-radius: 18px;
  background-color: ${props => props.isAdmin ? 'var(--primary)' : 'rgba(255, 255, 255, 0.08)'};
  color: ${props => props.isAdmin ? 'white' : 'var(--text)'};
  position: relative;
  word-wrap: break-word;

  /* Message tail */
  &::before {
    content: '';
    position: absolute;
    top: 10px;
    width: 0;
    height: 0;
    border: 6px solid transparent;
    ${props => props.isAdmin ? `
      right: -12px;
      border-left-color: var(--primary);
    ` : `
      left: -12px;
      border-right-color: rgba(255, 255, 255, 0.08);
    `}
  }
`;

const MessageContent = styled.div`
  margin-bottom: 0.25rem;
  line-height: 1.4;
`;

const MessageTime = styled.div`
  font-size: 0.7rem;
  opacity: 0.7;
  margin-top: 0.25rem;
`;

const MessageAttachment = styled.div`
  margin-top: 0.5rem;
  padding: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.1);
`;

const AttachmentPreview = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.8;
  }
`;

const AttachmentIcon = styled.div`
  color: var(--primary);
  font-size: 1rem;
`;

const AttachmentInfo = styled.div`
  flex: 1;
`;

const AttachmentName = styled.div`
  font-size: 0.8rem;
  font-weight: 500;
`;

const AttachmentSize = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
`;

const ImagePreview = styled.img`
  max-width: 200px;
  max-height: 150px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const VideoPreview = styled.video`
  max-width: 250px;
  max-height: 180px;
  border-radius: 8px;
  cursor: pointer;
`;

const MessageInput = styled.div`
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const MessageTextArea = styled.textarea`
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  resize: none;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const MessageActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const AttachButton = styled.button`
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 8px;
  border-radius: 50%;
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

const SendButton = styled.button`
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border: none;
  color: white;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    font-size: 1rem;
  }
`;

const FileInput = styled.input`
  display: none;
`;

// Mock data - in a real app, this would come from your API
const mockTickets = [
  {
    id: "T-001",
    subject: "Login issue with Chrome browser",
    user: "john.doe@example.com",
    status: "open",
    priority: "high",
    created: "2024-01-20",
    lastUpdate: "2024-01-20",
    assignedTo: "Support Team",
    messages: [
      {
        id: "msg-1",
        content: "I'm having trouble logging into my account when using Chrome browser. It keeps saying 'Invalid credentials' even though I'm sure my password is correct.",
        timestamp: "2024-01-20T10:30:00Z",
        isAdmin: false,
        sender: "john.doe@example.com"
      },
      {
        id: "msg-2",
        content: "Hi John, thanks for reaching out. Can you please try clearing your browser cache and cookies? Also, please share a screenshot of the error message you're seeing.",
        timestamp: "2024-01-20T11:15:00Z",
        isAdmin: true,
        sender: "Support Team"
      },
      {
        id: "msg-3",
        content: "I cleared the cache but still having the same issue. Here's the screenshot:",
        timestamp: "2024-01-20T11:45:00Z",
        isAdmin: false,
        sender: "john.doe@example.com",
        attachments: [
          {
            type: "image",
            name: "login-error.png",
            size: "245 KB",
            url: "/images/mock-screenshot.jpg"
          }
        ]
      }
    ]
  },
  {
    id: "T-002",
    subject: "Billing question about subscription",
    user: "jane.smith@example.com",
    status: "inProgress",
    priority: "medium",
    created: "2024-01-19",
    lastUpdate: "2024-01-20",
    assignedTo: "John Admin",
    messages: [
      {
        id: "msg-4",
        content: "I was charged twice for my monthly subscription. Can you please check my billing history?",
        timestamp: "2024-01-19T14:20:00Z",
        isAdmin: false,
        sender: "jane.smith@example.com"
      },
      {
        id: "msg-5",
        content: "I've reviewed your account and found the duplicate charge. I'm processing a refund now. You should see it in 3-5 business days.",
        timestamp: "2024-01-20T09:30:00Z",
        isAdmin: true,
        sender: "John Admin"
      },
      {
        id: "msg-6",
        content: "Thank you! Here's my bank statement showing the duplicate charges:",
        timestamp: "2024-01-20T10:00:00Z",
        isAdmin: false,
        sender: "jane.smith@example.com",
        attachments: [
          {
            type: "file",
            name: "bank-statement.pdf",
            size: "1.2 MB",
            url: "/documents/bank-statement.pdf"
          }
        ]
      }
    ]
  },
  {
    id: "T-003",
    subject: "Feature request: Dark mode",
    user: "pro@example.com",
    status: "resolved",
    priority: "low",
    created: "2024-01-18",
    lastUpdate: "2024-01-19",
    assignedTo: "Development Team",
    messages: [
      {
        id: "msg-7",
        content: "Would love to see a dark mode option in the app. The current bright theme strains my eyes during long sessions.",
        timestamp: "2024-01-18T16:45:00Z",
        isAdmin: false,
        sender: "pro@example.com"
      },
      {
        id: "msg-8",
        content: "Great suggestion! Dark mode is actually already available. You can enable it in Settings > Appearance > Theme. Here's a quick video showing how:",
        timestamp: "2024-01-19T10:20:00Z",
        isAdmin: true,
        sender: "Development Team",
        attachments: [
          {
            type: "video",
            name: "dark-mode-tutorial.mp4",
            size: "5.8 MB",
            url: "/videos/dark-mode-tutorial.mp4"
          }
        ]
      },
      {
        id: "msg-9",
        content: "Perfect! Found it and enabled. Thanks for the quick help!",
        timestamp: "2024-01-19T10:35:00Z",
        isAdmin: false,
        sender: "pro@example.com"
      }
    ]
  },
  {
    id: "T-004",
    subject: "Critical bug in audio synthesis",
    user: "musician@example.com",
    status: "open",
    priority: "urgent",
    created: "2024-01-20",
    lastUpdate: "2024-01-20",
    assignedTo: "Tech Lead",
    messages: [
      {
        id: "msg-10",
        content: "The audio synthesis engine is producing distorted output when using certain filter combinations. This is blocking my work completely.",
        timestamp: "2024-01-20T08:15:00Z",
        isAdmin: false,
        sender: "musician@example.com"
      },
      {
        id: "msg-11",
        content: "This is indeed critical. Can you share the specific filter settings and a sample of the distorted audio? Our engineering team needs to reproduce this immediately.",
        timestamp: "2024-01-20T08:30:00Z",
        isAdmin: true,
        sender: "Tech Lead"
      }
    ]
  },
  {
    id: "T-005",
    subject: "How to export MIDI files?",
    user: "newbie@example.com",
    status: "closed",
    priority: "low",
    created: "2024-01-17",
    lastUpdate: "2024-01-18",
    assignedTo: "Support Team",
    messages: [
      {
        id: "msg-12",
        content: "I can't figure out how to export my compositions as MIDI files. Is this feature available?",
        timestamp: "2024-01-17T13:20:00Z",
        isAdmin: false,
        sender: "newbie@example.com"
      },
      {
        id: "msg-13",
        content: "Yes! You can export MIDI files by going to File > Export > MIDI. Make sure your composition is selected first.",
        timestamp: "2024-01-18T09:15:00Z",
        isAdmin: true,
        sender: "Support Team"
      },
      {
        id: "msg-14",
        content: "Got it! Thanks for the help.",
        timestamp: "2024-01-18T09:30:00Z",
        isAdmin: false,
        sender: "newbie@example.com"
      }
    ]
  },
];

function SupportTicketsPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [openMoreMenu, setOpenMoreMenu] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [newMessages, setNewMessages] = useState<{[key: string]: string}>({});
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const itemsPerPage = 10;
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

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

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  // Temporarily disabled admin check for testing
  // if (user.profile?.subscription !== "admin") {
  //   return null;
  // }

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: string) => {
    if (sortField !== field) return <FaSort />;
    return sortDirection === 'asc' ? <FaSortUp /> : <FaSortDown />;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <FaCheckCircle />;
      case 'inProgress':
        return <FaClock />;
      case 'resolved':
        return <FaCheckCircle />;
      case 'closed':
        return <FaTimes />;
      default:
        return <FaClock />;
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <FaExclamationTriangle />;
      case 'high':
        return <FaExclamationCircle />;
      case 'medium':
        return <FaExclamationCircle />;
      case 'low':
        return <FaCheckCircle />;
      default:
        return <FaCheckCircle />;
    }
  };

  const filteredTickets = mockTickets.filter(ticket => {
    const matchesSearch = 
      ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.user.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === "all" || ticket.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  const sortedTickets = [...filteredTickets].sort((a, b) => {
    if (!sortField) return 0;
    
    let aValue = a[sortField as keyof typeof a];
    let bValue = b[sortField as keyof typeof b];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const totalPages = Math.ceil(sortedTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTickets = sortedTickets.slice(startIndex, startIndex + itemsPerPage);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  // More menu handlers
  const handleMoreMenuClick = (ticketId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenMoreMenu(openMoreMenu === ticketId ? null : ticketId);
  };

  const handleMoreMenuAction = (action: string, ticket: any) => {
    setOpenMoreMenu(null);
    
    switch (action) {
      case 'view':
        console.log('View ticket:', ticket);
        break;
      case 'edit':
        console.log('Edit ticket:', ticket);
        break;
      case 'reply':
        console.log('Reply to ticket:', ticket);
        break;
      case 'assign':
        console.log('Assign ticket:', ticket);
        break;
      case 'close':
        console.log('Close ticket:', ticket);
        break;
      case 'delete':
        console.log('Delete ticket:', ticket);
        break;
      default:
        break;
    }
  };

  // Expandable row handlers
  const toggleRowExpansion = (ticketId: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(ticketId)) {
      newExpandedRows.delete(ticketId);
    } else {
      newExpandedRows.add(ticketId);
    }
    setExpandedRows(newExpandedRows);
  };

  // Message handlers
  const handleSendMessage = (ticketId: string) => {
    const message = newMessages[ticketId]?.trim();
    if (!message) return;

    // In a real app, this would send to your API
    console.log('Sending message for ticket:', ticketId, 'Message:', message);
    
    // Clear the input
    setNewMessages(prev => ({
      ...prev,
      [ticketId]: ''
    }));
  };

  const handleFileUpload = (ticketId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploadingFiles(prev => ({ ...prev, [ticketId]: true }));

    // Simulate file upload
    setTimeout(() => {
      console.log('Files uploaded for ticket:', ticketId, files);
      setUploadingFiles(prev => ({ ...prev, [ticketId]: false }));
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent, ticketId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(ticketId);
    }
  };

  const formatMessageTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderAttachment = (attachment: any) => {
    const { type, name, size, url } = attachment;

    switch (type) {
      case 'image':
        return (
          <MessageAttachment key={name}>
            <ImagePreview src={url} alt={name} />
            <AttachmentPreview>
              <AttachmentIcon><FaImage /></AttachmentIcon>
              <AttachmentInfo>
                <AttachmentName>{name}</AttachmentName>
                <AttachmentSize>{size}</AttachmentSize>
              </AttachmentInfo>
            </AttachmentPreview>
          </MessageAttachment>
        );
      case 'video':
        return (
          <MessageAttachment key={name}>
            <VideoPreview controls>
              <source src={url} type="video/mp4" />
            </VideoPreview>
            <AttachmentPreview>
              <AttachmentIcon><FaVideo /></AttachmentIcon>
              <AttachmentInfo>
                <AttachmentName>{name}</AttachmentName>
                <AttachmentSize>{size}</AttachmentSize>
              </AttachmentInfo>
            </AttachmentPreview>
          </MessageAttachment>
        );
      case 'file':
      default:
        return (
          <MessageAttachment key={name}>
            <AttachmentPreview>
              <AttachmentIcon><FaFile /></AttachmentIcon>
              <AttachmentInfo>
                <AttachmentName>{name}</AttachmentName>
                <AttachmentSize>{size}</AttachmentSize>
              </AttachmentInfo>
            </AttachmentPreview>
          </MessageAttachment>
        );
    }
  };

  const stats = [
    {
      value: mockTickets.length.toString(),
      label: t("admin.supportTickets.totalTickets", "Total Tickets"),
    },
    {
      value: mockTickets.filter(t => t.status === "open" || t.status === "inProgress").length.toString(),
      label: t("admin.supportTickets.openTickets", "Open Tickets"),
    },
    {
      value: "2.5h",
      label: t("admin.supportTickets.avgResponseTime", "Avg Response Time"),
    },
  ];

  return (
    <>
      <NextSEO
        title={t("admin.supportTickets", "Support Tickets")}
        description={t("admin.supportTickets.subtitle", "Manage customer support requests and issues")}
      />
      
      <TicketsContainer>
        <TicketsTitle>
          <FaTicketAlt />
          {t("admin.supportTickets.title", "Support Tickets")}
        </TicketsTitle>
        <TicketsSubtitle>
          {t("admin.supportTickets.subtitle", "Manage customer support requests and issues")}
        </TicketsSubtitle>

        <StatsRow>
          {stats.map((stat, index) => (
            <StatCard
              key={stat.label}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <StatValue>{stat.value}</StatValue>
              <StatLabel>{stat.label}</StatLabel>
            </StatCard>
          ))}
        </StatsRow>

        <FiltersSection>
          <FiltersRow>
            <SearchContainer>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder={t("admin.supportTickets.searchPlaceholder", "Search tickets by subject, user, or ticket ID...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            
            <FilterSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t("admin.supportTickets.filters.all", "All Tickets")}</option>
              <option value="open">{t("admin.supportTickets.filters.open", "Open")}</option>
              <option value="inProgress">{t("admin.supportTickets.filters.inProgress", "In Progress")}</option>
              <option value="resolved">{t("admin.supportTickets.filters.resolved", "Resolved")}</option>
              <option value="closed">{t("admin.supportTickets.filters.closed", "Closed")}</option>
            </FilterSelect>

            <ActionButton variant="success">
              <FaPlus />
              {t("admin.supportTickets.createTicket", "Create Ticket")}
            </ActionButton>

            <ActionButton>
              <FaDownload />
              {t("common.export", "Export")}
            </ActionButton>
          </FiltersRow>
        </FiltersSection>

        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell onClick={() => handleSort('id')}>
                  {t("admin.supportTickets.ticketTable.id", "Ticket ID")}
                  {getSortIcon('id')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('subject')}>
                  {t("admin.supportTickets.ticketTable.subject", "Subject")}
                  {getSortIcon('subject')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('user')}>
                  {t("admin.supportTickets.ticketTable.user", "User")}
                  {getSortIcon('user')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('status')}>
                  {t("admin.supportTickets.ticketTable.status", "Status")}
                  {getSortIcon('status')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('priority')}>
                  {t("admin.supportTickets.ticketTable.priority", "Priority")}
                  {getSortIcon('priority')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('created')}>
                  {t("admin.supportTickets.ticketTable.created", "Created")}
                  {getSortIcon('created')}
                </TableHeaderCell>
                <TableHeaderCell onClick={() => handleSort('assignedTo')}>
                  {t("admin.supportTickets.ticketTable.assignedTo", "Assigned To")}
                  {getSortIcon('assignedTo')}
                </TableHeaderCell>
                <TableHeaderCell>
                  {t("admin.supportTickets.ticketTable.actions", "Actions")}
                </TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {paginatedTickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <TableRow>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ExpandButton onClick={() => toggleRowExpansion(ticket.id)}>
                          {expandedRows.has(ticket.id) ? <FaChevronUp /> : <FaChevronDown />}
                        </ExpandButton>
                        <TicketId>{ticket.id}</TicketId>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TicketSubject>{ticket.subject}</TicketSubject>
                      <TicketUser>by {ticket.user}</TicketUser>
                    </TableCell>
                    <TableCell>
                      <TicketUser>{ticket.user}</TicketUser>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status}>
                        {getStatusIcon(ticket.status)}
                        {t(`admin.supportTickets.filters.${ticket.status}`, ticket.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority}>
                        {getPriorityIcon(ticket.priority)}
                        {t(`admin.supportTickets.priority.${ticket.priority}`, ticket.priority)}
                      </PriorityBadge>
                    </TableCell>
                    <TableCell>{formatDate(ticket.created)}</TableCell>
                    <TableCell>
                      <AssignedTo>{ticket.assignedTo}</AssignedTo>
                    </TableCell>
                    <TableCell>
                      <MoreMenuContainer data-more-menu onClick={(e) => e.stopPropagation()}>
                        <MoreMenuButton
                          onClick={(e) => handleMoreMenuClick(ticket.id, e)}
                        >
                          <FaEllipsisV />
                        </MoreMenuButton>

                        {openMoreMenu === ticket.id && (
                          <MoreMenuDropdown
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                          >
                            <MoreMenuItem onClick={() => handleMoreMenuAction('view', ticket)}>
                              <FaEye />
                              {t("admin.supportTickets.ticketActions.view", "View Ticket")}
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('reply', ticket)}>
                              <FaReply />
                              {t("admin.supportTickets.ticketActions.reply", "Reply")}
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('edit', ticket)}>
                              <FaEdit />
                              {t("admin.supportTickets.ticketActions.edit", "Edit")}
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('assign', ticket)}>
                              <FaUserCog />
                              {t("admin.supportTickets.ticketActions.assign", "Assign")}
                            </MoreMenuItem>
                            <MoreMenuItem onClick={() => handleMoreMenuAction('close', ticket)}>
                              <FaTimes />
                              {t("admin.supportTickets.ticketActions.close", "Close Ticket")}
                            </MoreMenuItem>
                            <MoreMenuItem 
                              variant="danger"
                              onClick={() => handleMoreMenuAction('delete', ticket)}
                            >
                              <FaTimes />
                              {t("admin.supportTickets.ticketActions.delete", "Delete")}
                            </MoreMenuItem>
                          </MoreMenuDropdown>
                        )}
                      </MoreMenuContainer>
                    </TableCell>
                  </TableRow>

                  <AnimatePresence>
                    {expandedRows.has(ticket.id) && (
                      <ExpandableRow
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                      >
                        <ExpandableCell colSpan={8}>
                          <ConversationContainer
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                          >
                            <ConversationHeader>
                              <ConversationTitle>
                                Conversation: {ticket.subject}
                              </ConversationTitle>
                              <ConversationMeta>
                                <span>Messages: {ticket.messages?.length || 0}</span>
                                <span>Last updated: {formatDate(ticket.lastUpdate)}</span>
                              </ConversationMeta>
                            </ConversationHeader>

                            <MessagesContainer>
                              {ticket.messages?.map((message) => (
                                <Message key={message.id} isAdmin={message.isAdmin}>
                                  <MessageAvatar isAdmin={message.isAdmin}>
                                    {message.isAdmin ? <FaUserTie /> : <FaUser />}
                                  </MessageAvatar>
                                  <div style={{ flex: 1 }}>
                                    <MessageBubble isAdmin={message.isAdmin}>
                                      <MessageContent>{message.content}</MessageContent>
                                      <MessageTime>
                                        {message.sender} • {formatMessageTime(message.timestamp)}
                                      </MessageTime>
                                    </MessageBubble>
                                    {message.attachments?.map(renderAttachment)}
                                  </div>
                                </Message>
                              ))}
                            </MessagesContainer>

                            <MessageInput>
                              <MessageTextArea
                                placeholder={t("admin.supportTickets.conversation.placeholder", "Type your message...")}
                                value={newMessages[ticket.id] || ''}
                                onChange={(e) => setNewMessages(prev => ({
                                  ...prev,
                                  [ticket.id]: e.target.value
                                }))}
                                onKeyPress={(e) => handleKeyPress(e, ticket.id)}
                                rows={1}
                              />
                              <MessageActions>
                                <AttachButton
                                  onClick={() => fileInputRefs.current[ticket.id]?.click()}
                                  disabled={uploadingFiles[ticket.id]}
                                >
                                  <FaPaperclip />
                                </AttachButton>
                                <SendButton
                                  onClick={() => handleSendMessage(ticket.id)}
                                  disabled={!newMessages[ticket.id]?.trim() || uploadingFiles[ticket.id]}
                                >
                                  <FaPaperPlane />
                                </SendButton>
                              </MessageActions>
                              <FileInput
                                ref={(el) => {
                                  if (el) {
                                    fileInputRefs.current[ticket.id] = el;
                                  }
                                }}
                                type="file"
                                multiple
                                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                                onChange={(e) => handleFileUpload(ticket.id, e.target.files)}
                              />
                            </MessageInput>
                          </ConversationContainer>
                        </ExpandableCell>
                      </ExpandableRow>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
          
          <Pagination>
            <PaginationInfo>
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, sortedTickets.length)} of {sortedTickets.length} tickets
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
      </TicketsContainer>
    </>
  );
}

export default SupportTicketsPage; 