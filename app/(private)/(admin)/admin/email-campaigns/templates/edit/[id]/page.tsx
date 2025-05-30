"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaFileAlt, 
  FaArrowLeft,
  FaArrowRight,
  FaChevronRight,
  FaInfoCircle,
  FaEdit,
  FaSave,
  FaUsers,
  FaPalette
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";
import VisualEditor from "@/components/email-campaigns/VisualEditor";

const CreateContainer = styled.div`
  width: 100%;
  max-width: 1200px;
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
  text-align: center;
  margin-bottom: 3rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  justify-content: center;
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
  margin-bottom: 2rem;
`;

const StepIndicator = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    gap: 0.5rem;
  }
`;

const Step = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'active' && prop !== 'completed' && prop !== 'clickable'
})<{ active: boolean; completed: boolean; clickable?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 25px;
  font-weight: 600;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  cursor: ${props => props.clickable ? 'pointer' : 'default'};
  
  ${props => {
    if (props.completed) {
      return `
        background-color: rgba(40, 167, 69, 0.2);
        color: #28a745;
        border: 2px solid #28a745;
      `;
    } else if (props.active) {
      return `
        background-color: rgba(108, 99, 255, 0.2);
        color: var(--primary);
        border: 2px solid var(--primary);
      `;
    } else {
      return `
        background-color: rgba(255, 255, 255, 0.05);
        color: var(--text-secondary);
        border: 2px solid rgba(255, 255, 255, 0.1);
      `;
    }
  }}

  ${props => props.clickable && `
    &:hover {
      background-color: rgba(108, 99, 255, 0.1);
      color: var(--primary);
      border-color: var(--primary);
      transform: translateY(-2px);
    }
  `}

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
`;

const StepConnector = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'completed'
})<{ completed: boolean }>`
  width: 40px;
  height: 2px;
  background-color: ${props => props.completed ? '#28a745' : 'rgba(255, 255, 255, 0.1)'};
  transition: background-color 0.3s ease;

  @media (max-width: 768px) {
    width: 20px;
  }
`;

const StepContent = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
  min-height: 600px;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
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

