"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaUser, 
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaArrowLeft,
  FaUsers,
  FaEnvelope,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaTag,
  FaChartLine,
  FaEllipsisV,
  FaCheck,
  FaTimes,
  FaCog,
  FaHistory,
  FaSave
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const SubscriberContainer = styled.div`
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
  justify-content: space-between;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
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

const SubscriberTitle = styled.h1`
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

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
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

const SubscriberInfo = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 2rem;
  align-items: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    text-align: center;
  }
`;

const Avatar = styled.div<{ color: string }>`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: ${props => props.color};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 1.8rem;
`;

const Details = styled.div``;

const SubscriberName = styled.h2`
  color: var(--text);
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
`;

const SubscriberEmail = styled.div`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 1rem;
`;

const SubscriberMeta = styled.div`
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

const StatusBadge = styled.span<{ status: string }>`
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 0.9rem;
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
`;

const SectionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
`;

const SectionTitle = styled.h3`
  color: var(--text);
  margin: 0;
  font-size: 1.2rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: var(--primary);
  }
`;

const Form = styled.form`
  display: grid;
  gap: 1.5rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 600px) {
    grid-template-columns: 1fr;
  }
`;

const FormField = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  color: var(--text);
  font-weight: 500;
  font-size: 0.9rem;
`;

const Input = styled.input`
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
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

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const SearchContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
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

const AudiencesList = styled.div`
  display: grid;
  gap: 1rem;
