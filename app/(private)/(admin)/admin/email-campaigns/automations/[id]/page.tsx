"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaCogs, 
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaEye,
  FaPlay,
  FaPause,
  FaStop,
  FaTrash,
  FaChevronRight,
  FaInfoCircle,
  FaProjectDiagram,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaPlus,
  FaTimes,
  FaEnvelope,
  FaClock,
  FaFilter
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";

const Container = styled.div`
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

const Header = styled.div`
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

const HeaderLeft = styled.div`
  flex: 1;
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
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const MetaRow = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
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

const MetricItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);

  strong {
    color: var(--text);
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'variant'
})<{ variant?: 'primary' | 'secondary' | 'danger' | 'warning' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 16px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 600;

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
          border: 1px solid rgba(255, 255, 255, 0.1);
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--text);
          }
        `;
    }
  }}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  &:hover {
      transform: none;
      box-shadow: none;
    }
  }
`;

const TabNavigation = styled.div`
  display: flex;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 2rem;
  overflow-x: auto;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  color: ${props => props.active ? 'var(--primary)' : 'var(--text-secondary)'};
  font-weight: ${props => props.active ? '600' : '500'};
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  &:hover {
    color: var(--text);
  }
`;

const TabContent = styled(motion.div)`
  min-height: 400px;
`;

const Section = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.3rem;
  color: var(--text);
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: var(--primary);
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: var(--text);
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
`;

const TextArea = styled.textarea`
  padding: 12px 16px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 0.9rem;
  transition: all 0.3s ease;
  resize: vertical;
  min-height: 100px;

  &:focus {
    outline: none;
    border-color: var(--primary);
    box-shadow: 0 0 0 2px rgba(108, 99, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
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

  option {
    background-color: var(--card-bg);
    color: var(--text);
  }
`;

