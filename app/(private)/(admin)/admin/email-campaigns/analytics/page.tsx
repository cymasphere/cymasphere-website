'use client';

import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { motion } from 'framer-motion';
import { 
  FaChartLine, 
  FaEnvelope, 
  FaUsers, 
  FaEye, 
  FaMousePointer,
  FaCalendarAlt,
  FaFilter,
  FaDownload
} from 'react-icons/fa';
import StatLoadingSpinner from '@/components/common/StatLoadingSpinner';
import { useAuth } from '@/contexts/AuthContext';
import LoadingComponent from '@/components/common/LoadingComponent';

const Container = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: #667eea;
  }
`;

const Controls = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
`;

const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  background: white;
  font-size: 1rem;
  cursor: pointer;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
    }
  ` : `
    background: #f5f5f5;
    color: #666;

  &:hover {
      background: #e0e0e0;
  }
  `}
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  position: relative;
  overflow: hidden;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }
`;

const StatHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div<{ color: string }>`
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => props.color}20;
  color: ${props => props.color};
  font-size: 1.5rem;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.875rem;
  text-transform: uppercase;
  font-weight: 600;
  letter-spacing: 0.5px;
`;

const StatChange = styled.div<{ positive: boolean }>`
  font-size: 0.875rem;
  font-weight: 600;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  margin-top: 0.5rem;
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
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
`;

const ChartTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 1.1rem;
  font-weight: 500;
