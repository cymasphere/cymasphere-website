"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaChartLine, 
  FaArrowLeft,
  FaEnvelopeOpen,
  FaMousePointer,
  FaUsers,
  FaCalendarAlt,
  FaArrowUp,
  FaArrowDown,
  FaFilter,
  FaDownload,
  FaEye,
  FaEnvelope,
  FaUserTimes,
  FaExclamationTriangle,
  FaChevronRight,
  FaMapMarkerAlt,
  FaClock,
  FaShare,
  FaHeart,
  FaReply
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";

const AnalyticsContainer = styled.div`
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

const Header = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const CampaignTitle = styled.h1`
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
  }
`;

const CampaignMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
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

  strong {
    color: var(--text);
  }
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  
  ${(props) => {
    switch (props.status) {
      case 'sent':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'sending':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'draft':
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
      case 'failed':
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

const FiltersRow = styled.div`
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

const FilterGroup = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;

  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const Select = styled.select`
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

const ExportButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text);
  }
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const MetricCard = styled(motion.div)<{ variant?: string }>`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: ${props => {
      switch (props.variant) {
        case 'success': return 'linear-gradient(90deg, #28a745, #20c997)';
        case 'warning': return 'linear-gradient(90deg, #ffc107, #fd7e14)';
        case 'danger': return 'linear-gradient(90deg, #dc3545, #e83e8c)';
        case 'info': return 'linear-gradient(90deg, #17a2b8, #6f42c1)';
        default: return 'linear-gradient(90deg, var(--primary), var(--accent))';
      }
    }};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MetricIcon = styled.div<{ variant?: string }>`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  background-color: ${props => {
    switch (props.variant) {
      case 'success': return 'rgba(40, 167, 69, 0.1)';
      case 'warning': return 'rgba(255, 193, 7, 0.1)';
      case 'danger': return 'rgba(220, 53, 69, 0.1)';
      case 'info': return 'rgba(23, 162, 184, 0.1)';
      default: return 'rgba(108, 99, 255, 0.1)';
    }
  }};
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      case 'info': return '#17a2b8';
      default: return 'var(--primary)';
    }
  }};
`;

