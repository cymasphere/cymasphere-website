"use client";
import React, { useState, useEffect } from "react";
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
  FaClock
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";
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
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
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

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  display: flex;
  align-items: center;
  justify-content: space-between;

  svg {
    color: var(--text-secondary);
    font-size: 0.8rem;
  }
`;

const TableBody = styled.tbody``;

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
`;

const TicketId = styled.span`
  font-family: monospace;
  background-color: rgba(255, 255, 255, 0.05);
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const TicketSubject = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const TicketUser = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: fit-content;
  
  ${(props) => {
    switch (props.status) {
      case 'open':
        return `
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        `;
      case 'inProgress':
        return `
          background-color: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        `;
      case 'resolved':
        return `
          background-color: rgba(108, 99, 255, 0.1);
          color: var(--primary);
          border: 1px solid rgba(108, 99, 255, 0.2);
        `;
      case 'closed':
        return `
          background-color: rgba(128, 128, 128, 0.1);
          color: #888;
          border: 1px solid rgba(128, 128, 128, 0.2);
        `;
      default:
        return `
          background-color: rgba(128, 128, 128, 0.1);
          color: #888;
          border: 1px solid rgba(128, 128, 128, 0.2);
        `;
    }
  }}
`;

const PriorityBadge = styled.span<{ priority: string }>`
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  width: fit-content;
  
  ${(props) => {
    switch (props.priority) {
      case 'urgent':
        return `
          background-color: rgba(220, 53, 69, 0.1);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.2);
        `;
      case 'high':
        return `
          background-color: rgba(255, 102, 0, 0.1);
          color: #ff6600;
          border: 1px solid rgba(255, 102, 0, 0.2);
        `;
      case 'medium':
        return `
          background-color: rgba(255, 193, 7, 0.1);
          color: #ffc107;
          border: 1px solid rgba(255, 193, 7, 0.2);
        `;
      case 'low':
        return `
          background-color: rgba(40, 167, 69, 0.1);
          color: #28a745;
          border: 1px solid rgba(40, 167, 69, 0.2);
        `;
      default:
        return `
          background-color: rgba(128, 128, 128, 0.1);
          color: #888;
          border: 1px solid rgba(128, 128, 128, 0.2);
        `;
    }
  }}
`;

const AssignedTo = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  font-style: italic;
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const TicketActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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
`;

const PaginationButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-left: auto;
`;

const PaginationButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  
  ${(props) => props.active 
    ? `
      background-color: var(--primary);
      color: white;
    `
    : `
      background-color: rgba(255, 255, 255, 0.05);
      color: var(--text-secondary);
      &:hover {
        background-color: rgba(255, 255, 255, 0.1);
        color: var(--text);
      }
    `
  }
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
  const itemsPerPage = 10;
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

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
                <TableRow key={ticket.id}>
                  <TableCell>
                    <TicketId>{ticket.id}</TicketId>
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
                    <ActionButtons>
                      <TicketActionButton variant="primary" title={t("admin.supportTickets.ticketActions.view", "View Ticket")}>
                        <FaEye />
                      </TicketActionButton>
                      <TicketActionButton title={t("admin.supportTickets.ticketActions.reply", "Reply")}>
                        <FaReply />
                      </TicketActionButton>
                      <TicketActionButton title={t("admin.supportTickets.ticketActions.assign", "Assign")}>
                        <FaUserCog />
                      </TicketActionButton>
                      <TicketActionButton variant="danger" title={t("admin.supportTickets.ticketActions.close", "Close Ticket")}>
                        <FaTimes />
                      </TicketActionButton>
                    </ActionButtons>
                  </TableCell>
                </TableRow>
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
                {t("common.previous", "Previous")}
              </PaginationButton>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationButton
                  key={page}
                  active={page === currentPage}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </PaginationButton>
              ))}
              <PaginationButton 
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                {t("common.next", "Next")}
              </PaginationButton>
            </PaginationButtons>
          </Pagination>
        </TableContainer>
      </TicketsContainer>
    </>
  );
}

export default SupportTicketsPage; 