`;

const AudienceItem = styled.div<{ isMember: boolean }>`
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid ${props => props.isMember ? 'rgba(40, 167, 69, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  background-color: ${props => props.isMember ? 'rgba(40, 167, 69, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  display: flex;
  align-items: center;
  justify-content: space-between;
  transition: all 0.2s ease;

  &:hover {
    border-color: ${props => props.isMember ? 'rgba(40, 167, 69, 0.5)' : 'rgba(255, 255, 255, 0.2)'};
  }
`;

const AudienceItemInfo = styled.div`
  flex: 1;
`;

const AudienceItemName = styled.h4`
  color: var(--text);
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
`;

const AudienceItemDescription = styled.p`
  color: var(--text-secondary);
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.4;
`;

const ToggleButton = styled.button<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;

  ${props => props.isActive ? `
    background-color: rgba(220, 53, 69, 0.2);
    color: #dc3545;
    &:hover {
      background-color: rgba(220, 53, 69, 0.3);
    }
  ` : `
    background-color: rgba(40, 167, 69, 0.2);
    color: #28a745;
    &:hover {
      background-color: rgba(40, 167, 69, 0.3);
    }
  `}
`;

const MembershipBadge = styled.span<{ isMember: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${props => props.isMember ? `
    background-color: rgba(40, 167, 69, 0.2);
    color: #28a745;
  ` : `
    background-color: rgba(108, 117, 125, 0.2);
    color: #6c757d;
  `}
`;

const BulkActions = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
`;

const BulkButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  font-weight: 500;

  ${props => props.variant === 'primary' ? `
    background-color: rgba(40, 167, 69, 0.2);
    color: #28a745;
    &:hover {
      background-color: rgba(40, 167, 69, 0.3);
    }
  ` : `
    background-color: rgba(108, 117, 125, 0.2);
    color: #6c757d;
    &:hover {
      background-color: rgba(108, 117, 125, 0.3);
    }
  `}
`;

// Mock data
const mockAudiences = [
  {
    id: "1",
    name: "Highly Engaged Users",
    description: "Users who opened emails in the last 30 days and clicked at least once",
    subscribers: 4567,
    type: "dynamic" as const
  },
  {
    id: "2",
    name: "New Subscribers", 
    description: "Users who joined in the last 7 days",
    subscribers: 234,
    type: "dynamic" as const
  },
  {
    id: "3",
    name: "Music Producers",
    description: "Professional music producers and beatmakers", 
    subscribers: 1890,
    type: "static" as const
  },
  {
    id: "4",
    name: "Inactive Users",
    description: "Users who haven't opened emails in 60+ days",
    subscribers: 2156,
    type: "dynamic" as const
  },
  {
    id: "5",
    name: "Premium Subscribers",
    description: "Users with active premium subscriptions",
    subscribers: 892,
    type: "dynamic" as const
  },
  {
    id: "6",
    name: "Beta Testers",
    description: "Users participating in beta programs",
    subscribers: 145,
    type: "static" as const
  }
];

// Helper function to generate avatar color
const getAvatarColor = (name: string) => {
  const colors = ['#6c63ff', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
  return colors[name.charCodeAt(0) % colors.length];
};

function SubscriberDetailPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [subscriberAudiences, setSubscriberAudiences] = useState<{[key: string]: boolean}>({});
  const [subscriber, setSubscriber] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();
  const params = useParams();
  const subscriberId = params.id as string;

  // Fetch subscriber data from API
  const fetchSubscriberData = async () => {
    if (!subscriberId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/email-campaigns/subscribers/${subscriberId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          setError('Subscriber not found');
        } else if (response.status === 401 || response.status === 403) {
          setError('Access denied');
        } else {
          setError('Failed to load subscriber data');
        }
        return;
      }
      
      const data = await response.json();
      setSubscriber(data.subscriber);
      
      // Initialize form data with real subscriber data
      setFormData({
        name: data.subscriber.name || '',
        email: data.subscriber.email || '',
        status: data.subscriber.status || 'active',
        location: data.subscriber.location || 'Unknown',
        engagement: data.subscriber.engagement || 'Medium'
      });

      // Mock subscriber audience memberships (this could be enhanced with real API data later)
      const mockMemberships = {
        "1": true,  // Highly Engaged Users
        "2": false, // New Subscribers
        "3": true,  // Music Producers
        "4": false, // Inactive Users
        "5": false, // Premium Subscribers
        "6": true   // Beta Testers
      };
      setSubscriberAudiences(mockMemberships);
      
    } catch (error) {
      console.error('Error fetching subscriber:', error);
      setError('Failed to load subscriber data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  useEffect(() => {
    if (translationsLoaded && user && subscriberId) {
      fetchSubscriberData();
    }
  }, [translationsLoaded, user, subscriberId]);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return (
      <SubscriberContainer>
        <Header>
          <HeaderLeft>
            <BackButton href="/admin/email-campaigns/subscribers">
              <FaArrowLeft />
              Back to Subscribers
            </BackButton>
            <SubscriberTitle>
              <FaUser />
              Subscriber Details
            </SubscriberTitle>
          </HeaderLeft>
        </Header>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Error</h3>
          <p>{error}</p>
          <ActionButton onClick={() => router.push('/admin/email-campaigns/subscribers')}>
            Back to Subscribers
          </ActionButton>
        </div>
      </SubscriberContainer>
    );
  }

  if (!subscriber) {
    return (
      <SubscriberContainer>
        <Header>
          <HeaderLeft>
            <BackButton href="/admin/email-campaigns/subscribers">
              <FaArrowLeft />
              Back to Subscribers
            </BackButton>
            <SubscriberTitle>
              <FaUser />
              Subscriber Details
            </SubscriberTitle>
          </HeaderLeft>
        </Header>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h3>Subscriber not found</h3>
          <ActionButton onClick={() => router.push('/admin/email-campaigns/subscribers')}>
            Back to Subscribers
          </ActionButton>
        </div>
      </SubscriberContainer>
    );
  }

  const filteredAudiences = mockAudiences.filter(audience =>
    audience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    audience.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAudienceToggle = (audienceId: string) => {
    setSubscriberAudiences((prev: {[key: string]: boolean}) => ({
      ...prev,
      [audienceId]: !prev[audienceId]
    }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/api/email-campaigns/subscribers/${subscriber.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        // Refresh subscriber data
        await fetchSubscriberData();
        setEditMode(false);
      } else {
        console.error('Failed to update subscriber');
      }
    } catch (error) {
      console.error('Error updating subscriber:', error);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this subscriber?')) {
      console.log('Deleting subscriber:', subscriber.id);
      // Here you would make API call to delete
      router.push('/admin/email-campaigns/subscribers');
    }
  };

  const handleBulkAddAll = () => {
    const newMemberships: {[key: string]: boolean} = {};
    mockAudiences.forEach(audience => {
      newMemberships[audience.id] = true;
    });
    setSubscriberAudiences(newMemberships);
  };

  const handleBulkRemoveAll = () => {
    const newMemberships: {[key: string]: boolean} = {};
    mockAudiences.forEach(audience => {
      newMemberships[audience.id] = false;
    });
    setSubscriberAudiences(newMemberships);
  };

  return (
    <>
      <NextSEO
        title={`Subscriber: ${subscriber.name}`}
        description={`Manage details and audience assignments for ${subscriber.name}`}
      />
      
      <SubscriberContainer>
        <Header>
          <HeaderLeft>
            <BackButton href="/admin/email-campaigns/subscribers">
              <FaArrowLeft />
              Back to Subscribers
            </BackButton>
            <SubscriberTitle>
              <FaUser />
              Subscriber Details
            </SubscriberTitle>
          </HeaderLeft>
          <HeaderActions>
            {editMode ? (
              <>
                <ActionButton onClick={() => setEditMode(false)}>
                  Cancel
                </ActionButton>
                <ActionButton variant="primary" onClick={handleSave}>
                  <FaSave />
                  Save Changes
                </ActionButton>
              </>
            ) : (
              <>
                <ActionButton variant="danger" onClick={handleDelete}>
                  <FaTrash />
                  Delete
                </ActionButton>
                <ActionButton onClick={() => setEditMode(true)}>
                  <FaEdit />
                  Edit
                </ActionButton>
                <ActionButton onClick={() => console.log('Send email to:', subscriber.email)}>
                  <FaEnvelope />
                  Send Email
                </ActionButton>
              </>
            )}
          </HeaderActions>
        </Header>

        <SubscriberInfo>
          <Avatar color={getAvatarColor(subscriber.name)}>
            {subscriber.name.split(' ').map((n: string) => n[0]).join('')}
          </Avatar>
          <Details>
            <SubscriberName>{subscriber.name}</SubscriberName>
            <SubscriberEmail>{subscriber.email}</SubscriberEmail>
            <SubscriberMeta>
              <MetaItem>
                <FaCalendarAlt />
                Joined {new Date(subscriber.subscribeDate).toLocaleDateString()}
              </MetaItem>
              <MetaItem>
                <FaHistory />
                Last active {new Date(subscriber.lastActivity).toLocaleDateString()}
              </MetaItem>
              <MetaItem>
                <FaMapMarkerAlt />
                {subscriber.location}
              </MetaItem>
              <MetaItem>
                <FaChartLine />
                {subscriber.engagement} engagement
              </MetaItem>
              <MetaItem>
                <FaEnvelope />
                {subscriber.totalOpens} opens, {subscriber.totalClicks} clicks
              </MetaItem>
            </SubscriberMeta>
          </Details>
          <StatusBadge status={subscriber.status}>
            {subscriber.status}
          </StatusBadge>
        </SubscriberInfo>

        <ContentGrid>
          <Section>
            <SectionHeader>
              <SectionTitle>
                <FaEdit />
                Subscriber Information
              </SectionTitle>
            </SectionHeader>

            <Form>
              <FormRow>
                <FormField>
                  <Label>Name</Label>
                  <Input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    disabled={!editMode}
                    placeholder="Enter subscriber name"
                  />
                </FormField>
                <FormField>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleFormChange('email', e.target.value)}
                    disabled={!editMode}
                    placeholder="Enter email address"
                  />
                </FormField>
              </FormRow>
              <FormRow>
                <FormField>
                  <Label>Status</Label>
                  <Select
                    value={formData.status || ''}
                    onChange={(e) => handleFormChange('status', e.target.value)}
                    disabled={!editMode}
                  >
                    <option value="active">Active</option>
                    <option value="unsubscribed">Unsubscribed</option>
                    <option value="bounced">Bounced</option>
                    <option value="pending">Pending</option>
                  </Select>
                </FormField>
                <FormField>
                  <Label>Location</Label>
                  <Input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => handleFormChange('location', e.target.value)}
                    disabled={!editMode}
                    placeholder="Enter location"
                  />
                </FormField>
              </FormRow>
              <FormField>
                <Label>Engagement Level</Label>
                <Select
                  value={formData.engagement || ''}
                  onChange={(e) => handleFormChange('engagement', e.target.value)}
                  disabled={!editMode}
                >
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </Select>
              </FormField>
            </Form>
          </Section>

          <Section>
            <SectionHeader>
              <SectionTitle>
                <FaUsers />
                Audience Memberships
              </SectionTitle>
            </SectionHeader>

            <SearchContainer>
              <SearchIcon>
                <FaSearch />
              </SearchIcon>
              <SearchInput
                type="text"
                placeholder="Search audiences..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </SearchContainer>

            {editMode && (
              <BulkActions>
                <BulkButton variant="primary" onClick={handleBulkAddAll}>
                  <FaCheck />
                  Add All
                </BulkButton>
                <BulkButton onClick={handleBulkRemoveAll}>
                  <FaTimes />
                  Remove All
                </BulkButton>
              </BulkActions>
            )}

            <AudiencesList>
              {filteredAudiences.map((audience) => (
                <AudienceItem key={audience.id} isMember={subscriberAudiences[audience.id] || false}>
                  <AudienceItemInfo>
                    <AudienceItemName>{audience.name}</AudienceItemName>
                    <AudienceItemDescription>{audience.description}</AudienceItemDescription>
                  </AudienceItemInfo>
                  {editMode ? (
                    <ToggleButton
                      isActive={subscriberAudiences[audience.id] || false}
                      onClick={() => handleAudienceToggle(audience.id)}
                    >
                      {subscriberAudiences[audience.id] ? (
                        <>
                          <FaTimes />
                          Remove
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          Add
                        </>
                      )}
                    </ToggleButton>
                  ) : (
                    <MembershipBadge isMember={subscriberAudiences[audience.id] || false}>
                      {subscriberAudiences[audience.id] ? (
                        <>
                          <FaCheck />
                          Member
                        </>
                      ) : (
                        <>
                          <FaTimes />
                          Not Member
                        </>
                      )}
                    </MembershipBadge>
                  )}
                </AudienceItem>
              ))}
            </AudiencesList>
          </Section>
        </ContentGrid>
      </SubscriberContainer>
    </>
  );
}

export default SubscriberDetailPage; 