const MetricChange = styled.div<{ positive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8rem;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  font-weight: 600;
`;

const MetricValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;
  line-height: 1;
`;

const MetricLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: linear-gradient(135deg, rgba(108, 99, 255, 0.1), rgba(78, 205, 196, 0.1));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  border: 1px dashed rgba(255, 255, 255, 0.1);
`;

const DetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const DetailCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
`;

const DetailHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const DetailTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeaderCell = styled.th`
  padding: 1rem 1.5rem;
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
  }

  &:last-child {
    border-bottom: none;
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

const ActivityBadge = styled.span<{ type: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
  
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

// Mock data
const mockCampaign = {
  id: "1",
  title: "Product Launch Campaign",
  subject: "🎵 Introducing Our New Synthesizer Features!",
  status: "sent",
  sentDate: "2024-01-18",
  sentTime: "10:00 AM",
  totalSent: 5420,
  delivered: 5380,
  opens: 1678,
  uniqueOpens: 1456,
  clicks: 312,
  uniqueClicks: 287,
  unsubscribes: 23,
  bounces: 40,
  complaints: 2,
  openRate: 31.2,
  clickRate: 5.8,
  unsubscribeRate: 0.4,
  bounceRate: 0.7,
  deliveryRate: 99.3
};

const mockMetrics = [
  {
    label: "Delivery Rate",
    value: "99.3%",
    change: "+0.2%",
    positive: true,
    icon: FaEnvelope,
    variant: "success"
  },
  {
    label: "Open Rate",
    value: "31.2%",
    change: "+2.1%",
    positive: true,
    icon: FaEnvelopeOpen,
    variant: "primary"
  },
  {
    label: "Click Rate",
    value: "5.8%",
    change: "+0.3%",
    positive: true,
    icon: FaMousePointer,
    variant: "info"
  },
  {
    label: "Unsubscribe Rate",
    value: "0.4%",
    change: "-0.1%",
    positive: true,
    icon: FaUserTimes,
    variant: "warning"
  },
  {
    label: "Bounce Rate",
    value: "0.7%",
    change: "+0.1%",
    positive: false,
    icon: FaExclamationTriangle,
    variant: "danger"
  },
  {
    label: "Engagement Score",
    value: "8.2/10",
    change: "+0.5",
    positive: true,
    icon: FaChartLine,
    variant: "success"
  }
];

const mockTopPerformers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    activity: "clicked",
    timestamp: "2024-01-18 10:15:00",
    location: "New York, US"
  },
  {
    id: "2",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    activity: "opened",
    timestamp: "2024-01-18 10:05:00",
    location: "San Francisco, US"
  },
  {
    id: "3",
    name: "Mike Rodriguez",
    email: "mike.rodriguez@example.com",
    activity: "clicked",
    timestamp: "2024-01-18 11:30:00",
    location: "Los Angeles, US"
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@example.com",
    activity: "opened",
    timestamp: "2024-01-18 09:45:00",
    location: "London, UK"
  },
  {
    id: "5",
    name: "David Kim",
    email: "david.kim@example.com",
    activity: "clicked",
    timestamp: "2024-01-18 14:20:00",
    location: "Seoul, KR"
  }
];

const mockGeographicData = [
  { country: "United States", opens: 856, clicks: 167, percentage: 51.0 },
  { country: "United Kingdom", opens: 234, clicks: 45, percentage: 13.9 },
  { country: "Canada", opens: 189, clicks: 38, percentage: 11.3 },
  { country: "Germany", opens: 145, clicks: 29, percentage: 8.6 },
  { country: "Australia", opens: 98, clicks: 19, percentage: 5.8 },
  { country: "France", opens: 87, clicks: 14, percentage: 5.2 },
  { country: "Other", opens: 69, clicks: 0, percentage: 4.2 }
];

function CampaignAnalyticsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState("24h");
  
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <>
      <NextSEO
        title={`Analytics: ${mockCampaign.title}`}
        description="Detailed campaign performance analytics and metrics"
      />
      
      <AnalyticsContainer>
        <BackButton href={`/admin/email-campaigns/campaigns/${params.id}`}>
          <FaArrowLeft />
          Back to Campaign
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/campaigns">Campaigns</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href={`/admin/email-campaigns/campaigns/${params.id}`}>{mockCampaign.title}</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>Analytics</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <CampaignTitle>
            <FaChartLine />
            Campaign Analytics
          </CampaignTitle>
          <CampaignMeta>
            <MetaItem>
              <StatusBadge status={mockCampaign.status}>{mockCampaign.status}</StatusBadge>
            </MetaItem>
            <MetaItem>
              <FaCalendarAlt />
              Sent on <strong>{new Date(mockCampaign.sentDate).toLocaleDateString()}</strong> at <strong>{mockCampaign.sentTime}</strong>
            </MetaItem>
            <MetaItem>
              <FaUsers />
              <strong>{mockCampaign.totalSent.toLocaleString()}</strong> recipients
            </MetaItem>
            <MetaItem>
              <FaEnvelopeOpen />
              Subject: <strong>{mockCampaign.subject}</strong>
            </MetaItem>
          </CampaignMeta>
        </Header>

        <FiltersRow>
          <FilterGroup>
            <FaFilter style={{ color: 'var(--text-secondary)' }} />
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="1h">Last hour</option>
              <option value="24h">Last 24 hours</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </Select>
          </FilterGroup>
          <ExportButton>
            <FaDownload />
            Export Report
          </ExportButton>
        </FiltersRow>

        <MetricsGrid>
          {mockMetrics.map((metric, index) => (
            <MetricCard
              key={metric.label}
              variant={metric.variant}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <MetricHeader>
                <MetricIcon variant={metric.variant}>
                  <metric.icon />
                </MetricIcon>
                <MetricChange positive={metric.positive}>
                  {metric.positive ? <FaArrowUp /> : <FaArrowDown />}
                  {metric.change}
                </MetricChange>
              </MetricHeader>
              <MetricValue>{metric.value}</MetricValue>
              <MetricLabel>{metric.label}</MetricLabel>
            </MetricCard>
          ))}
        </MetricsGrid>

        <ChartsGrid>
          <ChartCard>
            <ChartTitle>
              <FaChartLine />
              Engagement Over Time
            </ChartTitle>
            <ChartPlaceholder>
              📊 Interactive engagement timeline chart would be rendered here
            </ChartPlaceholder>
          </ChartCard>
          
          <ChartCard>
            <ChartTitle>
              <FaMapMarkerAlt />
              Geographic Distribution
            </ChartTitle>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              {mockGeographicData.map((location, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '0.75rem 0',
                  borderBottom: index < mockGeographicData.length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                }}>
                  <div>
                    <div style={{ color: 'var(--text)', fontWeight: '500' }}>{location.country}</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {location.opens} opens, {location.clicks} clicks
                    </div>
                  </div>
                  <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                    {location.percentage}%
                  </div>
                </div>
              ))}
            </div>
          </ChartCard>
        </ChartsGrid>

        <DetailsGrid>
          <DetailCard>
            <DetailHeader>
              <DetailTitle>
                <FaUsers />
                Top Performers
              </DetailTitle>
              <ExportButton>
                <FaEye />
                View All
              </ExportButton>
            </DetailHeader>
            <Table>
              <thead>
                <tr>
                  <TableHeaderCell>Subscriber</TableHeaderCell>
                  <TableHeaderCell>Activity</TableHeaderCell>
                  <TableHeaderCell>Time</TableHeaderCell>
                </tr>
              </thead>
              <TableBody>
                {mockTopPerformers.map((performer) => (
                  <TableRow key={performer.id}>
                    <TableCell>
                      <SubscriberInfo>
                        <Avatar color={getAvatarColor(performer.name)}>
                          {performer.name.split(' ').map(n => n[0]).join('')}
                        </Avatar>
                        <SubscriberDetails>
                          <SubscriberName>{performer.name}</SubscriberName>
                          <SubscriberEmail>{performer.email}</SubscriberEmail>
                        </SubscriberDetails>
                      </SubscriberInfo>
                    </TableCell>
                    <TableCell>
                      <ActivityBadge type={performer.activity}>
                        {performer.activity}
                      </ActivityBadge>
                    </TableCell>
                    <TableCell>
                      {new Date(performer.timestamp).toLocaleTimeString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </DetailCard>

          <DetailCard>
            <DetailHeader>
              <DetailTitle>
                <FaClock />
                Campaign Timeline
              </DetailTitle>
            </DetailHeader>
            <div style={{ padding: '1.5rem' }}>
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(40, 167, 69, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(40, 167, 69, 0.2)'
                }}>
                  <div>
                    <div style={{ color: '#28a745', fontWeight: 'bold' }}>Campaign Sent</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      {mockCampaign.totalSent.toLocaleString()} emails delivered
                    </div>
                  </div>
                  <div style={{ color: '#28a745', fontSize: '0.9rem' }}>
                    {mockCampaign.sentDate} {mockCampaign.sentTime}
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(108, 99, 255, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(108, 99, 255, 0.2)'
                }}>
                  <div>
                    <div style={{ color: 'var(--primary)', fontWeight: 'bold' }}>First Opens</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Peak engagement started
                    </div>
                  </div>
                  <div style={{ color: 'var(--primary)', fontSize: '0.9rem' }}>
                    +5 minutes
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(23, 162, 184, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(23, 162, 184, 0.2)'
                }}>
                  <div>
                    <div style={{ color: '#17a2b8', fontWeight: 'bold' }}>First Clicks</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Conversion activity began
                    </div>
                  </div>
                  <div style={{ color: '#17a2b8', fontSize: '0.9rem' }}>
                    +12 minutes
                  </div>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: 'rgba(255, 193, 7, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 193, 7, 0.2)'
                }}>
                  <div>
                    <div style={{ color: '#ffc107', fontWeight: 'bold' }}>Peak Engagement</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      Highest activity period
                    </div>
                  </div>
                  <div style={{ color: '#ffc107', fontSize: '0.9rem' }}>
                    +2 hours
                  </div>
                </div>
              </div>
            </div>
          </DetailCard>
        </DetailsGrid>
      </AnalyticsContainer>
    </>
  );
}

export default CampaignAnalyticsPage; 