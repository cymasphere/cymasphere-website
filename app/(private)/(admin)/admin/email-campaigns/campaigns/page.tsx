"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaEnvelopeOpen, 
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlay,
  FaPause,
  FaChartLine,
  FaCalendarAlt,
  FaUsers,
  FaEnvelope,
  FaEllipsisV,
  FaClone,
  FaDownload
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useRouter } from "next/navigation";

const CampaignsContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const CampaignsTitle = styled.h1`
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

const CampaignsSubtitle = styled.p`
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
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(108, 99, 255, 0.4);
  }

  svg {
    font-size: 0.9rem;
  }
`;

const CampaignsGrid = styled.div`
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
  padding: 1rem;
  text-align: left;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.9rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: var(--text);
    background-color: rgba(255, 255, 255, 0.02);
  }

  &:nth-child(2), &:nth-child(3), &:nth-child(4), &:nth-child(5), &:nth-child(6) {
    text-align: center;
  }

  &:last-child {
    text-align: center;
    cursor: default;
    &:hover {
      background-color: transparent;
    }
  }
`;

const TableBody = styled.tbody``;

const TableRow = styled(motion.tr)`
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;
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

  &:nth-child(2), &:nth-child(3), &:nth-child(4), &:nth-child(5), &:nth-child(6) {
    text-align: center;
  }

  &:last-child {
    text-align: center;
  }
`;

const CampaignTitle = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const CampaignDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  
  ${(props) => {
    switch (props.status) {
      case 'active':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'paused':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'draft':
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
      case 'completed':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      default:
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
    }
  }}
`;

const MetricValue = styled.div`
  font-weight: 600;
  color: var(--text);
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 6px 10px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-width: 32px;
  height: 32px;
  justify-content: center;

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
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--text);
          }
        `;
    }
  }}
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

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button<{ active: boolean }>`
  padding: 12px 20px;
  border: none;
  background: none;
  color: ${props => props.active ? 'var(--primary)' : 'var(--text-secondary)'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  font-size: 0.9rem;

  &:hover {
    color: var(--primary);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
`;

function CampaignsPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'drafts' | 'scheduled' | 'sent'>('all');
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/email-campaigns/campaigns', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📧 Fetched campaigns:', data);
          setCampaigns(data.campaigns || []);
        } else {
          console.error('Failed to fetch campaigns:', response.status);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

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

  if (languageLoading || !translationsLoaded || loading) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const filteredCampaigns = campaigns.filter((campaign: any) => {
    // First filter by search term
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then filter by tab
    switch (activeTab) {
      case 'drafts':
        return campaign.status === 'draft';
      case 'scheduled':
        return campaign.status === 'scheduled' || (campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date());
      case 'sent':
        return campaign.status === 'sent' || campaign.status === 'completed';
      case 'all':
      default:
        return true;
    }
  });

  const stats = [
    {
      value: campaigns.length.toString(),
      label: "Total Campaigns",
    },
    {
      value: campaigns.filter((c: any) => c.status === "draft").length.toString(),
      label: "Draft Campaigns",
    },
    {
      value: campaigns.filter((c: any) => c.status === "scheduled" || (c.scheduled_at && new Date(c.scheduled_at) > new Date())).length.toString(),
      label: "Scheduled",
    },
    {
      value: campaigns.filter((c: any) => c.status === "sent" || c.status === "completed").length.toString(),
      label: "Sent Campaigns",
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

  const handleCampaignAction = (action: string, campaignId: string) => {
    console.log(`${action} campaign:`, campaignId);
    setOpenDropdown(null); // Close dropdown after action
    
    if (action === 'create') {
      router.push('/admin/email-campaigns/campaigns/create');
    } else if (action === 'edit') {
      // Check if campaign is sent - prevent editing
      const campaign = campaigns.find(c => c.id === campaignId);
      if (campaign && (campaign.status === 'sent' || campaign.status === 'completed')) {
        alert('Sent campaigns cannot be edited.');
        return;
      }
      router.push(`/admin/email-campaigns/campaigns/create?edit=${campaignId}`);
    }
    // Other actions like pause, resume, delete can be implemented here
  };

  const handleDropdownToggle = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === campaignId ? null : campaignId);
  };

  return (
    <>
      <NextSEO
        title="Email Campaigns"
        description="Manage and monitor your email marketing campaigns"
      />
      
      <CampaignsContainer>
        <CampaignsTitle>
          <FaEnvelopeOpen />
          Email Campaigns
        </CampaignsTitle>
        <CampaignsSubtitle>
          Create, manage, and monitor your email marketing campaigns
        </CampaignsSubtitle>

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
          <SearchContainer>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <ActionButton variant="primary" onClick={() => handleCampaignAction('create', '')}>
            <FaPlus />
            Create Campaign
          </ActionButton>
        </ActionsRow>

        <TabsContainer>
          <Tab active={activeTab === 'all'} onClick={() => setActiveTab('all')}>
            All
          </Tab>
          <Tab active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')}>
            Drafts
          </Tab>
          <Tab active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')}>
            Scheduled
          </Tab>
          <Tab active={activeTab === 'sent'} onClick={() => setActiveTab('sent')}>
            Sent
          </Tab>
        </TabsContainer>

        <CampaignsGrid>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Campaign</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Recipients</TableHeaderCell>
                <TableHeaderCell>Open Rate</TableHeaderCell>
                <TableHeaderCell>Click Rate</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <TableCell colSpan={7}>
                    <EmptyState>
                      <FaEnvelopeOpen />
                      <h3>No campaigns found</h3>
                      <p>Try adjusting your search criteria or create a new campaign.</p>
                    </EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredCampaigns.map((campaign: any, index: number) => (
                  <TableRow
                    key={campaign.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    onClick={() => {
                      // Prevent editing sent campaigns
                      if (campaign.status === 'sent' || campaign.status === 'completed') {
                        alert('Sent campaigns cannot be edited.');
                        return;
                      }
                      handleCampaignAction('edit', campaign.id);
                    }}
                  >
                    <TableCell>
                      <CampaignTitle>{campaign.name || 'Untitled'}</CampaignTitle>
                      <CampaignDescription>{campaign.subject || campaign.description || 'No description'}</CampaignDescription>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status || 'draft'}>{campaign.status || 'draft'}</StatusBadge>
                    </TableCell>
                    <TableCell>
                      <MetricValue>{campaign.total_recipients || 0}</MetricValue>
                    </TableCell>
                    <TableCell>
                      <MetricValue>0%</MetricValue>
                    </TableCell>
                    <TableCell>
                      <MetricValue>0%</MetricValue>
                    </TableCell>
                    <TableCell>
                      {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ActionsContainer data-dropdown>
                        <MoreButton 
                          onClick={(e) => handleDropdownToggle(campaign.id, e)}
                          className={openDropdown === campaign.id ? 'active' : ''}
                        >
                          <FaEllipsisV />
                        </MoreButton>
                        <AnimatePresence>
                          {openDropdown === campaign.id && (
                            <DropdownMenu
                              initial={{ opacity: 0, scale: 0.8, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: -10 }}
                              transition={{ duration: 0.15 }}
                            >
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('edit', campaign.id); }}>
                                <FaEdit />
                                Edit Campaign
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('view', campaign.id); }}>
                                <FaEye />
                                View Analytics
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('clone', campaign.id); }}>
                                <FaClone />
                                Duplicate
                              </DropdownItem>
                              {campaign.status === 'active' ? (
                                <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('pause', campaign.id); }}>
                                  <FaPause />
                                  Pause Campaign
                                </DropdownItem>
                              ) : campaign.status === 'paused' ? (
                                <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('resume', campaign.id); }}>
                                  <FaPlay />
                                  Resume Campaign
                                </DropdownItem>
                              ) : null}
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('export', campaign.id); }}>
                                <FaDownload />
                                Export Data
                              </DropdownItem>
                              <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('delete', campaign.id); }}>
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
        </CampaignsGrid>
      </CampaignsContainer>
    </>
  );
}

export default CampaignsPage; 