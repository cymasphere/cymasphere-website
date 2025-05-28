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

const EditContainer = styled.div`
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

const AutomationTitle = styled.h1`
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

const AutomationMeta = styled.div`
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

  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'warning' }>`
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
  border-radius: 8px;
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
  border-radius: 8px;
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
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  }};
  position: relative;
`;

const StepIcon = styled.div<{ type: string }>`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  flex-shrink: 0;
  
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

const StepContent = styled.div`
  flex: 1;
`;

const StepTitle = styled.h4`
  margin: 0 0 0.5rem 0;
  color: var(--text);
  font-size: 1.1rem;
`;

const StepDescription = styled.p`
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const StepActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const StepButton = styled.button`
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text);
  }
`;

const AddStepButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  font-size: 0.9rem;

  &:hover {
    border-color: var(--primary);
    color: var(--primary);
    background-color: rgba(108, 99, 255, 0.05);
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
  background: linear-gradient(to bottom, var(--primary), var(--accent));
  border-radius: 1px;
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

// Mock data
const mockAutomation: Automation = {
  id: "1",
  title: "Welcome Series Automation",
  description: "3-email welcome sequence for new subscribers",
  status: "active",
  trigger: "User signup",
  subscribers: 1250,
  sent: 3750,
  openRate: 24.5,
  createdAt: "2024-01-15",
  steps: [
    {
      id: "1",
      type: "trigger",
      title: "User Signs Up",
      description: "When a new user creates an account",
      config: {
        event: "user_signup",
        conditions: []
      } as TriggerConfig
    },
    {
      id: "2",
      type: "condition",
      title: "Wait 1 Hour",
      description: "Delay before sending first email",
      config: {
        delay: "1h",
        delayType: "time"
      } as ConditionConfig
    },
    {
      id: "3",
      type: "action",
      title: "Send Welcome Email",
      description: "Send the first welcome email",
      config: {
        template: "welcome-email-1",
        subject: "Welcome to Cymasphere!"
      } as ActionConfig
    },
    {
      id: "4",
      type: "condition",
      title: "Wait 3 Days",
      description: "Wait before sending follow-up",
      config: {
        delay: "3d",
        delayType: "time"
      } as ConditionConfig
    },
    {
      id: "5",
      type: "action",
      title: "Send Tutorial Email",
      description: "Send tutorial and tips email",
      config: {
        template: "tutorial-email",
        subject: "Get started with your first track"
      } as ActionConfig
    }
  ]
};

function AutomationEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [automation, setAutomation] = useState(mockAutomation);
  
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

  const handleSave = () => {
    console.log("Saving automation:", automation);
    // Implement save logic here
  };

  const handleAction = (action: string) => {
    console.log(`${action} automation:`, automation.id);
    // Implement action logic here
  };

  const addStep = (type: 'trigger' | 'condition' | 'action') => {
    let config: TriggerConfig | ConditionConfig | ActionConfig;
    
    if (type === 'trigger') {
      config = { event: "user_signup", conditions: [] };
    } else if (type === 'condition') {
      config = { delay: "1h", delayType: "time" };
    } else {
      config = { template: "default-template", subject: "Default Subject" };
    }

    const newStep: AutomationStep = {
      id: Date.now().toString(),
      type,
      title: `New ${type}`,
      description: `Configure this ${type}`,
      config
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

  return (
    <>
      <NextSEO
        title={`Edit Automation: ${automation.title}`}
        description="Edit email automation workflow, triggers, and actions"
      />
      
      <EditContainer>
        <BackButton href="/admin/email-campaigns/automations">
          <FaArrowLeft />
          Back to Automations
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/automations">Email Automations</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>{automation.title}</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <HeaderLeft>
            <AutomationTitle>
              <FaCogs />
              {automation.title}
            </AutomationTitle>
            <AutomationMeta>
              <StatusBadge status={automation.status}>{automation.status}</StatusBadge>
              <MetricItem>
                <FaUsers />
                <strong>{automation.subscribers.toLocaleString()}</strong> subscribers
              </MetricItem>
              <MetricItem>
                <FaChartLine />
                <strong>{automation.openRate}%</strong> open rate
              </MetricItem>
            </AutomationMeta>
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
                Automation Analytics
              </SectionTitle>
              <FormGrid>
                <div style={{ 
                  background: 'rgba(40, 167, 69, 0.1)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(40, 167, 69, 0.2)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#28a745' }}>Total Subscribers</h4>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                    {automation.subscribers.toLocaleString()}
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(108, 99, 255, 0.1)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(108, 99, 255, 0.2)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: 'var(--primary)' }}>Emails Sent</h4>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                    {automation.sent.toLocaleString()}
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(255, 193, 7, 0.1)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 193, 7, 0.2)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#ffc107' }}>Open Rate</h4>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                    {automation.openRate}%
                  </p>
                </div>
                <div style={{ 
                  background: 'rgba(23, 162, 184, 0.1)', 
                  padding: '1.5rem', 
                  borderRadius: '8px',
                  border: '1px solid rgba(23, 162, 184, 0.2)'
                }}>
                  <h4 style={{ margin: '0 0 0.5rem 0', color: '#17a2b8' }}>Conversion Rate</h4>
                  <p style={{ margin: 0, fontSize: '2rem', fontWeight: 'bold', color: 'var(--text)' }}>
                    3.2%
                  </p>
                </div>
              </FormGrid>
              
              <div style={{ 
                background: 'rgba(255, 255, 255, 0.02)', 
                padding: '1.5rem', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                marginTop: '1.5rem'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: 'var(--text)' }}>Step Performance</h4>
                {automation.steps.filter(step => step.type === 'action').map((step, index) => (
                  <div key={step.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: index < automation.steps.filter(s => s.type === 'action').length - 1 ? '1px solid rgba(255, 255, 255, 0.05)' : 'none'
                  }}>
                    <span style={{ color: 'var(--text)' }}>{step.title}</span>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {Math.floor(Math.random() * 1000 + 500)} sent
                      </span>
                      <span style={{ color: 'var(--primary)', fontWeight: 'bold' }}>
                        {(Math.random() * 30 + 15).toFixed(1)}% open
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </TabContent>
      </EditContainer>
    </>
  );
}

export default AutomationEditPage; 