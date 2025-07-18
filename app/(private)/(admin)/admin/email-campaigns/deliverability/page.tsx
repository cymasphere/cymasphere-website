"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaShieldAlt, 
  FaSearch,
  FaFilter,
  FaDownload,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaChartLine,
  FaEnvelopeOpen,
  FaBan,
  FaExclamationTriangle as FaSpam,
  FaServer,
  FaGlobe,
  FaCalendarAlt,
  FaUsers,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaInfoCircle,
  FaEye,
  FaEdit,
  FaTrash,
  FaSync,
  FaCog,
  FaFlag,
  FaExternalLinkAlt,
  FaEllipsisV
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import TableLoadingRow from "@/components/common/TableLoadingRow";

const DeliverabilityContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const DeliverabilityTitle = styled.h1`
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

const DeliverabilitySubtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const OverviewGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const OverviewCard = styled(motion.div)<{ variant?: string }>`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success': return 'rgba(40, 167, 69, 0.3)';
      case 'warning': return 'rgba(255, 193, 7, 0.3)';
      case 'danger': return 'rgba(220, 53, 69, 0.3)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: ${props => {
      switch (props.variant) {
        case 'success': return 'linear-gradient(90deg, #28a745, #20c997)';
        case 'warning': return 'linear-gradient(90deg, #ffc107, #fd7e14)';
        case 'danger': return 'linear-gradient(90deg, #dc3545, #e83e8c)';
        default: return 'linear-gradient(90deg, var(--primary), var(--accent))';
      }
    }};
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const CardTitle = styled.h3`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const CardIcon = styled.div<{ variant?: string }>`
  font-size: 1.2rem;
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      default: return 'var(--primary)';
    }
  }};
`;

const CardValue = styled.div<{ variant?: string }>`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      default: return 'var(--text)';
    }
  }};
  margin-bottom: 0.5rem;
`;

const CardChange = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const SectionContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  margin-bottom: 2rem;
`;

const SectionHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: var(--primary);
  }
`;

const SectionActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;

  ${(props) => {
    switch (props.variant) {
      case 'primary':
        return `
          background-color: var(--primary);
          color: white;
          &:hover {
            background-color: var(--accent);
          }
        `;
      case 'danger':
        return `
          background-color: #dc3545;
          color: white;
          &:hover {
            background-color: #c82333;
          }
        `;
      default:
        return `
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.1);
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--text);
          }
        `;
    }
  }}
`;

const FiltersRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const LeftFilters = styled.div`
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
  max-width: 300px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
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
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const FilterSelect = styled.select`
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
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
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: var(--text);
  }
`;

const TableBody = styled.tbody`
  overflow: visible;
`;

const TableRow = styled(motion.tr)`
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
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${(props) => {
    switch (props.status) {
      case 'delivered':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'bounced':
        return `
          background-color: rgba(220, 53, 69, 0.2);
          color: #dc3545;
        `;
      case 'spam':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'blocked':
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
      default:
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
    }
  }}
`;

const ReputationScore = styled.div<{ score: number }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${props => {
    if (props.score >= 80) return '#28a745';
    if (props.score >= 60) return '#ffc107';
    return '#dc3545';
  }};
`;

const ScoreBar = styled.div`
  width: 60px;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
`;

