"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaUsers,
  FaMoneyBillWave,
  FaTicketAlt,
  FaChartLine,
  FaPlus,
  FaArrowDown,
  FaCrown,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import LoadingComponent from "@/components/common/LoadingComponent";
import { getAdminDashboardStats, AdminDashboardStats, AdminActivity } from "@/utils/stripe/admin-analytics";

const Container = styled.div`
  width: 100%;
  max-width: 1200px;
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
    color: var(--primary);
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    margin-bottom: 1rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
`;

const StatCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 1rem;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  color: var(--primary);
  flex-shrink: 0;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const StatLabel = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.25rem 0;
`;

const StatDetail = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
`;

const QuickActionsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
`;

const QuickActionCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 1rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
    border-color: var(--primary);
    transform: translateY(-2px);
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
`;

const ActionIcon = styled.div`
  font-size: 2rem;
  color: var(--primary);
  flex-shrink: 0;
`;

const ActionContent = styled.div`
  flex: 1;
`;

const ActionTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
`;

const ActionDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
`;

const RecentActivitySection = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 10px;
    margin-bottom: 2rem;
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin-bottom: 1rem;
  }
`;

const ActivityList = styled.div`
  margin-bottom: 2rem;
`;

const ActivityItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);

  &:last-child {
    border-bottom: none;
  }
`;

const ActivityIcon = styled.div`
  font-size: 1.2rem;
  color: var(--primary);
  flex-shrink: 0;
`;

const ActivityContent = styled.div`
  flex: 1;
`;

const ActivityDescription = styled.p`
  margin: 0 0 0.25rem 0;
  color: var(--text);
  font-size: 0.9rem;
`;

const ActivityTime = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const ActivityAmount = styled.span`
  font-size: 0.9rem;
  color: var(--primary);
  font-weight: 600;
`;

const EmptyState = styled.p`
  text-align: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
  padding: 2rem;
`;

const AdditionalStatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 2rem;
  }
`;

const AdditionalStatCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
  text-align: center;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
  }

  @media (max-width: 768px) {
    padding: 1.25rem;
    border-radius: 10px;
  }
`;

const ErrorMessage = styled.div`
  text-align: center;
  color: var(--error);
  font-size: 1.2rem;
  padding: 2rem;
`;

const ActivityHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }
`;

const ActivityFilters = styled.div`
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const ActivityFilterButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: ${({ $active }) => 
    $active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${({ $active }) => ($active ? 'white' : 'var(--text-secondary)')};
  border: 1px solid ${({ $active }) => 
    $active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    background-color: ${({ $active }) => 
      $active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.1)'};
    color: ${({ $active }) => ($active ? 'white' : 'var(--text)')};
    border-color: ${({ $active }) => 
      $active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)'};
    transform: translateY(-1px);
  }

  svg {
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    padding: 0.4rem 0.6rem;
    font-size: 0.8rem;
  }
`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activityFilter, setActivityFilter] = useState<AdminActivity['type'] | 'all'>('all');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const dashboardStats = await getAdminDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError("Failed to load dashboard statistics");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (!user) {
    return <LoadingComponent />;
  }

  // Temporarily disabled admin check for testing
  // if (user.profile?.subscription !== "admin") {
  //   return null;
  // }

  if (loading) {
    return <LoadingComponent />;
  }

  if (error) {
    return (
      <Container>
        <ErrorMessage>{error}</ErrorMessage>
      </Container>
    );
  }

  if (!stats) {
    return (
      <Container>
        <ErrorMessage>No data available</ErrorMessage>
      </Container>
    );
  }

  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerChildren = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getActivityIcon = (type: AdminActivity['type']) => {
    switch (type) {
      case 'subscription':
        return <FaMoneyBillWave />;
      case 'payment':
        return <FaChartLine />;
      case 'user_signup':
        return <FaUsers />;
      case 'cancellation':
        return <FaArrowDown />;
      default:
        return <FaPlus />;
    }
  };

  const getFilteredActivities = () => {
    if (!stats?.recentActivity) return [];
    
    if (activityFilter === 'all') {
      return stats.recentActivity;
    }
    
    return stats.recentActivity.filter(activity => activity.type === activityFilter);
  };

  const getActivityTypeLabel = (type: AdminActivity['type'] | 'all') => {
    switch (type) {
      case 'subscription':
        return 'Subscriptions';
      case 'payment':
        return 'Payments';
      case 'user_signup':
        return 'Signups';
      case 'cancellation':
        return 'Cancellations';
      default:
        return 'All Activities';
    }
  };

  const getActivityTypeCount = (type: AdminActivity['type'] | 'all') => {
    if (!stats?.recentActivity) return 0;
    
    if (type === 'all') {
      return stats.recentActivity.length;
    }
    
    return stats.recentActivity.filter(activity => activity.type === type).length;
  };

  return (
    <Container>
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Header>
          <Title>
            <FaCrown />
            Admin Dashboard
          </Title>
          <Subtitle>
            Cymasphere Analytics & Management
          </Subtitle>
        </Header>

        <motion.div variants={staggerChildren} initial="hidden" animate="visible">
          <StatsGrid>
            <StatCard variants={fadeIn}>
              <StatIcon>
                <FaUsers />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.totalUsers.toLocaleString()}</StatValue>
                <StatLabel>Total Users</StatLabel>
                <StatDetail>
                  {stats.freeUsers} free, {stats.activeSubscriptions} paid
                </StatDetail>
              </StatContent>
            </StatCard>

            <StatCard variants={fadeIn}>
              <StatIcon>
                <FaMoneyBillWave />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.activeSubscriptions}</StatValue>
                <StatLabel>Active Subscriptions</StatLabel>
                <StatDetail>
                  {stats.monthlySubscribers} monthly, {stats.annualSubscribers} annual
                </StatDetail>
              </StatContent>
            </StatCard>

            <StatCard variants={fadeIn}>
              <StatIcon>
                <FaTicketAlt />
              </StatIcon>
              <StatContent>
                <StatValue>{stats.lifetimeCustomers}</StatValue>
                <StatLabel>Lifetime Customers</StatLabel>
                <StatDetail>
                  One-time purchases
                </StatDetail>
              </StatContent>
            </StatCard>

            <StatCard variants={fadeIn}>
              <StatIcon>
                <FaChartLine />
              </StatIcon>
              <StatContent>
                <StatValue>{formatCurrency(stats.monthlyRevenue)}</StatValue>
                <StatLabel>Monthly Revenue</StatLabel>
                <StatDetail>
                  Last 30 days
                </StatDetail>
              </StatContent>
            </StatCard>
          </StatsGrid>

          <QuickActionsGrid>
            <QuickActionCard variants={fadeIn}>
              <ActionIcon>
                <FaUsers />
              </ActionIcon>
              <ActionContent>
                <ActionTitle>User Management</ActionTitle>
                <ActionDescription>
                  Manage user accounts, subscriptions, and permissions
                </ActionDescription>
              </ActionContent>
            </QuickActionCard>

            <QuickActionCard variants={fadeIn}>
              <ActionIcon>
                <FaTicketAlt />
              </ActionIcon>
              <ActionContent>
                <ActionTitle>Support Tickets</ActionTitle>
                <ActionDescription>
                  Handle customer support requests and issues
                </ActionDescription>
              </ActionContent>
            </QuickActionCard>

            <QuickActionCard variants={fadeIn}>
              <ActionIcon>
                <FaChartLine />
              </ActionIcon>
              <ActionContent>
                <ActionTitle>Analytics</ActionTitle>
                <ActionDescription>
                  View detailed revenue and user analytics
                </ActionDescription>
              </ActionContent>
            </QuickActionCard>
          </QuickActionsGrid>

          <RecentActivitySection variants={fadeIn}>
            <ActivityHeader>
              <SectionTitle>Recent Activity</SectionTitle>
              <ActivityFilters>
                <ActivityFilterButton
                  $active={activityFilter === 'all'}
                  onClick={() => setActivityFilter('all')}
                >
                  All ({getActivityTypeCount('all')})
                </ActivityFilterButton>
                <ActivityFilterButton
                  $active={activityFilter === 'subscription'}
                  onClick={() => setActivityFilter('subscription')}
                >
                  <FaMoneyBillWave />
                  Subscriptions ({getActivityTypeCount('subscription')})
                </ActivityFilterButton>
                <ActivityFilterButton
                  $active={activityFilter === 'payment'}
                  onClick={() => setActivityFilter('payment')}
                >
                  <FaChartLine />
                  Payments ({getActivityTypeCount('payment')})
                </ActivityFilterButton>
                <ActivityFilterButton
                  $active={activityFilter === 'user_signup'}
                  onClick={() => setActivityFilter('user_signup')}
                >
                  <FaUsers />
                  Signups ({getActivityTypeCount('user_signup')})
                </ActivityFilterButton>
                <ActivityFilterButton
                  $active={activityFilter === 'cancellation'}
                  onClick={() => setActivityFilter('cancellation')}
                >
                  <FaArrowDown />
                  Cancellations ({getActivityTypeCount('cancellation')})
                </ActivityFilterButton>
              </ActivityFilters>
            </ActivityHeader>
            <ActivityList>
              {getFilteredActivities().map((activity, index) => (
                <ActivityItem key={activity.id} variants={fadeIn} custom={index}>
                  <ActivityIcon>
                    {getActivityIcon(activity.type)}
                  </ActivityIcon>
                  <ActivityContent>
                    <ActivityDescription>{activity.description}</ActivityDescription>
                    <ActivityTime>{formatDate(activity.timestamp)}</ActivityTime>
                  </ActivityContent>
                  {activity.amount && (
                    <ActivityAmount>
                      {formatCurrency(activity.amount)}
                    </ActivityAmount>
                  )}
                </ActivityItem>
              ))}
              {getFilteredActivities().length === 0 && (
                <EmptyState>
                  No {getActivityTypeLabel(activityFilter).toLowerCase()} to display
                </EmptyState>
              )}
            </ActivityList>
          </RecentActivitySection>

          <AdditionalStatsGrid>
            <AdditionalStatCard variants={fadeIn}>
              <StatLabel>Total Revenue</StatLabel>
              <StatValue>{formatCurrency(stats.lifetimeRevenue)}</StatValue>
            </AdditionalStatCard>

            <AdditionalStatCard variants={fadeIn}>
              <StatLabel>Trial Users</StatLabel>
              <StatValue>{stats.trialUsers}</StatValue>
            </AdditionalStatCard>

            <AdditionalStatCard variants={fadeIn}>
              <StatLabel>Churn Rate</StatLabel>
              <StatValue>{stats.churnRate.toFixed(1)}%</StatValue>
            </AdditionalStatCard>

            <AdditionalStatCard variants={fadeIn}>
              <StatLabel>Admin Users</StatLabel>
              <StatValue>{stats.adminUsers}</StatValue>
            </AdditionalStatCard>
          </AdditionalStatsGrid>
        </motion.div>
      </motion.div>
    </Container>
  );
} 