`;

const TableCard = styled.div`
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  margin-bottom: 2rem;
`;

const TableTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: #333;
  margin-bottom: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHeader = styled.th`
  text-align: left;
  padding: 1rem;
  border-bottom: 2px solid #f0f0f0;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TableRow = styled.tr`
  &:hover {
    background: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 1rem;
  border-bottom: 1px solid #f0f0f0;
  color: #666;
`;

const CampaignName = styled.div`
  font-weight: 600;
  color: #333;
  margin-bottom: 0.25rem;
`;

const CampaignType = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const MetricBadge = styled.span<{ type: 'success' | 'warning' | 'danger' | 'info' }>`
  padding: 0.25rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
  
  ${props => {
    switch (props.type) {
      case 'success':
        return 'background: #d4edda; color: #155724;';
      case 'warning':
        return 'background: #fff3cd; color: #856404;';
      case 'danger':
        return 'background: #f8d7da; color: #721c24;';
      case 'info':
        return 'background: #d1ecf1; color: #0c5460;';
      default:
        return 'background: #f8f9fa; color: #6c757d;';
    }
  }}
`;

const LoadingState = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
  color: #666;
`;

interface CampaignData {
  id: string;
  name: string;
  type: string;
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  unsubscribed: number;
  sentDate: string;
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [timeRange, setTimeRange] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignData[]>([]);

  // Fetch analytics data from API
  const fetchAnalyticsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/email-campaigns/analytics?timeRange=${timeRange}`, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setCampaigns(data.data.campaigns || []);
      } else {
        throw new Error(data.error || 'Failed to load analytics data');
      }
      
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics data');
      setCampaigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, timeRange]);

  if (!user) {
    return <LoadingComponent />;
  }

  if (error) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
        <h3>Error Loading Analytics</h3>
        <p>{error}</p>
        <button 
          onClick={fetchAnalyticsData}
          style={{
            padding: '0.5rem 1rem',
            background: 'var(--primary)',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const totalSent = campaigns.reduce((sum, campaign) => sum + campaign.sent, 0);
  const totalDelivered = campaigns.reduce((sum, campaign) => sum + campaign.delivered, 0);
  const totalOpened = campaigns.reduce((sum, campaign) => sum + campaign.opened, 0);
  const totalClicked = campaigns.reduce((sum, campaign) => sum + campaign.clicked, 0);
  const totalUnsubscribed = campaigns.reduce((sum, campaign) => sum + campaign.unsubscribed, 0);

  const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent * 100).toFixed(1) : '0';
  const openRate = totalDelivered > 0 ? (totalOpened / totalDelivered * 100).toFixed(1) : '0';
  const clickRate = totalOpened > 0 ? (totalClicked / totalOpened * 100).toFixed(1) : '0';
  const unsubscribeRate = totalSent > 0 ? (totalUnsubscribed / totalSent * 100).toFixed(2) : '0';



  return (
    <Container>
      <Header>
        <Title>
          <FaChartLine />
          Email Analytics
        </Title>
        <Controls>
            <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)}>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </Select>
          <Button>
            <FaFilter />
            Filter
          </Button>
          <Button variant="primary">
            <FaDownload />
            Export
          </Button>
        </Controls>
      </Header>

      <StatsGrid>
        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0 }}
        >
          <StatHeader>
            <StatIcon color="#667eea">
              <FaEnvelope />
            </StatIcon>
          </StatHeader>
          <StatValue>{loading ? <StatLoadingSpinner size={20} /> : totalSent.toLocaleString()}</StatValue>
          <StatLabel>Emails Sent</StatLabel>
          <StatChange positive={true}>+12.5% from last period</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
              >
          <StatHeader>
            <StatIcon color="#28a745">
              <FaUsers />
            </StatIcon>
          </StatHeader>
          <StatValue>{loading ? <StatLoadingSpinner size={20} /> : `${deliveryRate}%`}</StatValue>
          <StatLabel>Delivery Rate</StatLabel>
          <StatChange positive={true}>+0.8% from last period</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <StatHeader>
            <StatIcon color="#ffc107">
              <FaEye />
            </StatIcon>
          </StatHeader>
          <StatValue>{loading ? <StatLoadingSpinner size={20} /> : `${openRate}%`}</StatValue>
          <StatLabel>Open Rate</StatLabel>
          <StatChange positive={false}>-2.1% from last period</StatChange>
        </StatCard>

        <StatCard
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <StatHeader>
            <StatIcon color="#17a2b8">
              <FaMousePointer />
            </StatIcon>
          </StatHeader>
          <StatValue>{loading ? <StatLoadingSpinner size={20} /> : `${clickRate}%`}</StatValue>
          <StatLabel>Click Rate</StatLabel>
          <StatChange positive={true}>+5.3% from last period</StatChange>
        </StatCard>
      </StatsGrid>

        <ChartsGrid>
          <ChartCard>
          <ChartTitle>Performance Over Time</ChartTitle>
            <ChartPlaceholder>
            Interactive chart showing email performance trends
            </ChartPlaceholder>
          </ChartCard>
          
          <ChartCard>
          <ChartTitle>Campaign Types</ChartTitle>
            <ChartPlaceholder>
            Pie chart showing campaign type distribution
            </ChartPlaceholder>
          </ChartCard>
        </ChartsGrid>

        <TableCard>
        <TableTitle>Recent Campaigns</TableTitle>
          <Table>
          <thead>
              <tr>
              <TableHeader>Campaign</TableHeader>
              <TableHeader>Sent</TableHeader>
              <TableHeader>Delivered</TableHeader>
              <TableHeader>Open Rate</TableHeader>
              <TableHeader>Click Rate</TableHeader>
              <TableHeader>Unsubscribes</TableHeader>
              <TableHeader>Date</TableHeader>
              </tr>
          </thead>
          <tbody>
            {campaigns.map(campaign => {
              const campaignOpenRate = campaign.delivered > 0 
                ? (campaign.opened / campaign.delivered * 100).toFixed(1)
                : '0';
              const campaignClickRate = campaign.opened > 0 
                ? (campaign.clicked / campaign.opened * 100).toFixed(1)
                : '0';

              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <CampaignName>{campaign.name}</CampaignName>
                    <CampaignType>{campaign.type}</CampaignType>
                  </TableCell>
                  <TableCell>{campaign.sent.toLocaleString()}</TableCell>
                  <TableCell>{campaign.delivered.toLocaleString()}</TableCell>
                  <TableCell>
                    <MetricBadge type={parseFloat(campaignOpenRate) > 25 ? 'success' : 'warning'}>
                      {campaignOpenRate}%
                    </MetricBadge>
                  </TableCell>
                  <TableCell>
                    <MetricBadge type={parseFloat(campaignClickRate) > 3 ? 'success' : 'warning'}>
                      {campaignClickRate}%
                    </MetricBadge>
                  </TableCell>
                  <TableCell>{campaign.unsubscribed}</TableCell>
                  <TableCell>{new Date(campaign.sentDate).toLocaleDateString()}</TableCell>
                </TableRow>
              );
            })}
          </tbody>
          </Table>
        </TableCard>
    </Container>
  );
}