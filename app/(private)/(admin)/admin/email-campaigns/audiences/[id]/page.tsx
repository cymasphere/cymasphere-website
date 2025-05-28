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
  FaArrowLeft,
  FaSave,
  FaTimes,
  FaFilter,
  FaUserPlus,
  FaUserMinus,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTag,
  FaChartLine,
  FaEllipsisV,
  FaCheck,
  FaCog,
  FaHistory,
  FaClone,
  FaDownload
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const AudienceContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text);
  }
`;

const AudienceTitle = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: var(--primary);
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const AudienceInfo = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const AudienceHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const AudienceDetails = styled.div`
  flex: 1;
`;

const AudienceName = styled.h2`
  color: var(--text);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
`;

const AudienceDescription = styled.div`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1rem;
  line-height: 1.5;
`;

const AudienceMeta = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.9rem;

  svg {
    color: var(--primary);
    font-size: 0.8rem;
  }
`;

const TypeBadge = styled.span<{ type: 'dynamic' | 'static' }>`
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.9rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${props => {
    switch (props.type) {
      case 'dynamic':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'static':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
    }
  }}
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    justify-content: space-between;
  }
`;

const HeaderActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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

const ContentSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  color: var(--text);
  margin: 0 0 1.5rem 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const FilterConditions = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const FilterGroup = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  padding: 1.5rem;
  background-color: rgba(255, 255, 255, 0.02);
`;

const FilterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const FilterTitle = styled.h4`
  color: var(--text);
  margin: 0;
  font-size: 1rem;
`;

const FilterRule = styled.div`
  display: grid;
  grid-template-columns: 1fr auto 1fr auto;
  gap: 1rem;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
`;

const Select = styled.select`
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const Input = styled.input`
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const RemoveButton = styled.button`
  padding: 6px;
  border: none;
  border-radius: 4px;
  background-color: rgba(220, 53, 69, 0.2);
  color: #dc3545;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(220, 53, 69, 0.3);
  }
`;

const AddRuleButton = styled.button`
  padding: 8px 16px;
  border: 1px dashed rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
  }
`;

const SubscribersTable = styled.div`
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
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  color: var(--text);
  font-size: 0.9rem;
  vertical-align: middle;
`;

const SubscriberInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const Avatar = styled.div<{ color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.8rem;
`;

const SubscriberDetails = styled.div``;

const SubscriberName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const SubscriberEmail = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
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

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1rem;
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

const SourceBadge = styled.span<{ source: 'filter' | 'manual' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  ${props => {
    switch (props.source) {
      case 'manual':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      case 'filter':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      default:
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
    }
  }}

  svg {
    font-size: 0.6rem;
  }
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  justify-content: center;
  align-items: center;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 6px 8px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
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
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--text);
          }
        `;
    }
  }}

  svg {
    font-size: 0.7rem;
  }
`;

// Mock audience data
const getAudienceData = (id: string) => {
  const audiences: Record<string, any> = {
    "1": {
      id: "1",
      name: "Highly Engaged Users",
      description: "Users who opened emails in the last 30 days and clicked at least once",
      type: "dynamic" as const,
      subscribers: 4567,
      createdAt: "2024-01-10",
      lastUpdated: "2024-01-22",
      filters: [
        {
          id: "1",
          field: "email_opens",
          operator: "greater_than",
          value: "0",
          timeframe: "30_days"
        },
        {
          id: "2", 
          field: "email_clicks",
          operator: "greater_than",
          value: "0",
          timeframe: "30_days"
        }
      ]
    },
    "3": {
      id: "3",
      name: "Music Producers",
      description: "Professional music producers and beatmakers",
      type: "static" as const,
      subscribers: 1890,
      createdAt: "2024-01-05",
      lastUpdated: "2024-01-20",
      filters: []
    }
  };
  
  return audiences[id] || audiences["1"];
};

