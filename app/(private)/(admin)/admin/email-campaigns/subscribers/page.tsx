"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaUsers, 
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaDownload,
  FaUpload,
  FaFilter,
  FaUserPlus,
  FaUserMinus,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTag,
  FaChartLine,
  FaFileExport,
  FaFileImport,
  FaEllipsisV,
  FaClone
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useRouter } from "next/navigation";

const SubscribersContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const SubscribersTitle = styled.h1`
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

const SubscribersSubtitle = styled.p`
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

const ActionsRow = styled.div`
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

const LeftActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;

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

const FilterSelect = styled.select`
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

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const RightActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  font-weight: 500;

  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return `
          background: linear-gradient(90deg, var(--primary), var(--accent));
          color: white;
          &:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
          }
        `;
      case 'danger':
        return `
          background-color: rgba(220, 53, 69, 0.2);
          color: #dc3545;
          border: 1px solid rgba(220, 53, 69, 0.3);
          &:hover {
            background-color: rgba(220, 53, 69, 0.3);
            transform: translateY(-2px);
          }
        `;
      default:
        return `
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text);
          border: 1px solid rgba(255, 255, 255, 0.2);
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            transform: translateY(-2px);
          }
        `;
    }
  }}
`;

const SubscribersGrid = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.thead`
  background-color: rgba(255, 255, 255, 0.02);
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
  text-align: left;
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const TableBody = styled.tbody``;

const TableRow = styled(motion.tr)`
  transition: all 0.2s ease;
  cursor: pointer;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 1rem 1.5rem;
  color: var(--text);
  font-size: 0.9rem;
  vertical-align: middle;
`;

const SubscriberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.div<{ color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1rem;
`;

const SubscriberDetails = styled.div``;

const SubscriberName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const SubscriberEmail = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.status) {
      case 'active':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'unsubscribed':
        return `
          background-color: rgba(220, 53, 69, 0.2);
          color: #dc3545;
        `;
      case 'bounced':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'pending':
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
      default:
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
    }
  }}
`;

const TagsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const Tag = styled.span`
  padding: 0.25rem 0.5rem;
  border-radius: 8px;
  background-color: rgba(108, 99, 255, 0.2);
  color: var(--primary);
  font-size: 0.7rem;
  font-weight: 500;
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  position: relative;
`;

const MoreButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;

  &:hover {
    background-color: var(--primary);
    color: white;
  }

  &.active {
    background-color: var(--primary);
    color: white;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 180px;
  overflow: hidden;
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--primary);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  svg {
    font-size: 0.9rem;
    width: 16px;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
  
  h3 {
    margin-bottom: 0.5rem;
    color: var(--text);
  }
`;

// Mock data
const mockSubscribers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    status: "active",
    subscribeDate: "2024-01-15",
    lastActivity: "2024-01-20",
    location: "New York, US",
    tags: ["VIP", "Producer"],
    engagement: "High",
    totalOpens: 45,
    totalClicks: 12
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    status: "active",
    subscribeDate: "2024-01-10",
    lastActivity: "2024-01-22",
    location: "San Francisco, US",
    tags: ["Beginner"],
    engagement: "Medium",
    totalOpens: 23,
    totalClicks: 5
  },
  {
    id: "3",
    name: "Mike Rodriguez",
    email: "mike.rodriguez@example.com",
    status: "unsubscribed",
    subscribeDate: "2023-12-20",
    lastActivity: "2024-01-18",
    location: "Los Angeles, US",
    tags: ["DJ", "Professional"],
    engagement: "Low",
    totalOpens: 8,
    totalClicks: 1
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    status: "active",
    subscribeDate: "2024-01-18",
    lastActivity: "2024-01-21",
    location: "London, UK",
    tags: ["Student"],
    engagement: "High",
    totalOpens: 34,
    totalClicks: 9
  },
  {
    id: "5",
    name: "David Kim",
    email: "david.kim@example.com",
    status: "bounced",
    subscribeDate: "2024-01-12",
    lastActivity: "2024-01-19",
    location: "Seoul, KR",
    tags: ["Producer", "Advanced"],
    engagement: "Medium",
    totalOpens: 18,
    totalClicks: 3
  }
];

function SubscribersPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const filteredSubscribers = mockSubscribers.filter(subscriber => {
    const matchesSearch = subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         subscriber.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || subscriber.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      value: mockSubscribers.length.toString(),
      label: "Total Subscribers",
    },
    {
      value: mockSubscribers.filter(s => s.status === "active").length.toString(),
      label: "Active Subscribers",
    },
    {
      value: mockSubscribers.filter(s => s.engagement === "High").length.toString(),
      label: "High Engagement",
    },
    {
      value: "2.3%",
      label: "Growth Rate",
    },
  ];

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  const getAvatarColor = (name: string) => {
    const colors = ['#6c63ff', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSubscriberAction = (action: string, subscriberId: string) => {
    console.log(`${action} subscriber:`, subscriberId);
    setOpenDropdown(null); // Close dropdown after action
    // Here you would implement the actual actions like edit, delete, etc.
  };

  const handleDropdownToggle = (subscriberId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === subscriberId ? null : subscriberId);
  };

  const handleSubscriberClick = (subscriber: any) => {
    router.push(`/admin/email-campaigns/subscribers/${subscriber.id}`);
  };

  return (
    <>
      <NextSEO
        title="Subscribers"
        description="Manage and analyze your email subscribers"
      />
      
      <SubscribersContainer>
        <SubscribersTitle>
          <FaUsers />
          Subscribers
        </SubscribersTitle>
        <SubscribersSubtitle>
          Manage your email subscribers, segments, and engagement analytics
        </SubscribersSubtitle>

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

        <ActionsRow>
          <LeftActions>
            <SearchContainer>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search subscribers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>
            
            <FilterSelect value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="unsubscribed">Unsubscribed</option>
              <option value="bounced">Bounced</option>
              <option value="pending">Pending</option>
            </FilterSelect>
          </LeftActions>
          
          <RightActions>
            <ActionButton onClick={() => handleSubscriberAction('import', '')}>
              <FaFileImport />
              Import
            </ActionButton>
            <ActionButton onClick={() => handleSubscriberAction('export', '')}>
              <FaFileExport />
              Export
            </ActionButton>
            <ActionButton variant="primary" onClick={() => handleSubscriberAction('add', '')}>
              <FaUserPlus />
              Add Subscriber
            </ActionButton>
          </RightActions>
        </ActionsRow>

        <SubscribersGrid>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Subscriber</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Subscribe Date</TableHeaderCell>
                <TableHeaderCell>Last Activity</TableHeaderCell>
                <TableHeaderCell>Engagement</TableHeaderCell>
                <TableHeaderCell>Tags</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <TableCell colSpan={7}>
                    <EmptyState>
                      <FaUsers />
                      <h3>No subscribers found</h3>
                      <p>Try adjusting your search criteria or add new subscribers.</p>
                    </EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredSubscribers.map((subscriber, index) => (
                  <TableRow
                    key={subscriber.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    onClick={() => handleSubscriberClick(subscriber)}
                  >
                    <TableCell>
                      <SubscriberInfo>
                        <Avatar color={getAvatarColor(subscriber.name)}>
                          {subscriber.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <SubscriberDetails>
                          <SubscriberName>{subscriber.name}</SubscriberName>
                          <SubscriberEmail>{subscriber.email}</SubscriberEmail>
                        </SubscriberDetails>
                      </SubscriberInfo>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={subscriber.status}>{subscriber.status}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.subscribeDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(subscriber.lastActivity).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--text)' }}>
                          {subscriber.engagement}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          {subscriber.totalOpens} opens, {subscriber.totalClicks} clicks
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <TagsContainer>
                        {subscriber.tags.map((tag, tagIndex) => (
                          <Tag key={tagIndex}>{tag}</Tag>
                        ))}
                      </TagsContainer>
                    </TableCell>
                    <TableCell>
                      <ActionsContainer data-dropdown>
                        <MoreButton 
                          onClick={(e) => handleDropdownToggle(subscriber.id, e)}
                          className={openDropdown === subscriber.id ? 'active' : ''}
                        >
                          <FaEllipsisV />
                        </MoreButton>
                        <AnimatePresence>
                          {openDropdown === subscriber.id && (
                            <DropdownMenu
                              initial={{ opacity: 0, scale: 0.8, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: -10 }}
                              transition={{ duration: 0.15 }}
                            >
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleSubscriberClick(subscriber); }}>
                                <FaEye />
                                View Profile
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleSubscriberAction('edit', subscriber.id); }}>
                                <FaEdit />
                                Edit Subscriber
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleSubscriberAction('email', subscriber.id); }}>
                                <FaEnvelope />
                                Send Email
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleSubscriberAction('clone', subscriber.id); }}>
                                <FaClone />
                                Duplicate
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleSubscriberAction('export', subscriber.id); }}>
                                <FaDownload />
                                Export Data
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleSubscriberAction('delete', subscriber.id); }}>
                                <FaTrash />
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          )}
                        </AnimatePresence>
                      </ActionsContainer>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </SubscribersGrid>
      </SubscribersContainer>
    </>
  );
}

export default SubscribersPage; 