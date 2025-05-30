"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaChartLine, 
  FaSearch,
  FaFilter,
  FaDownload,
  FaCalendarAlt,
  FaEnvelopeOpen,
  FaMousePointer,
  FaUsers,
  FaPercentage,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaEdit,
  FaShare,
  FaCog,
  FaInfoCircle,
  FaExclamationTriangle,
  FaCheckCircle,
  FaClock,
  FaGlobe,
  FaMobile,
  FaDesktop,
  FaTablet,
  FaEnvelope,
  FaBan,
  FaHeart
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const PerformanceContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const PerformanceTitle = styled.h1`
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

const PerformanceSubtitle = styled.p`
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
  background-color: var(--card-bg);
  padding: 1.5rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);

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

const FilterSelect = styled.select`
  padding: 10px 12px;
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
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
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success': return 'rgba(40, 167, 69, 0.3)';
      case 'warning': return 'rgba(255, 193, 7, 0.3)';
      case 'danger': return 'rgba(220, 53, 69, 0.3)';
      case 'info': return 'rgba(23, 162, 184, 0.3)';
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
        case 'info': return 'linear-gradient(90deg, #17a2b8, #6f42c1)';
        default: return 'linear-gradient(90deg, var(--primary), var(--accent))';
      }
    }};
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const MetricTitle = styled.h3`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 600;
`;

const MetricIcon = styled.div<{ variant?: string }>`
  font-size: 1.2rem;
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

const MetricValue = styled.div<{ variant?: string }>`
  font-size: 2.5rem;
  font-weight: 700;
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      case 'info': return '#17a2b8';
      default: return 'var(--text)';
    }
  }};
  margin-bottom: 0.5rem;
`;