const WorkflowBuilder = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
`;

const WorkflowSteps = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const WorkflowStep = styled.div<{ type: string }>`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  border-radius: 12px;
  border: 2px solid ${props => {
    switch (props.type) {
      case 'trigger': return 'rgba(40, 167, 69, 0.3)';
      case 'condition': return 'rgba(255, 193, 7, 0.3)';
      case 'action': return 'rgba(108, 99, 255, 0.3)';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  background-color: ${props => {
    switch (props.type) {
      case 'trigger': return 'rgba(40, 167, 69, 0.1)';
      case 'condition': return 'rgba(255, 193, 7, 0.1)';
      case 'action': return 'rgba(108, 99, 255, 0.1)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const StepIcon = styled.div<{ type: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => {
    switch (props.type) {
      case 'trigger': return '#28a745';
      case 'condition': return '#ffc107';
      case 'action': return 'var(--primary)';
      default: return 'var(--text-secondary)';
    }
  }};
  color: white;
  font-size: 1.2rem;
`;

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  font-size: 1.1rem;
  color: var(--text);
  margin-bottom: 0.25rem;
  font-weight: 600;
`;

const StepDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
`;

const StepActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StepButton = styled.button`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text);
  }
`;

const StepConnector = styled.div`
  display: flex;
  justify-content: center;
  margin: 0.5rem 0;
`;

const ConnectorLine = styled.div`
  width: 2px;
  height: 20px;
  background-color: rgba(255, 255, 255, 0.2);
`;

const AddStepButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 1.5rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  background-color: rgba(255, 255, 255, 0.02);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  font-weight: 500;

  &:hover {
    border-color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
    color: var(--primary);
    transform: translateY(-2px);
  }
`;

const AnalyticsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const AnalyticsCard = styled.div`
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  text-align: center;
`;

const AnalyticsValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.5rem;
`;

const AnalyticsLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

// Type definitions
interface TriggerConfig {
  event: string;
  conditions: any[];
}

interface ConditionConfig {
  delay: string;
  delayType: string;
}

interface ActionConfig {
  template: string;
  subject: string;
}

interface AutomationStep {
  id: string;
  type: 'trigger' | 'condition' | 'action';
  title: string;
  description: string;
  config: TriggerConfig | ConditionConfig | ActionConfig;
}

interface Automation {
  id: string;
  title: string;
  description: string;
  status: string;
  trigger: string;
  subscribers: number;
  sent: number;
  openRate: number;
  createdAt: string;
  steps: AutomationStep[];
}

function AutomationEditPage() {
  const [activeTab, setActiveTab] = useState("details");
  const [automation, setAutomation] = useState<Automation>({
  id: "1",
    title: "Welcome Series",
    description: "Automated welcome email series for new subscribers",
  status: "active",
  trigger: "User signup",
  subscribers: 1250,
    sent: 3420,
    openRate: 68.5,
  createdAt: "2024-01-15",
  steps: [
    {
      id: "1",
      type: "trigger",
        title: "User Signup",
        description: "When a new user signs up",
        config: { event: "signup", conditions: [] }
    },
    {
      id: "2",
      type: "action",
        title: "Welcome Email",
        description: "Send welcome email immediately",
        config: { template: "welcome", subject: "Welcome to Cymasphere!" }
    },
    {
        id: "3",
      type: "condition",
        title: "Wait 1 Day",
        description: "Wait 24 hours before next step",
        config: { delay: "1", delayType: "days" }
    },
    {
        id: "4",
      type: "action",
        title: "Getting Started Email",
        description: "Send getting started guide",
        config: { template: "getting-started", subject: "Get started with Cymasphere" }
    }
  ]
  });

  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  const handleSave = () => {
    console.log("Saving automation...", automation);
  };

  const handleAction = (action: string) => {
    console.log("Performing action:", action);
  };

  const addStep = (type: 'trigger' | 'condition' | 'action') => {
    const newStep: AutomationStep = {
      id: Date.now().toString(),
      type,
      title: type === 'trigger' ? 'New Trigger' : 
             type === 'condition' ? 'New Condition' : 'New Action',
      description: `Configure your ${type}`,
      config: type === 'trigger' ? { event: '', conditions: [] } :
              type === 'condition' ? { delay: '1', delayType: 'hours' } :
              { template: '', subject: '' }
    };
    
    setAutomation({
      ...automation,
      steps: [...automation.steps, newStep]
    });
  };

  const removeStep = (stepId: string) => {
    setAutomation({
      ...automation,
      steps: automation.steps.filter(step => step.id !== stepId)
    });
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  if (languageLoading) {
    return <LoadingComponent />;
  }

  return (
    <>
      <NextSEO
        title={`Edit Automation: ${automation.title}`}
        description="Edit email automation workflow, triggers, and actions"
      />
      
      <Container>
        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns">Email Campaigns</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/automations">Automations</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>{automation.title}</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <HeaderLeft>
            <Title>
              <FaCogs />
              {automation.title}
            </Title>
            <Subtitle>
              Edit automation workflow, triggers, and actions
            </Subtitle>
            <MetaRow>
              <StatusBadge status={automation.status}>{automation.status}</StatusBadge>
              <MetricItem>
                <FaUsers />
                <strong>{automation.subscribers.toLocaleString()}</strong> subscribers
              </MetricItem>
              <MetricItem>
                <FaChartLine />
                <strong>{automation.openRate}%</strong> open rate
              </MetricItem>
            </MetaRow>
          </HeaderLeft>
          <HeaderActions>
            <ActionButton onClick={() => handleAction('test')}>
              <FaEye />
              Test
            </ActionButton>
            {automation.status === 'active' ? (
              <ActionButton variant="warning" onClick={() => handleAction('pause')}>
                <FaPause />
                Pause
              </ActionButton>
            ) : (
              <ActionButton variant="primary" onClick={() => handleAction('start')}>
                <FaPlay />
                Start
              </ActionButton>
            )}
            <ActionButton variant="primary" onClick={handleSave}>
              <FaSave />
              Save
            </ActionButton>
            <ActionButton variant="danger" onClick={() => handleAction('delete')}>
              <FaTrash />
              Delete
            </ActionButton>
          </HeaderActions>
        </Header>

        <TabNavigation>
          <TabButton 
            active={activeTab === "details"} 
            onClick={() => setActiveTab("details")}
          >
            <FaInfoCircle />
            Details
          </TabButton>
          <TabButton 
            active={activeTab === "workflow"} 
            onClick={() => setActiveTab("workflow")}
          >
            <FaProjectDiagram />
            Workflow
          </TabButton>
          <TabButton 
            active={activeTab === "analytics"} 
            onClick={() => setActiveTab("analytics")}
          >
            <FaChartLine />
            Analytics
          </TabButton>
        </TabNavigation>

        <TabContent
          key={activeTab}
          variants={tabVariants}
          initial="hidden"
          animate="visible"
        >
          {activeTab === "details" && (
            <Section>
              <SectionTitle>
                <FaInfoCircle />
                Automation Details
              </SectionTitle>
              <FormGrid>
                <FormGroup>
                  <Label>Automation Name</Label>
                  <Input
                    type="text"
                    value={automation.title}
                    onChange={(e) => setAutomation({...automation, title: e.target.value})}
                    placeholder="Enter automation name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Status</Label>
                  <Select
                    value={automation.status}
                    onChange={(e) => setAutomation({...automation, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="stopped">Stopped</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Trigger Event</Label>
                  <Select
                    value={automation.trigger}
                    onChange={(e) => setAutomation({...automation, trigger: e.target.value})}
                  >
                    <option value="User signup">User Signup</option>
                    <option value="Purchase made">Purchase Made</option>
                    <option value="Cart abandoned">Cart Abandoned</option>
                    <option value="User inactive">User Inactive</option>
                    <option value="Birthday">Birthday</option>
                  </Select>
                </FormGroup>
              </FormGrid>
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={automation.description}
                  onChange={(e) => setAutomation({...automation, description: e.target.value})}
                  placeholder="Automation description for internal use"
                />
              </FormGroup>
            </Section>
          )}

          {activeTab === "workflow" && (
            <Section>
              <SectionTitle>
                <FaProjectDiagram />
                Workflow Builder
              </SectionTitle>
              <WorkflowBuilder>
                <WorkflowSteps>
                  {automation.steps.map((step, index) => (
                    <React.Fragment key={step.id}>
                      <WorkflowStep type={step.type}>
                        <StepIcon type={step.type}>
                          {step.type === 'trigger' && <FaPlay />}
                          {step.type === 'condition' && <FaClock />}
                          {step.type === 'action' && <FaEnvelope />}
                        </StepIcon>
                        <StepContent>
                          <StepTitle>{step.title}</StepTitle>
                          <StepDescription>{step.description}</StepDescription>
                        </StepContent>
                        <StepActions>
                          <StepButton>
                            <FaEdit />
                          </StepButton>
                          <StepButton onClick={() => removeStep(step.id)}>
                            <FaTimes />
                          </StepButton>
                        </StepActions>
                      </WorkflowStep>
                      {index < automation.steps.length - 1 && (
                        <StepConnector>
                          <ConnectorLine />
                        </StepConnector>
                      )}
                    </React.Fragment>
                  ))}
                  
                  <StepConnector>
                    <ConnectorLine />
                  </StepConnector>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <AddStepButton onClick={() => addStep('condition')}>
                      <FaPlus />
                      Add Condition
                    </AddStepButton>
                    <AddStepButton onClick={() => addStep('action')}>
                      <FaPlus />
                      Add Action
                    </AddStepButton>
                  </div>
                </WorkflowSteps>
              </WorkflowBuilder>
            </Section>
          )}

          {activeTab === "analytics" && (
            <Section>
              <SectionTitle>
                <FaChartLine />
                Analytics & Performance
              </SectionTitle>
              <AnalyticsGrid>
                <AnalyticsCard>
                  <AnalyticsValue>{automation.subscribers.toLocaleString()}</AnalyticsValue>
                  <AnalyticsLabel>Total Subscribers</AnalyticsLabel>
                </AnalyticsCard>
                <AnalyticsCard>
                  <AnalyticsValue>{automation.sent.toLocaleString()}</AnalyticsValue>
                  <AnalyticsLabel>Emails Sent</AnalyticsLabel>
                </AnalyticsCard>
                <AnalyticsCard>
                  <AnalyticsValue>{automation.openRate}%</AnalyticsValue>
                  <AnalyticsLabel>Open Rate</AnalyticsLabel>
                </AnalyticsCard>
                <AnalyticsCard>
                  <AnalyticsValue>45.2%</AnalyticsValue>
                  <AnalyticsLabel>Click Rate</AnalyticsLabel>
                </AnalyticsCard>
              </AnalyticsGrid>
            </Section>
          )}
        </TabContent>
      </Container>
    </>
  );
}

export default AutomationEditPage; 