const NavigationButtons = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
`;

const NavButton = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 12px 24px;
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

interface TemplateData {
  id: string;
  name: string;
  subject: string;
  senderName: string;
  preheader: string;
  description: string;
  type: string;
  audience: string;
}

const audienceSegments = [
  {
    id: "all",
    title: "All Subscribers",
    count: 12450,
    engagement: "high",
  },
  {
    id: "new",
    title: "New Subscribers", 
    count: 1234,
    engagement: "very high",
  },
  {
    id: "active",
    title: "Active Users",
    count: 8901,
    engagement: "high",
  },
  {
    id: "customers",
    title: "Customers",
    count: 3456,
    engagement: "medium",
  },
  {
    id: "inactive",
    title: "Inactive Users",
    count: 2109,
    engagement: "low",
  }
];

function EditTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  
  const [templateData, setTemplateData] = useState<TemplateData>({
    id: params.id as string,
    name: "Welcome Email Template",
    subject: "Welcome to Cymasphere! 🎵",
    senderName: "Cymasphere Team",
    preheader: "We're excited to have you join our community",
    description: "A warm welcome message for new subscribers",
    type: "welcome",
    audience: "new"
  });

  // Email elements for the visual editor
  const [emailElements, setEmailElements] = useState([
    { id: 'header_' + Date.now(), type: 'header', content: 'Welcome to Cymasphere! 🎵' },
    { id: 'text_' + Date.now() + 1, type: 'text', content: 'Hi {{firstName}}, We\'re excited to have you join our community of music creators and synthesizer enthusiasts.' },
    { id: 'button_' + Date.now(), type: 'button', content: '🚀 Get Started Now', url: '#' },
    { id: 'image_' + Date.now(), type: 'image', src: 'https://via.placeholder.com/600x300/667eea/ffffff?text=🎵+Welcome+to+Cymasphere' }
  ]);
  
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

  const steps = [
    { number: 1, title: "Template Setup", icon: FaInfoCircle },
    { number: 2, title: "Content", icon: FaEdit }
  ];

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepNumber: number) => {
    if (stepNumber >= 1 && stepNumber <= steps.length) {
      setCurrentStep(stepNumber);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSavingMessage('Saving template...');
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Saving template:', templateData, emailElements);
      setSavingMessage('Template saved successfully!');
      
      setTimeout(() => {
        router.push('/admin/email-campaigns/templates');
      }, 1500);
      
    } catch (error) {
      console.error('Error saving template:', error);
      setSavingMessage('Error saving template. Please try again.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSavingMessage(''), 3000);
    }
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaInfoCircle style={{ color: 'var(--primary)' }} />
                Template Setup
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Set up your template details, select your target audience, and choose template type.
              </p>
            </div>
            
            <FormGrid>
              <FormGroup>
                <Label>Template Name</Label>
                <Input
                  type="text"
                  value={templateData.name}
                  onChange={(e) => setTemplateData({...templateData, name: e.target.value})}
                  placeholder="Enter template name"
                />
              </FormGroup>
              <FormGroup>
                <Label>Default Email Subject</Label>
                <Input
                  type="text"
                  value={templateData.subject}
                  onChange={(e) => setTemplateData({...templateData, subject: e.target.value})}
                  placeholder="Enter default email subject line"
                />
              </FormGroup>
            </FormGrid>
            
            <FormGrid>
              <FormGroup>
                <Label>Default Sender Name</Label>
                <Input
                  type="text"
                  value={templateData.senderName}
                  onChange={(e) => setTemplateData({...templateData, senderName: e.target.value})}
                  placeholder="e.g. Cymasphere Team"
                />
              </FormGroup>
              <FormGroup>
                <Label>Default Preheader Text</Label>
                <Input
                  type="text"
                  value={templateData.preheader}
                  onChange={(e) => setTemplateData({...templateData, preheader: e.target.value})}
                  placeholder="Preview text that appears next to subject line"
                />
              </FormGroup>
            </FormGrid>
            
            <FormGroup>
              <Label>Template Description</Label>
              <TextArea
                value={templateData.description}
                onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                placeholder="Describe the purpose of this template"
              />
            </FormGroup>
            
            <FormGrid>
              <FormGroup>
                <Label>Template Type</Label>
                <Select
                  value={templateData.type}
                  onChange={(e) => setTemplateData({...templateData, type: e.target.value})}
                >
                  <option value="welcome">Welcome Email</option>
                  <option value="newsletter">Newsletter</option>
                  <option value="promotional">Promotional</option>
                  <option value="transactional">Transactional</option>
                  <option value="announcement">Announcement</option>
                  <option value="event">Event</option>
                </Select>
              </FormGroup>
              <FormGroup>
                <Label>Target Audience</Label>
                <Select
                  value={templateData.audience}
                  onChange={(e) => setTemplateData({...templateData, audience: e.target.value})}
                >
                  {audienceSegments.map((segment) => (
                    <option key={segment.id} value={segment.id}>
                      {segment.title} - {segment.count.toLocaleString()} subscribers
                    </option>
                  ))}
                </Select>
              </FormGroup>
            </FormGrid>
          </StepContent>
        );

      case 2:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit">
            <div style={{ marginBottom: '2rem' }}>
              <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaEdit style={{ color: 'var(--primary)' }} />
                Design Your Template
              </h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                Use the drag-and-drop visual editor to design your email template.
              </p>
            </div>
            
            <VisualEditor
              emailElements={emailElements}
              setEmailElements={setEmailElements}
              campaignData={{
                senderName: templateData.senderName,
                subject: templateData.subject,
                preheader: templateData.preheader
              }}
              rightPanelExpanded={true}
            />
          </StepContent>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <NextSEO
        title={`Edit Template: ${templateData.name}`}
        description="Edit email template with visual editor"
      />
      
      <CreateContainer>
        <Breadcrumbs>
          <BreadcrumbLink href="/admin/email-campaigns">Email Campaigns</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/templates">Templates</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>Edit: {templateData.name}</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <Title>
            <FaFileAlt />
            Edit Template
          </Title>
          <Subtitle>
            Step {currentStep} of {steps.length}: {steps[currentStep - 1].title}
          </Subtitle>
        </Header>

        <StepIndicator>
          {steps.map((step, index) => (
            <React.Fragment key={step.number}>
              <Step
                active={currentStep === step.number}
                completed={currentStep > step.number}
                clickable={true}
                onClick={() => goToStep(step.number)}
              >
                <step.icon />
                {step.title}
              </Step>
              {index < steps.length - 1 && (
                <StepConnector completed={currentStep > step.number} />
              )}
            </React.Fragment>
          ))}
        </StepIndicator>

        <AnimatePresence mode="wait">
          {renderStepContent()}
        </AnimatePresence>

        <NavigationButtons>
          <NavButton onClick={() => router.back()}>
            <FaArrowLeft />
            Back to Templates
          </NavButton>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {currentStep > 1 && (
              <NavButton onClick={prevStep}>
                <FaArrowLeft />
                Previous
              </NavButton>
            )}
            
            {currentStep < steps.length ? (
              <NavButton variant="primary" onClick={nextStep}>
                Next
                <FaArrowRight />
              </NavButton>
            ) : (
              <NavButton variant="primary" onClick={handleSave} disabled={isSaving}>
                <FaSave />
                {isSaving ? 'Saving...' : 'Save Template'}
              </NavButton>
            )}
          </div>
        </NavigationButtons>

        {/* Saving Feedback Message */}
        <AnimatePresence>
          {savingMessage && (
            <motion.div
              style={{
                position: 'fixed',
                top: '20px',
                right: '20px',
                padding: '1rem 1.5rem',
                borderRadius: '8px',
                color: 'white',
                fontWeight: '600',
                zIndex: 1000,
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.2)',
                backgroundColor: savingMessage.includes('Error') ? '#dc3545' : '#28a745'
              }}
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.3 }}
            >
              {savingMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </CreateContainer>
    </>
  );
}

export default EditTemplatePage; 