const ScoreFill = styled.div<{ score: number }>`
  height: 100%;
  width: ${props => props.score}%;
  background-color: ${props => {
    if (props.score >= 80) return '#28a745';
    if (props.score >= 60) return '#ffc107';
    return '#dc3545';
  }};
  transition: width 0.3s ease;
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
const mockDeliverabilityData = {
  overview: {
    deliveryRate: 94.2,
    bounceRate: 3.1,
    spamRate: 2.7,
    reputation: 87
  },
  domains: [
    {
      id: "1",
      domain: "gmail.com",
      reputation: 92,
      delivered: 15420,
      bounced: 234,
      spam: 156,
      blocked: 45,
      lastChecked: "2024-01-20T10:30:00Z"
    },
    {
      id: "2", 
      domain: "outlook.com",
      reputation: 88,
      delivered: 8930,
      bounced: 167,
      spam: 89,
      blocked: 23,
      lastChecked: "2024-01-20T10:25:00Z"
    },
    {
      id: "3",
      domain: "yahoo.com", 
      reputation: 85,
      delivered: 6750,
      bounced: 145,
      spam: 78,
      blocked: 34,
      lastChecked: "2024-01-20T10:20:00Z"
    },
    {
      id: "4",
      domain: "apple.com",
      reputation: 90,
      delivered: 4320,
      bounced: 67,
      spam: 23,
      blocked: 12,
      lastChecked: "2024-01-20T10:15:00Z"
    }
  ],
  bounces: [
    {
      id: "1",
      email: "user1@example.com",
      domain: "example.com",
      type: "hard",
      reason: "Mailbox does not exist",
      campaign: "Newsletter #45",
      timestamp: "2024-01-20T09:45:00Z"
    },
    {
      id: "2",
      email: "user2@company.org",
      domain: "company.org", 
      type: "soft",
      reason: "Mailbox full",
      campaign: "Product Update",
      timestamp: "2024-01-20T09:30:00Z"
    },
    {
      id: "3",
      email: "contact@business.net",
      domain: "business.net",
      type: "hard", 
      reason: "Domain does not exist",
      campaign: "Welcome Series",
      timestamp: "2024-01-20T09:15:00Z"
    }
  ]
};

function DeliverabilityPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [domainFilter, setDomainFilter] = useState("all");
  const [bounceFilter, setBounceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState<'domains' | 'bounces'>('domains');
  const [deliverabilityData, setDeliverabilityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  useEffect(() => {
    const fetchDeliverabilityData = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/email-campaigns/deliverability', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          console.log('✅ Real deliverability data loaded:', data);
          console.log('📊 Domains in response:', data.domains?.length || 0);
          console.log('📊 Bounces in response:', data.bounces?.length || 0);
          console.log('📊 Sample domain:', data.domains?.[0]);
          console.log('📊 Sample bounce:', data.bounces?.[0]);
          setDeliverabilityData(data);
        } else {
          console.error('Failed to fetch deliverability data:', response.status, response.statusText);
          console.log('🔄 Falling back to mock data');
          // Fall back to mock data if API fails
          setDeliverabilityData(mockDeliverabilityData);
        }
      } catch (error) {
        console.error('Error fetching deliverability data:', error);
        // Fall back to mock data if API fails
        setDeliverabilityData(mockDeliverabilityData);
      } finally {
        setLoading(false);
      }
    };

    if (translationsLoaded && user) {
      fetchDeliverabilityData();
    }
  }, [translationsLoaded, user]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setOpenDropdown(null);
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Early returns after all hooks have been called
  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const filteredDomains = deliverabilityData?.domains?.filter((domain: any) => {
    const matchesSearch = domain.domain.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const filteredBounces = deliverabilityData?.bounces?.filter((bounce: any) => {
    const matchesSearch = bounce.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         bounce.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = bounceFilter === "all" || bounce.type === bounceFilter;
    return matchesSearch && matchesFilter;
  }) || [];

  // Debug what's being displayed
  console.log('🖥️ Displaying domains:', filteredDomains.length, filteredDomains);
  console.log('🖥️ Displaying bounces:', filteredBounces.length, filteredBounces);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  const handleDomainAction = (action: string, domainId: string) => {
    console.log(`${action} domain:`, domainId);
    // Implement domain actions here
  };

  const handleBounceAction = (action: string, bounceId: string) => {
    console.log(`${action} bounce:`, bounceId);
    // Implement bounce actions here
  };

  const handleRefresh = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/email-campaigns/deliverability', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Real deliverability data refreshed:', data);
        console.log('📊 Refreshed - Domains:', data.domains?.length || 0);
        console.log('📊 Refreshed - Bounces:', data.bounces?.length || 0);
        setDeliverabilityData(data);
      }
    } catch (error) {
      console.error('Error refreshing deliverability data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDropdownToggle = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === id ? null : id);
  };

  return (
    <>
      <NextSEO
        title="Email Deliverability"
        description="Monitor email deliverability, reputation, and bounce management"
      />
      
      <DeliverabilityContainer>
        <DeliverabilityTitle>
          <FaShieldAlt />
          Email Deliverability
        </DeliverabilityTitle>
        <DeliverabilitySubtitle>
          Monitor your email reputation, delivery rates, and manage bounces
          {deliverabilityData?.metadata && (
            <span style={{ display: 'block', marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              <span style={{ color: 'var(--primary)', fontWeight: '600' }}>
                • Live data from {deliverabilityData.metadata.totalCampaigns} campaigns
              </span>
              {deliverabilityData.metadata.totalSent > 0 && (
                <span style={{ marginLeft: '1rem' }}>
                  • {deliverabilityData.metadata.totalSent.toLocaleString()} emails sent
                </span>
              )}
              {deliverabilityData.metadata.totalSubscribers > 0 && (
                <span style={{ marginLeft: '1rem' }}>
                  • {deliverabilityData.metadata.totalSubscribers.toLocaleString()} active subscribers
                </span>
              )}
            </span>
          )}
        </DeliverabilitySubtitle>

        <OverviewGrid>
          <OverviewCard
            variant="success"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <CardHeader>
              <CardTitle>Delivery Rate</CardTitle>
              <CardIcon variant="success">
                <FaCheckCircle />
              </CardIcon>
            </CardHeader>
            <CardValue variant="success">{deliverabilityData?.overview?.deliveryRate || 0}%</CardValue>
            <CardChange positive={true}>
              <FaArrowUp />
              +2.3% from last month
            </CardChange>
          </OverviewCard>

          <OverviewCard
            variant="danger"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <CardHeader>
              <CardTitle>Bounce Rate</CardTitle>
              <CardIcon variant="danger">
                <FaBan />
              </CardIcon>
            </CardHeader>
            <CardValue variant="danger">{deliverabilityData?.overview?.bounceRate || 0}%</CardValue>
            <CardChange positive={false}>
              <FaArrowDown />
              -0.5% from last month
            </CardChange>
          </OverviewCard>

          <OverviewCard
            variant="warning"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <CardHeader>
              <CardTitle>Spam Rate</CardTitle>
              <CardIcon variant="warning">
                <FaSpam />
              </CardIcon>
            </CardHeader>
            <CardValue variant="warning">{deliverabilityData?.overview?.spamRate || 0}%</CardValue>
            <CardChange positive={false}>
              <FaArrowUp />
              +0.2% from last month
            </CardChange>
          </OverviewCard>

          <OverviewCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <CardHeader>
              <CardTitle>Reputation Score</CardTitle>
              <CardIcon>
                <FaShieldAlt />
              </CardIcon>
            </CardHeader>
            <CardValue>{deliverabilityData?.overview?.reputation || 0}</CardValue>
            <CardChange positive={true}>
              <FaArrowUp />
              +3 points this month
            </CardChange>
          </OverviewCard>
        </OverviewGrid>

        <SectionContainer>
          <SectionHeader>
            <SectionTitle>
              <FaServer />
              Domain Reputation
            </SectionTitle>
            <SectionActions>
              <ActionButton onClick={() => setActiveTab('domains')} variant={activeTab === 'domains' ? 'primary' : 'secondary'}>
                <FaGlobe />
                Domains
              </ActionButton>
              <ActionButton onClick={() => setActiveTab('bounces')} variant={activeTab === 'bounces' ? 'primary' : 'secondary'}>
                <FaBan />
                Bounces
              </ActionButton>
              <ActionButton onClick={handleRefresh} disabled={loading}>
                <FaSync />
                {loading ? 'Loading...' : 'Refresh'}
              </ActionButton>
              <ActionButton>
                <FaDownload />
                Export
              </ActionButton>
            </SectionActions>
          </SectionHeader>

          <FiltersRow>
            <LeftFilters>
              <SearchContainer>
                <SearchIcon>
                  <FaSearch />
                </SearchIcon>
                <SearchInput
                  type="text"
                  placeholder={activeTab === 'domains' ? "Search domains..." : "Search bounces..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </SearchContainer>
              
              {activeTab === 'bounces' && (
                <FilterSelect value={bounceFilter} onChange={(e) => setBounceFilter(e.target.value)}>
                  <option value="all">All Bounces</option>
                  <option value="hard">Hard Bounces</option>
                  <option value="soft">Soft Bounces</option>
                </FilterSelect>
              )}
            </LeftFilters>
          </FiltersRow>

          {activeTab === 'domains' ? (
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Domain</TableHeaderCell>
                  <TableHeaderCell>Reputation</TableHeaderCell>
                  <TableHeaderCell>Delivered</TableHeaderCell>
                  <TableHeaderCell>Bounced</TableHeaderCell>
                  <TableHeaderCell>Spam</TableHeaderCell>
                  <TableHeaderCell>Last Checked</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {loading || !deliverabilityData ? (
                  <TableLoadingRow colSpan={7} message="Loading domains..." />
                ) : filteredDomains.length === 0 ? (
                  <tr>
                    <TableCell colSpan={7}>
                      <EmptyState>
                        <FaServer />
                        <h3>No domains found</h3>
                        <p>Try adjusting your search criteria.</p>
                      </EmptyState>
                    </TableCell>
                  </tr>
                ) : (
                  filteredDomains.map((domain: any, index: number) => (
                    <TableRow
                      key={domain.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      onClick={() => handleDomainAction('view', domain.id)}
                    >
                      <TableCell>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FaGlobe style={{ color: 'var(--primary)' }} />
                          {domain.domain}
                        </div>
                      </TableCell>
                      <TableCell>
                        <ReputationScore score={domain.reputation}>
                          {domain.reputation}
                          <ScoreBar>
                            <ScoreFill score={domain.reputation} />
                          </ScoreBar>
                        </ReputationScore>
                      </TableCell>
                      <TableCell>{domain.delivered.toLocaleString()}</TableCell>
                      <TableCell>
                        <span style={{ color: '#dc3545' }}>{domain.bounced.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <span style={{ color: '#ffc107' }}>{domain.spam.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        {new Date(domain.lastChecked).toLocaleString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionsContainer data-dropdown>
                          <MoreButton 
                            onClick={(e) => handleDropdownToggle(domain.id, e)}
                            className={openDropdown === domain.id ? 'active' : ''}
                          >
                            <FaEllipsisV />
                          </MoreButton>
                          <AnimatePresence>
                            {openDropdown === domain.id && (
                              <DropdownMenu
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                transition={{ duration: 0.15 }}
                              >
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleDomainAction('view', domain.id); }}>
                            <FaEye />
                                View Details
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleDomainAction('analyze', domain.id); }}>
                            <FaChartLine />
                                Analyze Performance
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleDomainAction('settings', domain.id); }}>
                            <FaCog />
                                Domain Settings
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleDomainAction('test', domain.id); }}>
                                <FaFlag />
                                Test Deliverability
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleDomainAction('export', domain.id); }}>
                                <FaExternalLinkAlt />
                                                                 Export Report
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
          ) : (
            <Table>
              <TableHeader>
                <tr>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Type</TableHeaderCell>
                  <TableHeaderCell>Reason</TableHeaderCell>
                  <TableHeaderCell>Campaign</TableHeaderCell>
                  <TableHeaderCell>Timestamp</TableHeaderCell>
                  <TableHeaderCell>Actions</TableHeaderCell>
                </tr>
              </TableHeader>
              <TableBody>
                {loading || !deliverabilityData ? (
                  <TableLoadingRow colSpan={6} message="Loading bounces..." />
                ) : filteredBounces.length === 0 ? (
                  <tr>
                    <TableCell colSpan={6}>
                      <EmptyState>
                        <FaBan />
                        <h3>No bounces found</h3>
                        <p>Try adjusting your search criteria or filters.</p>
                      </EmptyState>
                    </TableCell>
                  </tr>
                ) : (
                  filteredBounces.map((bounce: any, index: number) => (
                    <TableRow
                      key={bounce.id}
                      variants={cardVariants}
                      initial="hidden"
                      animate="visible"
                      custom={index}
                      onClick={() => handleBounceAction('view', bounce.id)}
                    >
                      <TableCell>
                        <div>
                          <div style={{ fontWeight: '500' }}>{bounce.email}</div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                            {bounce.domain}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={bounce.type === 'hard' ? 'bounced' : 'spam'}>
                          {bounce.type} bounce
                        </StatusBadge>
                      </TableCell>
                      <TableCell>{bounce.reason}</TableCell>
                      <TableCell>{bounce.campaign}</TableCell>
                      <TableCell>
                        {new Date(bounce.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <ActionsContainer data-dropdown>
                          <MoreButton 
                            onClick={(e) => handleDropdownToggle(bounce.id, e)}
                            className={openDropdown === bounce.id ? 'active' : ''}
                          >
                            <FaEllipsisV />
                          </MoreButton>
                          <AnimatePresence>
                            {openDropdown === bounce.id && (
                              <DropdownMenu
                                initial={{ opacity: 0, scale: 0.8, y: -10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.8, y: -10 }}
                                transition={{ duration: 0.15 }}
                              >
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleBounceAction('view', bounce.id); }}>
                            <FaEye />
                                View Details
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleBounceAction('retry', bounce.id); }}>
                                <FaSync />
                                Retry Send
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleBounceAction('suppress', bounce.id); }}>
                            <FaBan />
                                Suppress Email
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleBounceAction('export', bounce.id); }}>
                                <FaDownload />
                                Export Data
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleBounceAction('delete', bounce.id); }}>
                            <FaTrash />
                                                                 Delete Record
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
          )}
        </SectionContainer>
      </DeliverabilityContainer>
    </>
  );
}

export default DeliverabilityPage; 