const MetricChange = styled.div<{ positive: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
`;

const ChartHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChartTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: var(--primary);
  }
`;

const ChartContent = styled.div`
  padding: 1.5rem;
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-style: italic;
`;

const DeviceBreakdownGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const DeviceCard = styled.div`
  background-color: var(--card-bg);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  text-align: center;
`;

const DeviceIcon = styled.div`
  font-size: 2rem;
  color: var(--primary);
  margin-bottom: 0.5rem;
`;

const DeviceLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
`;

const DevicePercentage = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text);
`;

const CampaignPerformanceSection = styled.div`
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

const CampaignName = styled.div`
  font-weight: 600;
  margin-bottom: 0.25rem;
`;

const CampaignMeta = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const PerformanceBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.25rem;
`;

const PerformanceFill = styled.div<{ percentage: number; color?: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => props.color || 'var(--primary)'};
  transition: width 0.3s ease;
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
      case 'excellent':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'good':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      case 'average':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'poor':
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
const mockPerformanceData = {
  overview: {
    totalSent: 45230,
    totalOpens: 12456,
    totalClicks: 2891,
    totalUnsubscribes: 234,
    openRate: 27.5,
    clickRate: 6.4,
    unsubscribeRate: 0.5,
    bounceRate: 2.1
  },
  trends: {
    openRateChange: 3.2,
    clickRateChange: -1.1,
    unsubscribeRateChange: -0.2,
    bounceRateChange: 0.3
  },
  devices: {
    mobile: 58.3,
    desktop: 32.1,
    tablet: 9.6
  },
  campaigns: [
    {
      id: "1",
      name: "Summer Sale Newsletter",
      sent: 8500,
      opens: 2380,
      clicks: 567,
      openRate: 28.0,
      clickRate: 6.7,
      performance: "excellent",
      sentDate: "2024-01-18"
    },
    {
      id: "2", 
      name: "Product Update Announcement",
      sent: 12300,
      opens: 3321,
      clicks: 743,
      openRate: 27.0,
      clickRate: 6.0,
      performance: "good",
      sentDate: "2024-01-15"
    },
    {
      id: "3",
      name: "Welcome Series - Part 1",
      sent: 6750,
      opens: 1755,
      clicks: 389,
      openRate: 26.0,
      clickRate: 5.8,
      performance: "good",
      sentDate: "2024-01-12"
    },
    {
      id: "4",
      name: "Monthly Newsletter #45",
      sent: 15200,
      opens: 3648,
      clicks: 729,
      openRate: 24.0,
      clickRate: 4.8,
      performance: "average",
      sentDate: "2024-01-10"
    },
    {
      id: "5",
      name: "Flash Sale Alert",
      sent: 2480,
      opens: 496,
      clicks: 74,
      openRate: 20.0,
      clickRate: 3.0,
      performance: "poor",
      sentDate: "2024-01-08"
    }
  ]
};

function PerformancePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [timeRange, setTimeRange] = useState("30d");
  const [campaignFilter, setCampaignFilter] = useState("all");
  
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

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  const handleCampaignClick = (campaignId: string) => {
    router.push(`/admin/email-campaigns/campaigns/${campaignId}`);
  };

  return (
    <>
      <NextSEO
        title="Email Performance Analytics"
        description="Comprehensive email campaign performance analytics and insights"
      />
      
      <PerformanceContainer>
        <PerformanceTitle>
          <FaChartLine />
          Email Performance Analytics
        </PerformanceTitle>
        <PerformanceSubtitle>
          Comprehensive insights into your email campaign performance and engagement metrics
        </PerformanceSubtitle>

        <FiltersRow>
          <LeftFilters>
            <FilterSelect value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </FilterSelect>
            
            <FilterSelect value={campaignFilter} onChange={(e) => setCampaignFilter(e.target.value)}>
              <option value="all">All Campaigns</option>
              <option value="newsletter">Newsletters</option>
              <option value="promotional">Promotional</option>
              <option value="transactional">Transactional</option>
            </FilterSelect>
          </LeftFilters>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <ActionButton>
              <FaDownload />
              Export Report
            </ActionButton>
            <ActionButton variant="primary">
              <FaShare />
              Share Dashboard
            </ActionButton>
          </div>
        </FiltersRow>

        <MetricsGrid>
          <MetricCard
            variant="info"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={0}
          >
            <MetricHeader>
              <MetricTitle>Total Sent</MetricTitle>
              <MetricIcon variant="info">
                <FaEnvelope />
              </MetricIcon>
            </MetricHeader>
            <MetricValue>{mockPerformanceData.overview.totalSent.toLocaleString()}</MetricValue>
            <MetricChange positive={true}>
              <FaArrowUp />
              +12.5% from last period
            </MetricChange>
          </MetricCard>

          <MetricCard
            variant="success"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={1}
          >
            <MetricHeader>
              <MetricTitle>Open Rate</MetricTitle>
              <MetricIcon variant="success">
                <FaEnvelopeOpen />
              </MetricIcon>
            </MetricHeader>
            <MetricValue variant="success">{mockPerformanceData.overview.openRate}%</MetricValue>
            <MetricChange positive={mockPerformanceData.trends.openRateChange > 0}>
              {mockPerformanceData.trends.openRateChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(mockPerformanceData.trends.openRateChange)}% from last period
            </MetricChange>
          </MetricCard>

          <MetricCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={2}
          >
            <MetricHeader>
              <MetricTitle>Click Rate</MetricTitle>
              <MetricIcon>
                <FaMousePointer />
              </MetricIcon>
            </MetricHeader>
            <MetricValue>{mockPerformanceData.overview.clickRate}%</MetricValue>
            <MetricChange positive={mockPerformanceData.trends.clickRateChange > 0}>
              {mockPerformanceData.trends.clickRateChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(mockPerformanceData.trends.clickRateChange)}% from last period
            </MetricChange>
          </MetricCard>

          <MetricCard
            variant="warning"
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            custom={3}
          >
            <MetricHeader>
              <MetricTitle>Unsubscribe Rate</MetricTitle>
              <MetricIcon variant="warning">
                <FaBan />
              </MetricIcon>
            </MetricHeader>
            <MetricValue variant="warning">{mockPerformanceData.overview.unsubscribeRate}%</MetricValue>
            <MetricChange positive={mockPerformanceData.trends.unsubscribeRateChange < 0}>
              {mockPerformanceData.trends.unsubscribeRateChange > 0 ? <FaArrowUp /> : <FaArrowDown />}
              {Math.abs(mockPerformanceData.trends.unsubscribeRateChange)}% from last period
            </MetricChange>
          </MetricCard>
        </MetricsGrid>

        <ChartsGrid>
          <ChartCard>
            <ChartHeader>
              <ChartTitle>
                <FaArrowUp />
                Performance Trends
              </ChartTitle>
              <ActionButton>
                <FaCog />
                Configure
              </ActionButton>
            </ChartHeader>
            <ChartContent>
              📈 Interactive chart would be rendered here using a charting library like Chart.js or Recharts
            </ChartContent>
          </ChartCard>

          <ChartCard>
            <ChartHeader>
              <ChartTitle>
                <FaUsers />
                Engagement Breakdown
              </ChartTitle>
            </ChartHeader>
            <ChartContent>
              🥧 Pie chart showing engagement distribution would be rendered here
            </ChartContent>
          </ChartCard>
        </ChartsGrid>

        <DeviceBreakdownGrid>
          <DeviceCard>
            <DeviceIcon>
              <FaMobile />
            </DeviceIcon>
            <DeviceLabel>Mobile</DeviceLabel>
            <DevicePercentage>{mockPerformanceData.devices.mobile}%</DevicePercentage>
          </DeviceCard>
          
          <DeviceCard>
            <DeviceIcon>
              <FaDesktop />
            </DeviceIcon>
            <DeviceLabel>Desktop</DeviceLabel>
            <DevicePercentage>{mockPerformanceData.devices.desktop}%</DevicePercentage>
          </DeviceCard>
          
          <DeviceCard>
            <DeviceIcon>
              <FaTablet />
            </DeviceIcon>
            <DeviceLabel>Tablet</DeviceLabel>
            <DevicePercentage>{mockPerformanceData.devices.tablet}%</DevicePercentage>
          </DeviceCard>
        </DeviceBreakdownGrid>

        <CampaignPerformanceSection>
          <SectionHeader>
            <SectionTitle>
              <FaEnvelopeOpen />
              Campaign Performance
            </SectionTitle>
            <ActionButton>
              <FaEye />
              View All
            </ActionButton>
          </SectionHeader>

          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Campaign</TableHeaderCell>
                <TableHeaderCell>Sent</TableHeaderCell>
                <TableHeaderCell>Open Rate</TableHeaderCell>
                <TableHeaderCell>Click Rate</TableHeaderCell>
                <TableHeaderCell>Performance</TableHeaderCell>
                <TableHeaderCell>Date</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {mockPerformanceData.campaigns.map((campaign, index) => (
                <TableRow
                  key={campaign.id}
                  variants={cardVariants}
                  initial="hidden"
                  animate="visible"
                  custom={index}
                  onClick={() => handleCampaignClick(campaign.id)}
                >
                  <TableCell>
                    <CampaignName>{campaign.name}</CampaignName>
                    <CampaignMeta>
                      {campaign.opens.toLocaleString()} opens • {campaign.clicks.toLocaleString()} clicks
                    </CampaignMeta>
                  </TableCell>
                  <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                  <TableCell>
                    <div>{campaign.openRate}%</div>
                    <PerformanceBar>
                      <PerformanceFill 
                        percentage={campaign.openRate} 
                        color={campaign.openRate >= 25 ? '#28a745' : campaign.openRate >= 20 ? '#ffc107' : '#dc3545'}
                      />
                    </PerformanceBar>
                  </TableCell>
                  <TableCell>
                    <div>{campaign.clickRate}%</div>
                    <PerformanceBar>
                      <PerformanceFill 
                        percentage={campaign.clickRate * 5} 
                        color={campaign.clickRate >= 5 ? '#28a745' : campaign.clickRate >= 3 ? '#ffc107' : '#dc3545'}
                      />
                    </PerformanceBar>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={campaign.performance}>
                      {campaign.performance}
                    </StatusBadge>
                  </TableCell>
                  <TableCell>
                    {new Date(campaign.sentDate).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CampaignPerformanceSection>
      </PerformanceContainer>
    </>
  );
}

export default PerformancePage; 