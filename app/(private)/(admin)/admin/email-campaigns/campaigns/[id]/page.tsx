"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaEnvelopeOpen, 
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaEye,
  FaPlay,
  FaPause,
  FaTrash,
  FaChevronRight,
  FaInfoCircle,
  FaFileAlt,
  FaCalendarAlt,
  FaUsers,
  FaChartLine,
  FaCog,
  FaFlask
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
      case 'completed':
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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

const ContentEditor = styled.div`
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  background-color: rgba(255, 255, 255, 0.05);
  min-height: 300px;
  padding: 1rem;
`;

const EditorToolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 0.75rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button`
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

const PreviewArea = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 1rem;
`;

const ScheduleOptions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ScheduleOption = styled.div<{ selected: boolean }>`
  padding: 1rem;
  border: 2px solid ${props => props.selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  background-color: ${props => props.selected ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: var(--primary);
  }
`;

const OptionTitle = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const OptionDescription = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

// Mock data
const mockCampaign = {
  id: "1",
  title: "Welcome Series",
  description: "Automated welcome email sequence for new subscribers",
  status: "active",
  recipients: 1250,
  sent: 3750,
  openRate: 24.5,
  clickRate: 3.2,
  createdAt: "2024-01-15",
  subject: "Welcome to Cymasphere! 🎵",
  fromName: "Cymasphere Team",
  fromEmail: "hello@cymasphere.com",
  replyTo: "support@cymasphere.com",
  content: `
    <h2>Welcome to Cymasphere!</h2>
    <p>We're excited to have you join our community of music creators and synthesizer enthusiasts.</p>
    <p>Here's what you can expect:</p>
    <ul>
      <li>Access to our powerful web-based synthesizer</li>
      <li>Regular updates on new features and sounds</li>
      <li>Tips and tutorials from our team</li>
    </ul>
    <p>Get started by exploring our synthesizer and creating your first track!</p>
  `,
  scheduleType: "immediate",
  scheduledDate: null,
  timezone: "UTC"
};

function CampaignEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [campaign, setCampaign] = useState(mockCampaign);
  const [scheduleType, setScheduleType] = useState(campaign.scheduleType);
  
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
    console.log("Saving campaign:", campaign);
    // Implement save logic here
  };

  const handleAction = (action: string) => {
    console.log(`${action} campaign:`, campaign.id);
    if (action === 'ab-test') {
      router.push(`/admin/email-campaigns/campaigns/${params.id}/ab-test`);
    }
    // Implement other action logic here
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <NextSEO
        title={`Edit Campaign: ${campaign.title}`}
        description="Edit email campaign details, content, and schedule"
      />
      
      <EditContainer>
        <BackButton href="/admin/email-campaigns/campaigns">
          <FaArrowLeft />
          Back to Campaigns
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/campaigns">Email Campaigns</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>{campaign.title}</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <HeaderLeft>
            <CampaignTitle>
              <FaEnvelopeOpen />
              {campaign.title}
            </CampaignTitle>
            <CampaignMeta>
              <StatusBadge status={campaign.status}>{campaign.status}</StatusBadge>
              <MetricItem>
                <FaUsers />
                <strong>{campaign.recipients.toLocaleString()}</strong> recipients
              </MetricItem>
              <MetricItem>
                <FaChartLine />
                <strong>{campaign.openRate}%</strong> open rate
              </MetricItem>
            </CampaignMeta>
          </HeaderLeft>
          <HeaderActions>
            <ActionButton onClick={() => handleAction('ab-test')}>
              <FaFlask />
              A/B Test
            </ActionButton>
            <ActionButton onClick={() => handleAction('preview')}>
              <FaEye />
              Preview
            </ActionButton>
            {campaign.status === 'active' ? (
              <ActionButton onClick={() => handleAction('pause')}>
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
            active={activeTab === "content"} 
            onClick={() => setActiveTab("content")}
          >
            <FaFileAlt />
            Content
          </TabButton>
          <TabButton 
            active={activeTab === "schedule"} 
            onClick={() => setActiveTab("schedule")}
          >
            <FaCalendarAlt />
            Schedule
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
                Campaign Details
              </SectionTitle>
              <FormGrid>
                <FormGroup>
                  <Label>Campaign Name</Label>
                  <Input
                    type="text"
                    value={campaign.title}
                    onChange={(e) => setCampaign({...campaign, title: e.target.value})}
                    placeholder="Enter campaign name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Status</Label>
                  <Select
                    value={campaign.status}
                    onChange={(e) => setCampaign({...campaign, status: e.target.value})}
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="paused">Paused</option>
                    <option value="completed">Completed</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>From Name</Label>
                  <Input
                    type="text"
                    value={campaign.fromName}
                    onChange={(e) => setCampaign({...campaign, fromName: e.target.value})}
                    placeholder="Sender name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>From Email</Label>
                  <Input
                    type="email"
                    value={campaign.fromEmail}
                    onChange={(e) => setCampaign({...campaign, fromEmail: e.target.value})}
                    placeholder="sender@example.com"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Reply To</Label>
                  <Input
                    type="email"
                    value={campaign.replyTo}
                    onChange={(e) => setCampaign({...campaign, replyTo: e.target.value})}
                    placeholder="reply@example.com"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Subject Line</Label>
                  <Input
                    type="text"
                    value={campaign.subject}
                    onChange={(e) => setCampaign({...campaign, subject: e.target.value})}
                    placeholder="Email subject"
                  />
                </FormGroup>
              </FormGrid>
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={campaign.description}
                  onChange={(e) => setCampaign({...campaign, description: e.target.value})}
                  placeholder="Campaign description for internal use"
                />
              </FormGroup>
            </Section>
          )}

          {activeTab === "content" && (
            <Section>
              <SectionTitle>
                <FaFileAlt />
                Email Content
              </SectionTitle>
              <FormGroup>
                <Label>Email Content</Label>
                <ContentEditor>
                  <EditorToolbar>
                    <ToolbarButton>Bold</ToolbarButton>
                    <ToolbarButton>Italic</ToolbarButton>
                    <ToolbarButton>Link</ToolbarButton>
                    <ToolbarButton>Image</ToolbarButton>
                    <ToolbarButton>List</ToolbarButton>
                    <ToolbarButton>Code</ToolbarButton>
                  </EditorToolbar>
                  <TextArea
                    value={campaign.content}
                    onChange={(e) => setCampaign({...campaign, content: e.target.value})}
                    placeholder="Write your email content here..."
                    style={{ border: 'none', background: 'transparent', minHeight: '200px' }}
                  />
                </ContentEditor>
              </FormGroup>
              <PreviewArea>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Preview</h4>
                <div dangerouslySetInnerHTML={{ __html: campaign.content }} />
              </PreviewArea>
            </Section>
          )}

          {activeTab === "schedule" && (
            <Section>
              <SectionTitle>
                <FaCalendarAlt />
                Campaign Schedule
              </SectionTitle>
              <ScheduleOptions>
                <ScheduleOption 
                  selected={scheduleType === "immediate"}
                  onClick={() => setScheduleType("immediate")}
                >
                  <OptionTitle>Send Immediately</OptionTitle>
                  <OptionDescription>
                    Campaign will be sent as soon as it's activated
                  </OptionDescription>
                </ScheduleOption>
                <ScheduleOption 
                  selected={scheduleType === "scheduled"}
                  onClick={() => setScheduleType("scheduled")}
                >
                  <OptionTitle>Schedule for Later</OptionTitle>
                  <OptionDescription>
                    Choose a specific date and time to send
                  </OptionDescription>
                </ScheduleOption>
                <ScheduleOption 
                  selected={scheduleType === "trigger"}
                  onClick={() => setScheduleType("trigger")}
                >
                  <OptionTitle>Trigger-based</OptionTitle>
                  <OptionDescription>
                    Send based on user actions or events
                  </OptionDescription>
                </ScheduleOption>
              </ScheduleOptions>
              
              {scheduleType === "scheduled" && (
                <FormGrid>
                  <FormGroup>
                    <Label>Send Date</Label>
                    <Input
                      type="date"
                      placeholder="Select date"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Send Time</Label>
                    <Input
                      type="time"
                      placeholder="Select time"
                    />
                  </FormGroup>
                  <FormGroup>
                    <Label>Timezone</Label>
                    <Select value={campaign.timezone}>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time</option>
                      <option value="America/Chicago">Central Time</option>
                      <option value="America/Denver">Mountain Time</option>
                      <option value="America/Los_Angeles">Pacific Time</option>
                    </Select>
                  </FormGroup>
                </FormGrid>
              )}

              {scheduleType === "trigger" && (
                <FormGrid>
                  <FormGroup>
                    <Label>Trigger Event</Label>
                    <Select>
                      <option value="signup">User Signup</option>
                      <option value="purchase">Purchase Made</option>
                      <option value="abandoned_cart">Cart Abandoned</option>
                      <option value="inactive">User Inactive</option>
                      <option value="birthday">Birthday</option>
                    </Select>
                  </FormGroup>
                  <FormGroup>
                    <Label>Delay</Label>
                    <Select>
                      <option value="immediate">Immediately</option>
                      <option value="1h">1 Hour</option>
                      <option value="1d">1 Day</option>
                      <option value="3d">3 Days</option>
                      <option value="1w">1 Week</option>
                    </Select>
                  </FormGroup>
                </FormGrid>
              )}
            </Section>
          )}
        </TabContent>
      </EditContainer>
    </>
  );
}

export default CampaignEditPage; 