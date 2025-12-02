"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaTicketAlt, 
  FaSearch,
  FaPlus,
  FaSortUp,
  FaSortDown,
  FaSort,
  FaCheckCircle,
  FaClock,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaChevronDown,
  FaChevronUp,
  FaPaperPlane,
  FaPaperclip,
  FaImage,
  FaVideo,
  FaFile,
  FaUser,
  FaUserTie,
  FaEye
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { 
  createSupportTicket,
  getUserSupportTickets,
  getUserSupportTicket,
  addSupportTicketMessage,
  uploadSupportTicketAttachment
} from "@/app/actions/user-management";

import TableLoadingRow from "@/components/common/TableLoadingRow";
import * as SupportComponents from "@/components/support/SupportTicketsComponents";

// Use shared components
import styled from "styled-components";

const {
  TicketsContainer,
  TicketsTitle,
  TicketsSubtitle,
  FiltersSection,
  SearchContainer,
  SearchInput,
  SearchIcon,
  FilterSelect,
  ActionButton,
  TableContainer,
  Table,
  TableHeader,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  ExpandButton,
  TicketId,
  TicketSubject,
  StatusBadge,
  ExpandableRow,
  ExpandableCell,
  ConversationContainer,
  ConversationHeader,
  ConversationTitle,
  ConversationMeta,
  MessagesContainer,
  Message,
  MessageAvatar,
  MessageBubble,
  MessageContent,
  MessageTime,
  AttachmentContainer,
  AttachmentIcon,
  AttachmentInfo,
  AttachmentName,
  AttachmentSize,
  AttachmentLink,
  MessageAttachment,
  ImagePreview,
  VideoPreview,
  MessageInput,
  MessageTextArea,
  MessageActions,
  AttachButton,
  SendButton,
  FileInput,
  Pagination,
  PaginationInfo,
  PaginationButtons,
  PaginationButton,
  PaginationEllipsis,
  ModalOverlay,
  CreateTicketModal,
  ModalHeader,
  ModalTitle,
  CloseButton,
  FormGroup,
  FormLabel,
  FormInput,
  FormTextarea,
  FormActions,
  CancelButton,
  SubmitButton,
  ErrorMessage,
  SuccessMessage,
} = SupportComponents;

// Customer page specific: FiltersRow with 3 columns (search, filter, create button)
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

// Wider columns for subject
const SubjectTableCell = styled(TableCell)`
  min-width: 250px;
  max-width: 400px;
`;

const SubjectHeaderCell = styled(TableHeaderCell)`
  min-width: 250px;
  max-width: 400px;
`;

interface TicketMessage {
  id: string;
  content: string;
  is_admin: boolean;
  user_id: string;
  user_email: string | null;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  attachments: Array<{
    id: string;
    file_name: string;
    file_size: number;
    file_type: string;
    attachment_type: string;
    url: string | null;
    created_at: string;
  }>;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string | null;
  status: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  closed_at: string | null;
  messages?: TicketMessage[];
}

function SupportPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [newMessages, setNewMessages] = useState<{[key: string]: string}>({});
  const [uploadingFiles, setUploadingFiles] = useState<{[key: string]: boolean}>({});
  const [pendingAttachments, setPendingAttachments] = useState<{[key: string]: File[]}>({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createTicketForm, setCreateTicketForm] = useState({
    subject: "",
    description: "",
  });
  const [createTicketLoading, setCreateTicketLoading] = useState(false);
  const [createTicketError, setCreateTicketError] = useState<string | null>(null);
  const [createTicketSuccess, setCreateTicketSuccess] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [ticketDetails, setTicketDetails] = useState<Map<string, Ticket>>(new Map());
  const [loadingDetails, setLoadingDetails] = useState<Set<string>>(new Set());
  const itemsPerPage = 10;
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const fileInputRefs = useRef<{[key: string]: HTMLInputElement | null}>({});
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Show page immediately - no early returns
  const showContent = !languageLoading && translationsLoaded && user;

  // Fetch tickets from database
  useEffect(() => {
    if (showContent) {
      fetchTickets();
    }
  }, [showContent]);

  // Auto-expand ticket if ticket query parameter is present
  useEffect(() => {
    if (showContent && tickets.length > 0) {
      const ticketIdFromUrl = searchParams.get('ticket');
      if (ticketIdFromUrl && !expandedRows.has(ticketIdFromUrl)) {
        // Find the ticket in the list
        const ticket = tickets.find(t => t.id === ticketIdFromUrl);
        if (ticket) {
          // Expand the ticket
          setExpandedRows(prev => new Set(prev).add(ticketIdFromUrl));
          // Fetch ticket details if not already loaded
          if (!ticketDetails.has(ticketIdFromUrl)) {
            fetchTicketDetails(ticketIdFromUrl, true);
          }
          // Scroll to the ticket (after a short delay to allow rendering)
          setTimeout(() => {
            const element = document.querySelector(`[data-ticket-id="${ticketIdFromUrl}"]`);
            if (element) {
              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 500);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showContent, tickets, searchParams]);

  const fetchTickets = async () => {
    setLoadingTickets(true);
    try {
      const result = await getUserSupportTickets();
      if (result.tickets) {
        setTickets(result.tickets);
      } else {
        console.error("Error fetching tickets:", result.error);
      }
    } catch (error) {
      console.error("Error fetching tickets:", error);
    } finally {
      setLoadingTickets(false);
    }
  };

  const fetchTicketDetails = async (ticketId: string, forceRefresh: boolean = false) => {
    // If already loading and not forcing refresh, skip
    if (!forceRefresh && loadingDetails.has(ticketId)) {
      return;
    }

    // If already loaded and not forcing refresh, skip
    if (!forceRefresh && ticketDetails.has(ticketId)) {
      return;
    }

    setLoadingDetails(prev => new Set(prev).add(ticketId));

    try {
      const result = await getUserSupportTicket(ticketId);
      if (result.ticket) {
        setTicketDetails(prev => new Map(prev).set(ticketId, result.ticket!));
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoadingDetails(prev => {
        const next = new Set(prev);
        next.delete(ticketId);
        return next;
      });
    }
  };

  // Fetch ticket details when a row is expanded
  useEffect(() => {
    const ticketsToFetch: string[] = [];
    expandedRows.forEach(ticketId => {
      if (!ticketDetails.has(ticketId) && !loadingDetails.has(ticketId)) {
        ticketsToFetch.push(ticketId);
      }
    });
    
    // Fetch all tickets that need to be loaded
    ticketsToFetch.forEach(ticketId => {
      fetchTicketDetails(ticketId, false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [expandedRows]);

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateTicketError(null);
    setCreateTicketSuccess(null);

    if (!createTicketForm.subject.trim() || !createTicketForm.description.trim()) {
      setCreateTicketError("Please fill in all required fields");
      return;
    }

    setCreateTicketLoading(true);

    try {
      const result = await createSupportTicket({
        subject: createTicketForm.subject.trim(),
        description: createTicketForm.description.trim(),
      });

      if (result.success && result.ticket) {
        setCreateTicketSuccess(`Ticket ${result.ticket.ticket_number} created successfully!`);
        setCreateTicketForm({
          subject: "",
          description: "",
        });
        // Refresh tickets
        await fetchTickets();
        // Close modal after 2 seconds
        setTimeout(() => {
          setShowCreateModal(false);
          setCreateTicketSuccess(null);
        }, 2000);
      } else {
        setCreateTicketError(result.error || "Failed to create ticket");
      }
    } catch (error) {
      console.error("Error creating ticket:", error);
      setCreateTicketError("An unexpected error occurred");
    } finally {
      setCreateTicketLoading(false);
    }
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setCreateTicketForm({
      subject: "",
      description: "",
    });
    setCreateTicketError(null);
    setCreateTicketSuccess(null);
  };

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
      case 'in_progress':
        return <FaClock />;
      case 'resolved':
        return <FaCheckCircle />;
      case 'closed':
        return <FaTimes />;
      default:
        return <FaClock />;
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = 
      ticket.ticket_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Normalize status for comparison
    let normalizedStatus = ticket.status;
    let normalizedFilter = filterStatus;
    
    // Map UI filter values to database values
    if (normalizedFilter === "inProgress") {
      normalizedFilter = "in_progress";
    }
    
    const matchesFilter = normalizedFilter === "all" || normalizedStatus === normalizedFilter;
    
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const toggleRowExpansion = (ticketId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(ticketId)) {
        next.delete(ticketId);
      } else {
        next.add(ticketId);
      }
      return next;
    });
  };

  const handleSendMessage = async (ticketId: string) => {
    const messageContent = newMessages[ticketId]?.trim();
    const attachments = pendingAttachments[ticketId] || [];
    
    if (!messageContent && attachments.length === 0) {
      return;
    }

    // If no message content but there are attachments, add a default message
    const finalMessage = messageContent || "Sent an attachment";

    try {
      // Create the message first
      const result = await addSupportTicketMessage(ticketId, finalMessage);
      if (!result.success || !result.messageId) {
        alert(result.error || "Failed to send message");
        return;
      }

      // Upload attachments if any
      if (attachments.length > 0) {
        for (const file of attachments) {
          const uploadResult = await uploadSupportTicketAttachment(
            ticketId,
            result.messageId,
            file
          );
          if (!uploadResult.success) {
            console.error("Error uploading attachment:", uploadResult.error);
            // Continue with other attachments even if one fails
          }
        }
      }

      // Clear message input and pending attachments
      setNewMessages(prev => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
      setPendingAttachments(prev => {
        const next = { ...prev };
        delete next[ticketId];
        return next;
      });
      
      // Clear file input
      if (fileInputRefs.current[ticketId]) {
        fileInputRefs.current[ticketId].value = '';
      }

      // Refresh ticket details (force refresh to get new message and attachments)
      await fetchTicketDetails(ticketId, true);
      // Refresh tickets list to update updated_at
      await fetchTickets();
    } catch (error) {
      console.error("Error sending message:", error);
      alert("An error occurred while sending the message");
    }
  };

  const handleFileUpload = (ticketId: string, files: FileList | null) => {
    if (!files || files.length === 0) return;

    // Convert FileList to Array
    const fileArray = Array.from(files);
    
    // Add files to pending attachments
    setPendingAttachments(prev => ({
      ...prev,
      [ticketId]: [...(prev[ticketId] || []), ...fileArray]
    }));
  };

  if (!showContent) {
    return null;
  }

  return (
    <>
      <NextSEO
        title={t("dashboard.support.title", "Support")}
        description={t("dashboard.support.subtitle", "Get help and support for your account")}
      />
      
      <TicketsContainer>
        <TicketsTitle>
          <FaTicketAlt />
          {t("dashboard.support.title", "Support")}
        </TicketsTitle>
        <TicketsSubtitle>
          {t("dashboard.support.subtitle", "Create and manage your support tickets")}
        </TicketsSubtitle>

        <FiltersSection>
          <FiltersRow>
            <SearchContainer>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder={t("dashboard.support.searchPlaceholder", "Search tickets by subject or ticket ID...")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>

            <FilterSelect
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">{t("dashboard.support.filters.all", "All Tickets")}</option>
              <option value="open">{t("dashboard.support.filters.open", "Open")}</option>
              <option value="in_progress">{t("dashboard.support.filters.inProgress", "In Progress")}</option>
              <option value="resolved">{t("dashboard.support.filters.resolved", "Resolved")}</option>
              <option value="closed">{t("dashboard.support.filters.closed", "Closed")}</option>
            </FilterSelect>

            <ActionButton variant="success" onClick={() => setShowCreateModal(true)}>
              <FaPlus />
              {t("dashboard.support.createTicket", "Create Ticket")}
            </ActionButton>
          </FiltersRow>
        </FiltersSection>

        <TableContainer>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell $sortable onClick={() => handleSort('ticket_number')}>
                  {t("dashboard.support.ticketTable.id", "Ticket ID")}
                  {getSortIcon('ticket_number')}
                </TableHeaderCell>
                <SubjectHeaderCell $sortable onClick={() => handleSort('subject')}>
                  {t("dashboard.support.ticketTable.subject", "Subject")}
                  {getSortIcon('subject')}
                </SubjectHeaderCell>
                <TableHeaderCell>
                  {t("dashboard.support.ticketTable.status", "Status")}
                </TableHeaderCell>
                <TableHeaderCell $sortable onClick={() => handleSort('created_at')}>
                  {t("dashboard.support.ticketTable.created", "Created")}
                  {getSortIcon('created_at')}
                </TableHeaderCell>
                <TableHeaderCell>
                  {t("dashboard.support.ticketTable.actions", "Actions")}
                </TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {loadingTickets ? (
                <TableLoadingRow colSpan={5} />
              ) : filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                    {searchTerm || filterStatus !== "all" 
                      ? t("dashboard.support.noTicketsFound", "No tickets found matching your filters")
                      : t("dashboard.support.noTickets", "No support tickets yet. Create your first ticket to get started!")}
                  </td>
                </tr>
              ) : paginatedTickets.map((ticket) => (
                <React.Fragment key={ticket.id}>
                  <TableRow data-ticket-id={ticket.id}>
                    <TableCell>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <ExpandButton onClick={() => toggleRowExpansion(ticket.id)}>
                          {expandedRows.has(ticket.id) ? <FaChevronUp /> : <FaChevronDown />}
                        </ExpandButton>
                        <TicketId>{ticket.ticket_number}</TicketId>
                      </div>
                    </TableCell>
                    <SubjectTableCell>
                      <TicketSubject>{ticket.subject}</TicketSubject>
                    </SubjectTableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status}>
                        {getStatusIcon(ticket.status)}
                        {t(`dashboard.support.filters.${ticket.status}`, ticket.status)}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{formatDate(ticket.created_at)}</TableCell>
                    <TableCell>
                      <ActionButton 
                        variant="secondary" 
                        onClick={() => toggleRowExpansion(ticket.id)}
                      >
                        <FaEye />
                        {expandedRows.has(ticket.id) 
                          ? t("dashboard.support.hideTicket", "Hide")
                          : t("dashboard.support.viewTicket", "View")}
                      </ActionButton>
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
                        <ExpandableCell colSpan={5}>
                          <ConversationContainer
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1, duration: 0.3 }}
                          >
                            {loadingDetails.has(ticket.id) ? (
                              <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  style={{ 
                                    width: '20px', 
                                    height: '20px', 
                                    border: '3px solid rgba(108, 99, 255, 0.3)', 
                                    borderTop: '3px solid var(--primary)', 
                                    borderRadius: '50%',
                                    margin: '0 auto 1rem'
                                  }}
                                />
                                Loading conversation...
                              </div>
                            ) : (
                              <>
                                <ConversationHeader>
                                  <ConversationTitle>
                                    Conversation: {ticket.subject}
                                  </ConversationTitle>
                                  <ConversationMeta>
                                    <span>Messages: {ticketDetails.get(ticket.id)?.messages?.length || 0}</span>
                                    <span>Last updated: {formatDate(ticket.updated_at)}</span>
                                  </ConversationMeta>
                                </ConversationHeader>

                                <MessagesContainer>
                                  {ticketDetails.get(ticket.id)?.messages?.map((message) => {
                                    const isCurrentUser = message.user_id === user?.id;
                                    return (
                                    <Message key={message.id} $isAdmin={isCurrentUser}>
                                      <MessageAvatar $isAdmin={isCurrentUser}>
                                        {isCurrentUser ? <FaUser /> : <FaUserTie />}
                                      </MessageAvatar>
                                      <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        alignItems: isCurrentUser ? 'flex-end' : 'flex-start'
                                      }}>
                                        <MessageBubble $isAdmin={isCurrentUser}>
                                          <MessageContent>{message.content}</MessageContent>
                                          <MessageTime>
                                            {message.is_admin ? "Support Team" : (message.user_email || "You")} • {formatDateTime(message.created_at)}
                                            {message.edited_at && ` (edited ${formatDateTime(message.edited_at)})`}
                                          </MessageTime>
                                        </MessageBubble>
                                        {message.attachments?.map((att) => (
                                          <MessageAttachment key={att.id}>
                                            {att.attachment_type === 'image' && att.url ? (
                                              <>
                                                <ImagePreview 
                                                  src={att.url} 
                                                  alt={att.file_name}
                                                  onClick={() => window.open(att.url || '', '_blank')}
                                                />
                                                <AttachmentInfo style={{ marginTop: '0.5rem' }}>
                                                  <AttachmentName>{att.file_name}</AttachmentName>
                                                  <AttachmentSize>{(att.file_size / 1024).toFixed(2)} KB</AttachmentSize>
                                                </AttachmentInfo>
                                              </>
                                            ) : att.attachment_type === 'video' && att.url ? (
                                              <>
                                                <VideoPreview controls>
                                                  <source src={att.url} type={att.file_type || 'video/mp4'} />
                                                  Your browser does not support the video tag.
                                                </VideoPreview>
                                                <AttachmentInfo style={{ marginTop: '0.5rem' }}>
                                                  <AttachmentName>{att.file_name}</AttachmentName>
                                                  <AttachmentSize>{(att.file_size / 1024).toFixed(2)} KB</AttachmentSize>
                                                </AttachmentInfo>
                                              </>
                                            ) : (
                                              <AttachmentContainer>
                                                <AttachmentIcon>
                                                  <FaFile />
                                                </AttachmentIcon>
                                                <AttachmentInfo>
                                                  <AttachmentName>{att.file_name}</AttachmentName>
                                                  <AttachmentSize>{(att.file_size / 1024).toFixed(2)} KB</AttachmentSize>
                                                </AttachmentInfo>
                                                {att.url && (
                                                  <AttachmentLink href={att.url} target="_blank" rel="noopener noreferrer">
                                                    View
                                                  </AttachmentLink>
                                                )}
                                              </AttachmentContainer>
                                            )}
                                          </MessageAttachment>
                                        ))}
                                      </div>
                                    </Message>
                                    );
                                  })}
                                  {(!ticketDetails.get(ticket.id)?.messages || ticketDetails.get(ticket.id)!.messages.length === 0) && (
                                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                                      No messages yet. Start the conversation below.
                                    </div>
                                  )}
                                </MessagesContainer>
                              </>
                            )}

                            <MessageInput>
                              {pendingAttachments[ticket.id] && pendingAttachments[ticket.id].length > 0 && (
                                <div style={{ 
                                  marginBottom: '0.5rem', 
                                  padding: '0.5rem', 
                                  background: 'rgba(255, 255, 255, 0.05)', 
                                  borderRadius: '8px',
                                  fontSize: '0.85rem',
                                  color: 'var(--text-secondary)',
                                  width: '100%'
                                }}>
                                  {pendingAttachments[ticket.id].map((file, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                                      <FaFile />
                                      <span>{file.name}</span>
                                      <button
                                        onClick={() => {
                                          setPendingAttachments(prev => ({
                                            ...prev,
                                            [ticket.id]: prev[ticket.id]?.filter((_, i) => i !== idx) || []
                                          }));
                                        }}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          color: 'var(--text-secondary)',
                                          cursor: 'pointer',
                                          padding: '0.25rem',
                                          marginLeft: 'auto'
                                        }}
                                      >
                                        <FaTimes />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <MessageTextArea
                                placeholder={t("dashboard.support.conversation.placeholder", "Type your message...")}
                                value={newMessages[ticket.id] || ''}
                                onChange={(e) => setNewMessages(prev => ({
                                  ...prev,
                                  [ticket.id]: e.target.value
                                }))}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(ticket.id);
                                  }
                                }}
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
                                  disabled={(!newMessages[ticket.id]?.trim() && (!pendingAttachments[ticket.id] || pendingAttachments[ticket.id].length === 0)) || uploadingFiles[ticket.id]}
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
                                accept="image/*,video/*"
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
                      style={{
                        backgroundColor: currentPage === page ? 'var(--primary)' : undefined,
                        color: currentPage === page ? 'white' : undefined,
                      }}
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

        {/* Create Ticket Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <ModalOverlay
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseCreateModal}
            >
              <CreateTicketModal
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <ModalHeader>
                  <ModalTitle>
                    <FaTicketAlt />
                    {t("dashboard.support.createTicket", "Create Support Ticket")}
                  </ModalTitle>
                  <CloseButton onClick={handleCloseCreateModal}>
                    <FaTimes />
                  </CloseButton>
                </ModalHeader>

                <form onSubmit={handleCreateTicket}>
                  <FormGroup>
                    <FormLabel>
                      {t("dashboard.support.form.subject", "Subject")} *
                    </FormLabel>
                    <FormInput
                      type="text"
                      placeholder={t("dashboard.support.form.subjectPlaceholder", "Brief description of your issue")}
                      value={createTicketForm.subject}
                      onChange={(e) => setCreateTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                      required
                    />
                  </FormGroup>

                  <FormGroup>
                    <FormLabel>
                      {t("dashboard.support.form.description", "Description")} *
                    </FormLabel>
                    <FormTextarea
                      placeholder={t("dashboard.support.form.descriptionPlaceholder", "Please provide details about your issue...")}
                      value={createTicketForm.description}
                      onChange={(e) => setCreateTicketForm(prev => ({ ...prev, description: e.target.value }))}
                      required
                    />
                  </FormGroup>

                  {createTicketError && (
                    <ErrorMessage>{createTicketError}</ErrorMessage>
                  )}

                  {createTicketSuccess && (
                    <SuccessMessage>{createTicketSuccess}</SuccessMessage>
                  )}

                  <FormActions>
                    <CancelButton type="button" onClick={handleCloseCreateModal}>
                      {t("dashboard.support.form.cancel", "Cancel")}
                    </CancelButton>
                    <SubmitButton type="submit" disabled={createTicketLoading}>
                      {createTicketLoading 
                        ? t("dashboard.support.form.creating", "Creating...")
                        : t("dashboard.support.form.create", "Create Ticket")}
                    </SubmitButton>
                  </FormActions>
                </form>
              </CreateTicketModal>
            </ModalOverlay>
          )}
        </AnimatePresence>
      </TicketsContainer>
    </>
  );
}

export default SupportPage;