// Mock subscribers data for static audiences
const mockSubscribers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    status: "active",
    subscribeDate: "2024-01-15",
    lastActivity: "2024-01-20",
    engagement: "High",
    source: "filter" as const
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah.chen@example.com", 
    status: "active",
    subscribeDate: "2024-01-10",
    lastActivity: "2024-01-22",
    engagement: "Medium",
    source: "filter" as const
  },
  {
    id: "3",
    name: "Mike Rodriguez",
    email: "mike.rodriguez@example.com",
    status: "unsubscribed",
    subscribeDate: "2023-12-20",
    lastActivity: "2024-01-18",
    engagement: "Low",
    source: "manual" as const
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    status: "active",
    subscribeDate: "2024-01-18",
    lastActivity: "2024-01-21",
    engagement: "High",
    source: "filter" as const
  },
  {
    id: "5",
    name: "David Kim",
    email: "david.kim@example.com",
    status: "active",
    subscribeDate: "2024-01-12",
    lastActivity: "2024-01-19",
    engagement: "Medium",
    source: "manual" as const
  }
];

function AudienceDetailPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [audienceData, setAudienceData] = useState<any>(null);
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const audienceId = params.id as string;

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  useEffect(() => {
    if (audienceId) {
      setAudienceData(getAudienceData(audienceId));
    }
  }, [audienceId]);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user || !audienceData) {
    return <LoadingComponent />;
  }

  const filteredSubscribers = mockSubscribers.filter(subscriber =>
    subscriber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    subscriber.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (name: string) => {
    const colors = ['#6c63ff', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleSave = () => {
    console.log('Saving audience:', audienceData);
    setEditMode(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this audience?')) {
      console.log('Deleting audience:', audienceId);
      router.push('/admin/email-campaigns/audiences');
    }
  };

  const addFilterRule = () => {
    const newRule = {
      id: Date.now().toString(),
      field: "email_opens",
      operator: "greater_than", 
      value: "",
      timeframe: "30_days"
    };
    
    setAudienceData((prev: any) => ({
      ...prev,
      filters: [...prev.filters, newRule]
    }));
  };

  const removeFilterRule = (ruleId: string) => {
    setAudienceData((prev: any) => ({
      ...prev,
      filters: prev.filters.filter((filter: any) => filter.id !== ruleId)
    }));
  };

  const updateFilterRule = (ruleId: string, field: string, value: string) => {
    setAudienceData((prev: any) => ({
      ...prev,
      filters: prev.filters.map((filter: any) =>
        filter.id === ruleId ? { ...filter, [field]: value } : filter
      )
    }));
  };

  const handleRemoveSubscriber = (subscriberId: string) => {
    // Implement the logic to remove a subscriber from the audience
    console.log('Removing subscriber:', subscriberId);
  };

  return (
    <>
      <NextSEO
        title={`Audience: ${audienceData.name}`}
        description={`Manage ${audienceData.name} audience and subscribers`}
      />
      
      <AudienceContainer>
        <Header>
          <BackButton href="/admin/email-campaigns/audiences">
            <FaArrowLeft />
            Back to Audiences
          </BackButton>
          <AudienceTitle>
            <FaUsers />
            Audience Details
          </AudienceTitle>
        </Header>

        <AudienceInfo>
          <AudienceHeader>
            <AudienceDetails>
              <AudienceName>{audienceData.name}</AudienceName>
              <AudienceDescription>{audienceData.description}</AudienceDescription>
              <AudienceMeta>
                <MetaItem>
                  <TypeBadge type={audienceData.type}>
                    {audienceData.type === 'dynamic' ? '🔄 Dynamic' : '📌 Static'}
                  </TypeBadge>
                </MetaItem>
                <MetaItem>
                  <FaUsers />
                  {audienceData.subscribers.toLocaleString()} subscribers
                </MetaItem>
                <MetaItem>
                  <FaCalendarAlt />
                  Created {new Date(audienceData.createdAt).toLocaleDateString()}
                </MetaItem>
                <MetaItem>
                  <FaHistory />
                  Updated {new Date(audienceData.lastUpdated).toLocaleDateString()}
                </MetaItem>
              </AudienceMeta>
            </AudienceDetails>
            <ActionButtons>
              {editMode ? (
                <>
                  <HeaderActionButton onClick={() => setEditMode(false)}>
                    <FaTimes />
                    Cancel
                  </HeaderActionButton>
                  <HeaderActionButton variant="primary" onClick={handleSave}>
                    <FaSave />
                    Save Changes
                  </HeaderActionButton>
                </>
              ) : (
                <>
                  <HeaderActionButton onClick={() => setEditMode(true)}>
                    <FaEdit />
                    Edit
                  </HeaderActionButton>
                  <HeaderActionButton onClick={() => console.log('Duplicate audience')}>
                    <FaClone />
                    Duplicate
                  </HeaderActionButton>
                  <HeaderActionButton onClick={() => console.log('Export audience')}>
                    <FaDownload />
                    Export
                  </HeaderActionButton>
                  <HeaderActionButton variant="danger" onClick={handleDelete}>
                    <FaTrash />
                    Delete
                  </HeaderActionButton>
                </>
              )}
            </ActionButtons>
          </AudienceHeader>
        </AudienceInfo>

        {audienceData.type === 'dynamic' ? (
          <>
            <ContentSection>
              <SectionTitle>
                <FaFilter />
                Filter Conditions
              </SectionTitle>
              <FilterConditions>
                <FilterGroup>
                  <FilterHeader>
                    <FilterTitle>Conditions (Match ALL)</FilterTitle>
                    {editMode && (
                      <AddRuleButton onClick={addFilterRule}>
                        <FaPlus />
                        Add Rule
                      </AddRuleButton>
                    )}
                  </FilterHeader>
                  
                  {audienceData.filters.map((filter: any) => (
                    <FilterRule key={filter.id}>
                      <Select
                        value={filter.field}
                        onChange={(e) => updateFilterRule(filter.id, 'field', e.target.value)}
                        disabled={!editMode}
                      >
                        <option value="email_opens">Email Opens</option>
                        <option value="email_clicks">Email Clicks</option>
                        <option value="last_activity">Last Activity</option>
                        <option value="subscription_date">Subscription Date</option>
                        <option value="engagement_score">Engagement Score</option>
                      </Select>
                      
                      <Select
                        value={filter.operator}
                        onChange={(e) => updateFilterRule(filter.id, 'operator', e.target.value)}
                        disabled={!editMode}
                      >
                        <option value="greater_than">Greater Than</option>
                        <option value="less_than">Less Than</option>
                        <option value="equals">Equals</option>
                        <option value="contains">Contains</option>
                      </Select>
                      
                      <Input
                        type="text"
                        value={filter.value}
                        onChange={(e) => updateFilterRule(filter.id, 'value', e.target.value)}
                        disabled={!editMode}
                        placeholder="Value"
                      />
                      
                      {editMode && (
                        <RemoveButton onClick={() => removeFilterRule(filter.id)}>
                          <FaTimes />
                        </RemoveButton>
                      )}
                    </FilterRule>
                  ))}
                  
                  {audienceData.filters.length === 0 && (
                    <EmptyState>
                      <FaFilter />
                      <h3>No filter conditions</h3>
                      <p>Add filter conditions to define this dynamic audience.</p>
                    </EmptyState>
                  )}
                </FilterGroup>
              </FilterConditions>
            </ContentSection>

            <ContentSection>
              <SectionTitle>
                <FaUsers />
                Subscribers ({filteredSubscribers.length})
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--text-secondary)', 
                  fontWeight: 'normal',
                  marginLeft: '0.5rem'
                }}>
                  - Based on filter criteria + manual additions/exclusions
                </span>
              </SectionTitle>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <SearchContainer style={{ marginBottom: 0 }}>
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
                
                <HeaderActionButton 
                  variant="primary" 
                  onClick={() => console.log('Add subscriber manually')}
                  style={{ marginLeft: '1rem' }}
                >
                  <FaUserPlus />
                  Add Subscriber
                </HeaderActionButton>
              </div>

              <SubscribersTable>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHeaderCell>Subscriber</TableHeaderCell>
                      <TableHeaderCell>Status</TableHeaderCell>
                      <TableHeaderCell>Subscribe Date</TableHeaderCell>
                      <TableHeaderCell>Last Activity</TableHeaderCell>
                      <TableHeaderCell>Engagement</TableHeaderCell>
                      <TableHeaderCell>Source</TableHeaderCell>
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
                            <p>Try adjusting your search criteria or filter conditions.</p>
                          </EmptyState>
                        </TableCell>
                      </tr>
                    ) : (
                      filteredSubscribers.map((subscriber) => (
                        <TableRow key={subscriber.id}>
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
                            <span style={{ 
                              color: subscriber.engagement === 'High' ? '#28a745' : 
                                     subscriber.engagement === 'Medium' ? '#ffc107' : '#dc3545',
                              fontWeight: '600'
                            }}>
                              {subscriber.engagement}
                            </span>
                          </TableCell>
                          <TableCell>
                            <SourceBadge source={subscriber.source || 'filter'}>
                              {subscriber.source === 'manual' ? (
                                <>
                                  <FaUserPlus />
                                  Manual
                                </>
                              ) : (
                                <>
                                  <FaFilter />
                                  Filter
                                </>
                              )}
                            </SourceBadge>
                          </TableCell>
                          <TableCell>
                            <ActionsContainer>
                              <ActionButton 
                                variant="danger" 
                                onClick={() => handleRemoveSubscriber(subscriber.id)}
                                title="Remove from audience"
                              >
                                <FaTimes />
                              </ActionButton>
                            </ActionsContainer>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </SubscribersTable>
            </ContentSection>
          </>
        ) : (
          <ContentSection>
            <SectionTitle>
              <FaUsers />
              Subscribers ({filteredSubscribers.length})
            </SectionTitle>
            
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

            <SubscribersTable>
              <Table>
                <TableHeader>
                  <tr>
                    <TableHeaderCell>Subscriber</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Subscribe Date</TableHeaderCell>
                    <TableHeaderCell>Last Activity</TableHeaderCell>
                    <TableHeaderCell>Engagement</TableHeaderCell>
                    <TableHeaderCell>Actions</TableHeaderCell>
                  </tr>
                </TableHeader>
                <TableBody>
                  {filteredSubscribers.length === 0 ? (
                    <tr>
                      <TableCell colSpan={6}>
                        <EmptyState>
                          <FaUsers />
                          <h3>No subscribers found</h3>
                          <p>Try adjusting your search criteria.</p>
                        </EmptyState>
                      </TableCell>
                    </tr>
                  ) : (
                    filteredSubscribers.map((subscriber) => (
                      <TableRow key={subscriber.id}>
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
                          <span style={{ 
                            color: subscriber.engagement === 'High' ? '#28a745' : 
                                   subscriber.engagement === 'Medium' ? '#ffc107' : '#dc3545',
                            fontWeight: '600'
                          }}>
                            {subscriber.engagement}
                          </span>
                        </TableCell>
                        <TableCell>
                          <ActionsContainer>
                            <ActionButton 
                              variant="danger" 
                              onClick={() => handleRemoveSubscriber(subscriber.id)}
                              title="Remove from audience"
                            >
                              <FaTimes />
                            </ActionButton>
                          </ActionsContainer>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </SubscribersTable>
          </ContentSection>
        )}
      </AudienceContainer>
    </>
  );
}

export default AudienceDetailPage; 