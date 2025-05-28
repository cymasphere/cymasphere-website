"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaUser, 
  FaArrowLeft,
  FaEdit,
  FaTrash,
  FaEnvelope,
  FaChevronRight,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaChartLine,
  FaTag,
  FaEye,
  FaMousePointer,
  FaUserTimes,
  FaUserCheck,
  FaHistory,
  FaDownload,
  FaPlus,
  FaTimes,
  FaCheck,
  FaExclamationTriangle
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";

const ProfileContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Breadcrumbs = styled.nav`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 2rem;
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const BreadcrumbLink = styled(Link)`
  color: var(--text-secondary);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: var(--primary);
  }
`;

const BreadcrumbCurrent = styled.span`
  color: var(--text);
  font-weight: 500;
`;

const BackButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
  margin-bottom: 1rem;

  &:hover {
    color: var(--primary);
  }
`;

const ProfileHeader = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const ProfileTop = styled.div`
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

const ProfileInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex: 1;

  @media (max-width: 768px) {
    flex-direction: column;
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
  font-size: 2rem;
  flex-shrink: 0;
`;

const ProfileDetails = styled.div`
  flex: 1;
`;

const ProfileName = styled.h1`
  font-size: 2rem;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const ProfileEmail = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
`;

const ProfileMeta = styled.div`
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: center;
  }
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);

  svg {
    color: var(--primary);
  }
`;

const ProfileActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    justify-content: center;
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

const StatusBadge = styled.span<{ status: string }>`
  padding: 6px 12px;
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

const TagsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-top: 1rem;
`;

const Tag = styled.span`
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 0.8rem;
  font-weight: 500;
  background-color: rgba(108, 99, 255, 0.2);
  color: var(--primary);
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const RemoveTagButton = styled.button`
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  padding: 0;
  margin-left: 0.25rem;
  opacity: 0.7;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
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
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const StatCard = styled.div`
  text-align: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const StatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ActivityList = styled.div`
  max-height: 400px;
  overflow-y: auto;
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div<{ type: string }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8rem;
  flex-shrink: 0;
  
  ${(props) => {
    switch (props.type) {
      case 'opened':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'clicked':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      case 'bounced':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'unsubscribed':
        return `
          background-color: rgba(220, 53, 69, 0.2);
          color: #dc3545;
        `;
      default:
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
    }
  }}
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityTitle = styled.div`
  color: var(--text);
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ActivityDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
`;

const ActivityTime = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  white-space: nowrap;
`;

const AddTagForm = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
`;

const TagInput = styled.input`
  flex: 1;
  padding: 8px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.8rem;

  &:focus {
    outline: none;
    border-color: var(--primary);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const AddTagButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  background-color: var(--primary);
  color: white;
  cursor: pointer;
  font-size: 0.8rem;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--accent);
  }
`;

// Mock data
const mockSubscriber = {
  id: "1",
  name: "Alex Johnson",
  email: "alex.johnson@example.com",
  status: "active",
  subscribeDate: "2024-01-15",
  lastActivity: "2024-01-20",
  location: "New York, US",
  tags: ["VIP", "Producer", "Beta Tester"],
  engagement: "High",
  totalOpens: 45,
  totalClicks: 12,
  totalEmails: 67,
  averageOpenRate: 67.2,
  averageClickRate: 17.9,
  lastOpenDate: "2024-01-20",
  lastClickDate: "2024-01-19",
  source: "Website signup",
  ipAddress: "192.168.1.1",
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
};

const mockActivity = [
  {
    id: "1",
    type: "opened",
    title: "Opened: Welcome Series #3",
    description: "Opened email about getting started with synthesis",
    timestamp: "2024-01-20 14:30:00"
  },
  {
    id: "2",
    type: "clicked",
    title: "Clicked: Tutorial Link",
    description: "Clicked on 'Learn More About Pads' in Welcome Series #3",
    timestamp: "2024-01-20 14:32:00"
  },
  {
    id: "3",
    type: "opened",
    title: "Opened: Newsletter #47",
    description: "Opened weekly newsletter about new features",
    timestamp: "2024-01-19 09:15:00"
  },
  {
    id: "4",
    type: "clicked",
    title: "Clicked: Feature Update",
    description: "Clicked on 'Try New Reverb Effects' in Newsletter #47",
    timestamp: "2024-01-19 09:18:00"
  },
  {
    id: "5",
    type: "opened",
    title: "Opened: Product Launch",
    description: "Opened announcement about new synthesizer features",
    timestamp: "2024-01-18 16:45:00"
  }
];

function SubscriberProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [subscriber, setSubscriber] = useState(mockSubscriber);
  const [newTag, setNewTag] = useState("");
  
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

  const getAvatarColor = (name: string) => {
    const colors = ['#6c63ff', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const handleAction = (action: string) => {
    console.log(`${action} subscriber:`, subscriber.id);
    // Implement action logic here
  };

  const addTag = () => {
    if (newTag.trim() && !subscriber.tags.includes(newTag.trim())) {
      setSubscriber({
        ...subscriber,
        tags: [...subscriber.tags, newTag.trim()]
      });
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSubscriber({
      ...subscriber,
      tags: subscriber.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'opened': return <FaEye />;
      case 'clicked': return <FaMousePointer />;
      case 'bounced': return <FaExclamationTriangle />;
      case 'unsubscribed': return <FaUserTimes />;
      default: return <FaEnvelope />;
    }
  };

  return (
    <>
      <NextSEO
        title={`Subscriber: ${subscriber.name}`}
        description="View detailed subscriber profile and engagement history"
      />
      
      <ProfileContainer>
        <BackButton href="/admin/email-campaigns/subscribers">
          <FaArrowLeft />
          Back to Subscribers
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/subscribers">Subscribers</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>{subscriber.name}</BreadcrumbCurrent>
        </Breadcrumbs>

        <ProfileHeader>
          <ProfileTop>
            <ProfileInfo>
              <Avatar color={getAvatarColor(subscriber.name)}>
                {subscriber.name.split(' ').map(n => n[0]).join('')}
              </Avatar>
              <ProfileDetails>
                <ProfileName>{subscriber.name}</ProfileName>
                <ProfileEmail>{subscriber.email}</ProfileEmail>
                <ProfileMeta>
                  <MetaItem>
                    <StatusBadge status={subscriber.status}>{subscriber.status}</StatusBadge>
                  </MetaItem>
                  <MetaItem>
                    <FaMapMarkerAlt />
                    {subscriber.location}
                  </MetaItem>
                  <MetaItem>
                    <FaCalendarAlt />
                    Joined {new Date(subscriber.subscribeDate).toLocaleDateString()}
                  </MetaItem>
                  <MetaItem>
                    <FaChartLine />
                    {subscriber.engagement} engagement
                  </MetaItem>
                </ProfileMeta>
              </ProfileDetails>
            </ProfileInfo>
            <ProfileActions>
              <ActionButton onClick={() => handleAction('edit')}>
                <FaEdit />
                Edit
              </ActionButton>
              <ActionButton onClick={() => handleAction('email')}>
                <FaEnvelope />
                Send Email
              </ActionButton>
              <ActionButton variant="danger" onClick={() => handleAction('delete')}>
                <FaTrash />
                Delete
              </ActionButton>
            </ProfileActions>
          </ProfileTop>

          <TagsContainer>
            {subscriber.tags.map((tag, index) => (
              <Tag key={index}>
                <FaTag />
                {tag}
                <RemoveTagButton onClick={() => removeTag(tag)}>
                  <FaTimes />
                </RemoveTagButton>
              </Tag>
            ))}
            <AddTagForm>
              <TagInput
                type="text"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add new tag"
                onKeyPress={(e) => e.key === 'Enter' && addTag()}
              />
              <AddTagButton onClick={addTag}>
                <FaPlus />
              </AddTagButton>
            </AddTagForm>
          </TagsContainer>
        </ProfileHeader>

        <ContentGrid>
          <Section>
            <SectionTitle>
              <FaChartLine />
              Engagement Statistics
            </SectionTitle>
            <StatsGrid>
              <StatCard>
                <StatValue>{subscriber.totalEmails}</StatValue>
                <StatLabel>Emails Sent</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{subscriber.totalOpens}</StatValue>
                <StatLabel>Total Opens</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{subscriber.totalClicks}</StatValue>
                <StatLabel>Total Clicks</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{subscriber.averageOpenRate}%</StatValue>
                <StatLabel>Open Rate</StatLabel>
              </StatCard>
              <StatCard>
                <StatValue>{subscriber.averageClickRate}%</StatValue>
                <StatLabel>Click Rate</StatLabel>
              </StatCard>
            </StatsGrid>
            
            <div style={{ marginTop: '1.5rem' }}>
              <h4 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Additional Details</h4>
              <div style={{ display: 'grid', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Activity:</span>
                  <span style={{ color: 'var(--text)' }}>{new Date(subscriber.lastActivity).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Opened:</span>
                  <span style={{ color: 'var(--text)' }}>{new Date(subscriber.lastOpenDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Last Clicked:</span>
                  <span style={{ color: 'var(--text)' }}>{new Date(subscriber.lastClickDate).toLocaleDateString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Source:</span>
                  <span style={{ color: 'var(--text)' }}>{subscriber.source}</span>
                </div>
              </div>
            </div>
          </Section>

          <Section>
            <SectionTitle>
              <FaHistory />
              Recent Activity
            </SectionTitle>
            <ActivityList>
              {mockActivity.map((activity) => (
                <ActivityItem key={activity.id}>
                  <ActivityIcon type={activity.type}>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityContent>
                    <ActivityTitle>{activity.title}</ActivityTitle>
                    <ActivityDescription>{activity.description}</ActivityDescription>
                  </ActivityContent>
                  <ActivityTime>
                    {new Date(activity.timestamp).toLocaleDateString()} {new Date(activity.timestamp).toLocaleTimeString()}
                  </ActivityTime>
                </ActivityItem>
              ))}
            </ActivityList>
          </Section>
        </ContentGrid>
      </ProfileContainer>
    </>
  );
}

export default SubscriberProfilePage; 