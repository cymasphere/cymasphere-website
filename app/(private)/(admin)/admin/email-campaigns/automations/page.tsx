"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaCogs, 
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
  FaChartLine,
  FaCalendarAlt,
  FaUsers,
  FaRobot,
  FaClock,
  FaEnvelope
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const AutomationsContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const AutomationsTitle = styled.h1`
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

const AutomationsSubtitle = styled.p`
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

const AutomationsGrid = styled.div`
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

  &:last-child {
    text-align: center;
  }
`;

const AutomationTitle = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const AutomationDescription = styled.div`
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
      case 'stopped':
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

const WorkflowSteps = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  flex-wrap: wrap;
`;

const StepIcon = styled.span<{ type: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  
  ${(props) => {
    switch (props.type) {
      case 'trigger':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'condition':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'action':
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

const StepArrow = styled.span`
  color: var(--text-secondary);
  font-size: 0.7rem;
  margin: 0 0.25rem;
`;

const MetricValue = styled.div`
  font-weight: 600;
  color: var(--text);
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'warning' }>`
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
      case 'warning':
        return `
          background-color: #ffc107;
          color: #212529;
          &:hover {
            background-color: #e0a800;
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

// Mock data
const mockAutomations = [
  {
    id: "1",
    title: "Welcome Series",
    description: "3-email welcome sequence for new subscribers",
    status: "active",
    trigger: "User signup",
    steps: [
      { type: "trigger", icon: "👋", label: "Signup" },
      { type: "condition", icon: "⏱️", label: "Wait 1h" },
      { type: "action", icon: "📧", label: "Send Email" },
    ],
    subscribers: 1250,
    sent: 3750,
    openRate: 24.5,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Abandoned Cart Recovery",
    description: "Recover abandoned carts with targeted emails",
    status: "active",
    trigger: "Cart abandoned",
    steps: [
      { type: "trigger", icon: "🛒", label: "Cart Left" },
      { type: "condition", icon: "⏱️", label: "Wait 2h" },
      { type: "action", icon: "📧", label: "Reminder" },
    ],
    subscribers: 890,
    sent: 2670,
    openRate: 31.2,
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    title: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    status: "paused",
    trigger: "30 days inactive",
    steps: [
      { type: "trigger", icon: "😴", label: "Inactive" },
      { type: "condition", icon: "🎯", label: "Segment" },
      { type: "action", icon: "📧", label: "Re-engage" },
    ],
    subscribers: 445,
    sent: 445,
    openRate: 18.7,
    createdAt: "2024-01-12",
  },
  {
    id: "4",
    title: "Birthday Campaign",
    description: "Send birthday wishes with special offers",
    status: "draft",
    trigger: "Birthday date",
    steps: [
      { type: "trigger", icon: "🎂", label: "Birthday" },
      { type: "condition", icon: "🎁", label: "Add Offer" },
      { type: "action", icon: "📧", label: "Send Wish" },
    ],
    subscribers: 0,
    sent: 0,
    openRate: 0,
    createdAt: "2024-01-18",
  },
  {
    id: "5",
    title: "Product Education Series",
    description: "Educate users about product features",
    status: "active",
    trigger: "Feature usage",
    steps: [
      { type: "trigger", icon: "🎵", label: "Use Feature" },
      { type: "condition", icon: "📊", label: "Check Usage" },
      { type: "action", icon: "📧", label: "Send Tips" },
    ],
    subscribers: 2100,
    sent: 6300,
    openRate: 28.9,
    createdAt: "2024-01-05",
  },
];

function AutomationsPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();

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

  const filteredAutomations = mockAutomations.filter(automation =>
    automation.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    automation.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    automation.trigger.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      value: mockAutomations.length.toString(),
      label: "Total Automations",
    },
    {
      value: mockAutomations.filter(a => a.status === "active").length.toString(),
      label: "Active Automations",
    },
    {
      value: mockAutomations.reduce((sum, a) => sum + a.subscribers, 0).toLocaleString(),
      label: "Total Subscribers",
    },
    {
      value: "26.8%",
      label: "Avg Open Rate",
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

  const handleAutomationAction = (action: string, automationId: string) => {
    console.log(`${action} automation:`, automationId);
    if (action === 'view' || action === 'edit') {
      router.push(`/admin/email-campaigns/automations/${automationId}`);
    }
    // Implement other automation actions here
  };

  return (
    <>
      <NextSEO
        title="Email Automations"
        description="Manage and monitor your email automation workflows"
      />
      
      <AutomationsContainer>
        <AutomationsTitle>
          <FaCogs />
          Email Automations
        </AutomationsTitle>
        <AutomationsSubtitle>
          Create and manage automated email workflows and sequences
        </AutomationsSubtitle>

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
              placeholder="Search automations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <CreateButton onClick={() => handleAutomationAction('create', '')}>
            <FaPlus />
            Create Automation
          </CreateButton>
        </ActionsRow>

        <AutomationsGrid>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Automation</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                <TableHeaderCell>Trigger</TableHeaderCell>
                <TableHeaderCell>Workflow</TableHeaderCell>
                <TableHeaderCell>Subscribers</TableHeaderCell>
                <TableHeaderCell>Open Rate</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredAutomations.length === 0 ? (
                <tr>
                  <TableCell colSpan={8}>
                    <EmptyState>
                      <FaCogs />
                      <h3>No automations found</h3>
                      <p>Try adjusting your search criteria or create a new automation.</p>
                    </EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredAutomations.map((automation, index) => (
                  <TableRow
                    key={automation.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    onClick={() => handleAutomationAction('view', automation.id)}
                  >
                    <TableCell>
                      <AutomationTitle>{automation.title}</AutomationTitle>
                      <AutomationDescription>{automation.description}</AutomationDescription>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={automation.status}>
                        {automation.status}
                      </StatusBadge>
                    </TableCell>
                    <TableCell>{automation.trigger}</TableCell>
                    <TableCell>
                      <WorkflowSteps>
                        {automation.steps.map((step, stepIndex) => (
                          <React.Fragment key={stepIndex}>
                            <StepIcon type={step.type}>
                              {step.icon}
                            </StepIcon>
                            {stepIndex < automation.steps.length - 1 && (
                              <StepArrow>→</StepArrow>
                            )}
                          </React.Fragment>
                        ))}
                      </WorkflowSteps>
                    </TableCell>
                    <TableCell>
                      <MetricValue>{automation.subscribers.toLocaleString()}</MetricValue>
                    </TableCell>
                    <TableCell>
                      <MetricValue>{automation.openRate}%</MetricValue>
                    </TableCell>
                    <TableCell>
                      {new Date(automation.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ActionsContainer>
                        <ActionButton onClick={() => handleAutomationAction('view', automation.id)}>
                          <FaEye />
                        </ActionButton>
                        <ActionButton onClick={() => handleAutomationAction('edit', automation.id)}>
                          <FaEdit />
                        </ActionButton>
                        {automation.status === 'active' ? (
                          <ActionButton variant="warning" onClick={() => handleAutomationAction('pause', automation.id)}>
                            <FaPause />
                          </ActionButton>
                        ) : automation.status === 'paused' ? (
                          <ActionButton variant="primary" onClick={() => handleAutomationAction('resume', automation.id)}>
                            <FaPlay />
                          </ActionButton>
                        ) : automation.status === 'draft' ? (
                          <ActionButton variant="primary" onClick={() => handleAutomationAction('start', automation.id)}>
                            <FaPlay />
                          </ActionButton>
                        ) : null}
                        {automation.status === 'active' && (
                          <ActionButton variant="danger" onClick={() => handleAutomationAction('stop', automation.id)}>
                            <FaStop />
                          </ActionButton>
                        )}
                        <ActionButton variant="danger" onClick={() => handleAutomationAction('delete', automation.id)}>
                          <FaTrash />
                        </ActionButton>
                      </ActionsContainer>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AutomationsGrid>
      </AutomationsContainer>
    </>
  );
}

export default AutomationsPage; 