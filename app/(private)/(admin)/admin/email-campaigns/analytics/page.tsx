"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaChartLine, 
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
  FaClock,
  FaCheckCircle,
  FaSpinner,
  FaEdit,
  FaPlay,
  FaPause,
  FaTrash
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const AnalyticsContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const AnalyticsTitle = styled.h1`
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

const AnalyticsSubtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
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

const MetricChange = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive: boolean }>`
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

const MetricContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
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

const TableCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
`;

const TableHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const TableTitle = styled.h3`
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

const TableHead = styled.thead`
  background-color: rgba(255, 255, 255, 0.02);
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

const CampaignName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const CampaignType = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.75rem;
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

const PerformanceMetric = styled.div`
  text-align: center;
`;

const MetricNumber = styled.div`
  font-weight: 600;
  color: var(--text);
  font-size: 0.9rem;
`;

const MetricPercent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'positive',
})<{ positive?: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.positive ? '#28a745' : props.positive === false ? '#dc3545' : 'var(--text-secondary)'};
  margin-top: 0.25rem;
`;

// Analytics interfaces
interface MetricData {
  label: string;
  value: string;
  change: string;
  positive: boolean | null;
  icon: string;
  variant: string;
}

interface CampaignData {
  id: string;
  name: string;
  type: string;
  status: string;
  sent: number;
  delivered: number;
  opens: number;
  clicks: number;
  openRate: number;
  clickRate: number;
  sentDate: string;
}

interface AnalyticsData {
  metrics: MetricData[];
  campaigns: CampaignData[];
  summary: {
    totalSent: number;
    totalDelivered: number;
    totalOpened: number;
    totalClicked: number;
    totalBounced: number;
    openRate: number;
    clickRate: number;
    bounceRate: number;
    activeSubscribers: number;
  };
}

function AnalyticsPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [campaignType, setCampaignType] = useState("all");
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/email-campaigns/analytics?timeRange=${timeRange}&campaignType=${campaignType}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const result = await response.json();
      
      if (result.success) {
        setAnalyticsData(result.data);
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
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
    if (user && translationsLoaded) {
      fetchAnalyticsData();
    }
  }, [user, translationsLoaded, timeRange, campaignType]);

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
      <AnalyticsContainer>
        <div style={{ color: 'var(--color-error)', textAlign: 'center', padding: '2rem' }}>
          <FaExclamationTriangle size={48} style={{ marginBottom: '1rem' }} />
          <h3>Error Loading Analytics</h3>
          <p>{error}</p>
          <button onClick={fetchAnalyticsData} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Retry
          </button>
        </div>
      </AnalyticsContainer>
    );
  }

  const iconMap: { [key: string]: any } = {
    FaEnvelope,
    FaEnvelopeOpen,
    FaMousePointer,
    FaUserTimes,
    FaExclamationTriangle,
    FaUsers
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
        title="Email Analytics"
        description="Comprehensive analytics and performance metrics for email campaigns"
      />
      
      <AnalyticsContainer>
        <AnalyticsTitle>
          <FaChartLine />
          Email Analytics
        </AnalyticsTitle>
        <AnalyticsSubtitle>
          Track performance, engagement, and ROI of your email marketing campaigns
        </AnalyticsSubtitle>

        <FiltersRow>
          <FilterGroup>
            <FaFilter style={{ color: 'var(--text-secondary)' }} />
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </Select>
            <Select value={campaignType} onChange={(e) => setCampaignType(e.target.value)}>
              <option value="all">All Campaigns</option>
              <option value="campaigns">Campaigns Only</option>
              <option value="automations">Automations Only</option>
            </Select>
          </FilterGroup>
          <ExportButton>
            <FaDownload />
            Export Report
          </ExportButton>
        </FiltersRow>

        <MetricsGrid>
          {analyticsData?.metrics.map((metric, index) => {
            const IconComponent = iconMap[metric.icon] || FaChartLine;
            return (
              <MetricCard
                key={metric.label}
                variant={metric.variant}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
              >
                <MetricIcon variant={metric.variant}>
                  <IconComponent />
                </MetricIcon>
                <MetricContent>
                  <MetricValue>{metric.value}</MetricValue>
                  <MetricLabel>{metric.label}</MetricLabel>
                  {metric.change !== "+0%" && metric.change !== "+0" && (
                    <MetricChange positive={metric.positive === true}>
                      {metric.change}
                    </MetricChange>
                  )}
                </MetricContent>
              </MetricCard>
            );
          })}
        </MetricsGrid>

        <ChartsGrid>
          <ChartCard>
            <ChartTitle>
              <FaChartLine />
              Email Performance Over Time
            </ChartTitle>
            <ChartPlaceholder>
              📊 Interactive chart showing email metrics over time would be rendered here
            </ChartPlaceholder>
          </ChartCard>
          
          <ChartCard>
            <ChartTitle>
              <FaUsers />
              Subscriber Growth
            </ChartTitle>
            <ChartPlaceholder>
              📈 Subscriber growth chart would be rendered here
            </ChartPlaceholder>
          </ChartCard>
        </ChartsGrid>

        <TableCard>
          <TableHeader>
            <TableTitle>
              <FaEnvelope />
              Recent Campaign Performance
            </TableTitle>
            <ExportButton>
              <FaEye />
              View All
            </ExportButton>
          </TableHeader>
          <Table>
            <TableHead>
              <tr>
                <TableHeaderCell>Campaign</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Sent</TableHeaderCell>
                <TableHeaderCell>Opens</TableHeaderCell>
                <TableHeaderCell>Clicks</TableHeaderCell>
                <TableHeaderCell>Open Rate</TableHeaderCell>
                <TableHeaderCell>Click Rate</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
              </tr>
            </TableHead>
            <TableBody>
              {analyticsData?.campaigns.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <CampaignName>{campaign.name}</CampaignName>
                    <CampaignType>{campaign.type}</CampaignType>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={campaign.status}>
                      {campaign.status}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                  <TableCell>{campaign.opens.toLocaleString()}</TableCell>
                  <TableCell>{campaign.clicks.toLocaleString()}</TableCell>
                  <TableCell>
                    <PerformanceMetric>
                      <MetricNumber>{campaign.openRate}%</MetricNumber>
                      <MetricPercent positive={campaign.openRate > 25}>
                        {campaign.openRate > 25 ? 'Good' : campaign.openRate > 15 ? 'Average' : 'Low'}
                      </MetricPercent>
                    </PerformanceMetric>
                  </TableCell>
                  <TableCell>
                    <PerformanceMetric>
                      <MetricNumber>{campaign.clickRate}%</MetricNumber>
                      <MetricPercent positive={campaign.clickRate > 3}>
                        {campaign.clickRate > 3 ? 'Good' : campaign.clickRate > 1.5 ? 'Average' : 'Low'}
                      </MetricPercent>
                    </PerformanceMetric>
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.sentDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableCard>
      </AnalyticsContainer>
    </>
  );
}

export default AnalyticsPage; 