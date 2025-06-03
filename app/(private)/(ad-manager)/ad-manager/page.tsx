"use client";

import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaFacebook,
  FaChartLine,
  FaUsers,
  FaBullhorn,
  FaEye,
  FaMousePointer,
  FaDollarSign,
  FaPlay,
  FaPause,
  FaPlus,
  FaSync,
  FaExclamationTriangle,
  FaCheckCircle,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import LoadingComponent from "@/components/common/LoadingComponent";

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: #1877f2;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
`;

const ConnectionStatus = styled(motion.div)<{ $connected: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  background: ${props => props.$connected ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)'};
  border: 1px solid ${props => props.$connected ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
  border-radius: 12px;
  margin-bottom: 2rem;
  color: ${props => props.$connected ? '#22c55e' : '#ef4444'};
`;

const NotificationBanner = styled(motion.div)<{ $type: 'success' | 'error' }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  background: ${props => props.$type === 'success' 
    ? 'linear-gradient(135deg, rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05))'
    : 'linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05))'
  };
  border: 1px solid ${props => props.$type === 'success' 
    ? 'rgba(34, 197, 94, 0.2)'
    : 'rgba(239, 68, 68, 0.2)'
  };
  color: ${props => props.$type === 'success' ? '#22c55e' : '#ef4444'};

  svg {
    font-size: 1.1rem;
    flex-shrink: 0;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(motion.div)`
  background: var(--card-bg);
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
    background: linear-gradient(90deg, var(--primary), var(--accent));
  }
`;

const StatIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: rgba(108, 99, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: var(--primary);
  font-size: 1.5rem;
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: bold;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

const ActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ActionCard = styled(motion.div)`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: var(--primary);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.15);
  }
`;

const ActionIcon = styled.div`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  color: white;
  font-size: 1.5rem;
`;

const ActionTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const ActionDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  line-height: 1.5;
  margin: 0;
`;

const RecentCampaigns = styled.div`
  background: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: var(--text);
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CampaignList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const CampaignItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CampaignInfo = styled.div`
  flex: 1;
`;

const CampaignName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const CampaignMeta = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const CampaignActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ActionButton = styled.button`
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }
`;

export default function AdManagerDashboard() {
  const { user } = useAuth();
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');
  const [stats, setStats] = useState({
    totalCampaigns: 0,
    activeAds: 0,
    totalSpent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0
  });
  const [notification, setNotification] = useState<{type: 'success' | 'error', message: string} | null>(null);

  useEffect(() => {
    // Check for OAuth callback parameters
    const urlParams = new URLSearchParams(window.location.search);
    const connected = urlParams.get('connected');
    const error = urlParams.get('error');
    const errorMessage = urlParams.get('message');
    const userName = urlParams.get('user');

    if (connected === 'true') {
      setNotification({
        type: 'success',
        message: `Successfully connected to Facebook! Welcome ${userName || 'Facebook User'}.`
      });
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    } else if (error) {
      setNotification({
        type: 'error',
        message: errorMessage || 'Failed to connect to Facebook. Please try again.'
      });
      // Clean up URL parameters
      window.history.replaceState({}, '', window.location.pathname);
    }

    checkConnectionStatus();
    loadStats();
  }, []);

  const checkConnectionStatus = async () => {
    try {
      const response = await fetch('/api/facebook-ads/connection-status');
      const data = await response.json();
      setConnectionStatus(data.connected ? 'connected' : 'disconnected');
    } catch (error) {
      console.error('Error checking connection status:', error);
      setConnectionStatus('disconnected');
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/facebook-ads/stats');
      const data = await response.json();
      if (data.success && data.stats) {
        // Merge with default values to ensure all properties exist
        setStats(prevStats => ({
          totalCampaigns: data.stats.totalCampaigns ?? prevStats.totalCampaigns,
          activeAds: data.stats.activeAds ?? prevStats.activeAds,
          totalSpent: data.stats.totalSpent ?? prevStats.totalSpent,
          impressions: data.stats.impressions ?? prevStats.impressions,
          clicks: data.stats.clicks ?? prevStats.clicks,
          conversions: data.stats.conversions ?? prevStats.conversions
        }));
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleConnect = () => {
    window.location.href = '/api/facebook-ads/connect';
  };

  if (!user) {
    return <LoadingComponent />;
  }

  if (!user.can_access_ad_manager) {
    return <div>Access denied. You don't have permission to access the Ad Manager.</div>;
  }

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <Container>
      <Header>
        <Title>
          <FaFacebook />
          Ad Manager Dashboard
        </Title>
        <Subtitle>
          Manage your Facebook advertising campaigns and track performance
        </Subtitle>
      </Header>

      {/* Notification Banner */}
      {notification && (
        <NotificationBanner 
          $type={notification.type}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {notification.type === 'success' ? <FaCheckCircle /> : <FaExclamationTriangle />}
            <span style={{ marginLeft: '0.5rem' }}>{notification.message}</span>
          </div>
          <button 
            onClick={() => setNotification(null)}
            style={{ 
              background: 'none', 
              border: 'none', 
              color: 'inherit', 
              cursor: 'pointer',
              padding: '0.25rem',
              fontSize: '1.2rem'
            }}
          >
            ×
          </button>
        </NotificationBanner>
      )}

      <ConnectionStatus 
        $connected={connectionStatus === 'connected'}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {connectionStatus === 'checking' ? (
          <>
            <FaSync className="animate-spin" />
            Checking Facebook connection...
          </>
        ) : connectionStatus === 'connected' ? (
          <>
            <FaCheckCircle />
            Connected to Facebook Ads
          </>
        ) : (
          <>
            <FaExclamationTriangle />
            Not connected to Facebook Ads
            <button 
              onClick={handleConnect}
              style={{ 
                marginLeft: '1rem', 
                padding: '0.5rem 1rem', 
                background: 'var(--primary)', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Connect Now
            </button>
          </>
        )}
      </ConnectionStatus>

      <StatsGrid>
        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={0}
        >
          <StatIcon>
            <FaBullhorn />
          </StatIcon>
          <StatValue>{stats.totalCampaigns}</StatValue>
          <StatLabel>Total Campaigns</StatLabel>
        </StatCard>

        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={1}
        >
          <StatIcon>
            <FaEye />
          </StatIcon>
          <StatValue>{(stats.impressions || 0).toLocaleString()}</StatValue>
          <StatLabel>Impressions</StatLabel>
        </StatCard>

        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={2}
        >
          <StatIcon>
            <FaMousePointer />
          </StatIcon>
          <StatValue>{(stats.clicks || 0).toLocaleString()}</StatValue>
          <StatLabel>Clicks</StatLabel>
        </StatCard>

        <StatCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={3}
        >
          <StatIcon>
            <FaDollarSign />
          </StatIcon>
          <StatValue>${(stats.totalSpent || 0).toFixed(2)}</StatValue>
          <StatLabel>Total Spent</StatLabel>
        </StatCard>
      </StatsGrid>

      <ActionsGrid>
        <ActionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={4}
          onClick={() => window.location.href = '/ad-manager/campaigns/create'}
        >
          <ActionIcon>
            <FaPlus />
          </ActionIcon>
          <ActionTitle>Create Campaign</ActionTitle>
          <ActionDescription>
            Launch a new advertising campaign with custom targeting and budget settings.
          </ActionDescription>
        </ActionCard>

        <ActionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={5}
          onClick={() => window.location.href = '/ad-manager/audiences'}
        >
          <ActionIcon>
            <FaUsers />
          </ActionIcon>
          <ActionTitle>Manage Audiences</ActionTitle>
          <ActionDescription>
            Create and manage custom audiences for better ad targeting.
          </ActionDescription>
        </ActionCard>

        <ActionCard
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          custom={6}
          onClick={() => window.location.href = '/ad-manager/analytics'}
        >
          <ActionIcon>
            <FaChartLine />
          </ActionIcon>
          <ActionTitle>View Analytics</ActionTitle>
          <ActionDescription>
            Analyze campaign performance with detailed insights and metrics.
          </ActionDescription>
        </ActionCard>
      </ActionsGrid>

      <RecentCampaigns>
        <SectionTitle>
          <FaBullhorn />
          Recent Campaigns
        </SectionTitle>
        <CampaignList>
          {/* Mock data - replace with real campaigns */}
          <CampaignItem>
            <CampaignInfo>
              <CampaignName>Holiday Sale Campaign</CampaignName>
              <CampaignMeta>Created 2 days ago • $150.00 spent • 2,450 impressions</CampaignMeta>
            </CampaignInfo>
            <CampaignActions>
              <ActionButton title="Pause Campaign">
                <FaPause />
              </ActionButton>
              <ActionButton title="View Details">
                <FaEye />
              </ActionButton>
            </CampaignActions>
          </CampaignItem>
          
          <CampaignItem>
            <CampaignInfo>
              <CampaignName>Product Launch</CampaignName>
              <CampaignMeta>Created 1 week ago • $320.50 spent • 5,120 impressions</CampaignMeta>
            </CampaignInfo>
            <CampaignActions>
              <ActionButton title="Resume Campaign">
                <FaPlay />
              </ActionButton>
              <ActionButton title="View Details">
                <FaEye />
              </ActionButton>
            </CampaignActions>
          </CampaignItem>
        </CampaignList>
      </RecentCampaigns>
    </Container>
  );
} 