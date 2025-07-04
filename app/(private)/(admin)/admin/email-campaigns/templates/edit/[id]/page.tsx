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
  FaPalette,
  FaSearch,
  FaTimes,
  FaExclamationTriangle
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";
import VisualEditor from "@/components/email-campaigns/VisualEditor";

const CreateContainer = styled.div<{ $isDesignStep: boolean }>`
  width: 100%;
  max-width: ${props => props.$isDesignStep ? 'none' : '1200px'};
  margin: ${props => props.$isDesignStep ? '0' : '0 auto'};
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

const StepContent = styled(motion.div)<{ $isDesignStep?: boolean }>`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: ${props => props.$isDesignStep ? '1rem' : '2rem'};
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
  min-height: 600px;
  width: 100%;
  max-width: ${props => props.$isDesignStep ? 'none' : 'none'};
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
  margin-bottom: 1.5rem;
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

const StatusToggleContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1rem;
`;

const StatusToggle = styled.div<{ $isActive: boolean }>`
  position: relative;
  width: 60px;
  height: 30px;
  background-color: ${props => props.$isActive ? '#28a745' : '#ffc107'};
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => props.$isActive ? '33px' : '3px'};
    width: 24px;
    height: 24px;
    background-color: white;
    border-radius: 50%;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }
`;

const StatusLabel = styled.span<{ $isActive: boolean }>`
  font-weight: 600;
  color: ${props => props.$isActive ? '#28a745' : '#ffc107'};
  font-size: 0.9rem;
`;

const NavButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'variant'
})<{ variant?: 'primary' | 'secondary' }>`
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

// Audience Selection Components (copied from campaigns)
const AudienceSelectionContainer = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
`;

const SearchInputContainer = styled.div`
  position: relative;
  margin-bottom: 1.5rem;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 16px 12px 45px;
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
    background-color: rgba(255, 255, 255, 0.08);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 15px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 0.9rem;
  pointer-events: none;
`;

const ClearSearchButton = styled.button`
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    color: var(--text);
    background: rgba(255, 255, 255, 0.1);
  }
`;

const AudienceList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  max-height: 400px;
  overflow-y: auto;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  @media (max-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const AudienceItem = styled.div<{ $isSelected: boolean; $isExcluded: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: ${props => {
    if (props.$isExcluded) return 'rgba(220, 53, 69, 0.1)';
    if (props.$isSelected) return 'rgba(40, 167, 69, 0.15)';
    return 'rgba(255, 255, 255, 0.02)';
  }};
  border: 1px solid ${props => {
    if (props.$isExcluded) return 'rgba(220, 53, 69, 0.3)';
    if (props.$isSelected) return 'rgba(40, 167, 69, 0.4)';
    return 'rgba(255, 255, 255, 0.05)';
  }};
  transition: all 0.3s ease;
  cursor: pointer;
  gap: 0.75rem;
  
  &:hover {
    background: ${props => {
      if (props.$isExcluded) return 'rgba(220, 53, 69, 0.15)';
      if (props.$isSelected) return 'rgba(40, 167, 69, 0.2)';
      return 'rgba(255, 255, 255, 0.05)';
    }};
    border-color: ${props => {
      if (props.$isExcluded) return 'rgba(220, 53, 69, 0.5)';
      if (props.$isSelected) return 'rgba(40, 167, 69, 0.6)';
      return 'rgba(255, 255, 255, 0.1)';
    }};
    transform: translateY(-1px);
  }
`;

const AudienceCheckbox = styled.input`
  width: 16px;
  height: 16px;
  cursor: pointer;
  accent-color: #28a745;
  flex-shrink: 0;
`;

const AudienceInfo = styled.div`
  flex: 1;
  cursor: pointer;
  min-width: 0;
`;

const AudienceName = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.125rem;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const AudienceDetails = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const AudienceCount = styled.span`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
`;

const AudienceType = styled.span<{ $type: 'static' | 'dynamic' }>`
  background: ${props => props.$type === 'static' ? 'rgba(255,193,7,0.2)' : 'rgba(40,167,69,0.2)'};
  color: ${props => props.$type === 'static' ? '#ffc107' : '#28a745'};
  padding: 0.125rem 0.375rem;
  border-radius: 3px;
  font-size: 0.7rem;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  white-space: nowrap;
`;

const ExcludeButton = styled.button<{ $isExcluded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid ${props => props.$isExcluded ? '#dc3545' : 'rgba(255, 255, 255, 0.2)'};
  border-radius: 4px;
  background: ${props => props.$isExcluded ? 'rgba(220, 53, 69, 0.1)' : 'rgba(255, 255, 255, 0.05)'};
  color: ${props => props.$isExcluded ? '#dc3545' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
  flex-shrink: 0;
  
  &:hover {
    background: ${props => props.$isExcluded ? 'rgba(220, 53, 69, 0.2)' : 'rgba(255, 255, 255, 0.1)'};
    border-color: ${props => props.$isExcluded ? '#dc3545' : 'rgba(255, 255, 255, 0.3)'};
    transform: translateY(-1px);
  }
  
  svg {
    font-size: 0.7rem;
  }
`;

const AudienceStatsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 1200px) {
    grid-template-columns: repeat(3, 1fr);
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
  }
`;

const AudienceStatItem = styled.div`
  text-align: center;
`;

const AudienceStatValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
`;

const AudienceStatLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StepTitle = styled.h2`
  color: var(--text);
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.5rem;
`;

const StepDescription = styled.p`
  color: var(--text-secondary);
  margin-bottom: 2rem;
  font-size: 1.1rem;
`;

interface TemplateData {
  id: string;
  name: string;
  subject: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  preheader: string;
  description: string;
  type: string;
  status: string;
  audienceIds: string[];
  excludedAudienceIds: string[];
}

interface Audience {
  id: string;
  name: string;
  description: string;
  subscriber_count: number;
  type: 'static' | 'dynamic';
}



function EditTemplatePage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [savingMessage, setSavingMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  const isNewTemplate = params.id === 'new';
  const [templateData, setTemplateData] = useState<TemplateData>({
    id: isNewTemplate ? '' : params.id as string,
    name: isNewTemplate ? "" : "Welcome Email Template",
    subject: isNewTemplate ? "" : "Welcome to Cymasphere! 🎵",
    senderName: "Cymasphere Team",
    senderEmail: "support@cymasphere.com",
    replyToEmail: "",
    preheader: isNewTemplate ? "" : "We're excited to have you join our community",
    description: isNewTemplate ? "" : "A warm welcome message for new subscribers",
    type: "welcome",
    status: "draft",
    audienceIds: [],
    excludedAudienceIds: []
  });

  // Audience management state
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [audiencesLoading, setAudiencesLoading] = useState(true);
  const [audienceSearchTerm, setAudienceSearchTerm] = useState('');

  // Email elements for the visual editor
  const [emailElements, setEmailElements] = useState([
    { id: 'header_' + Date.now(), type: 'header', content: 'Welcome to Cymasphere! 🎵' },
    { id: 'text_' + Date.now() + 1, type: 'text', content: 'Hi {{firstName}}, We\'re excited to have you join our community of music creators and synthesizer enthusiasts.' },
    { id: 'button_' + Date.now(), type: 'button', content: '🚀 Get Started Now', url: '#' },
          { id: 'image_' + Date.now(), type: 'image', src: 'https://via.placeholder.com/600x300/667eea/ffffff?text=Welcome+to+Cymasphere' }
  ]);
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Load audiences on component mount (must be before early returns)
  useEffect(() => {
    const loadAudiences = async () => {
      try {
        setAudiencesLoading(true);
        const response = await fetch('/api/email-campaigns/audiences');
        if (response.ok) {
          const data = await response.json();
          setAudiences(data.audiences || []);
        } else {
          console.error('Failed to load audiences');
          setAudiences([]);
        }
      } catch (error) {
        console.error('Error loading audiences:', error);
        setAudiences([]);
      } finally {
        setAudiencesLoading(false);
      }
    };

    loadAudiences();
  }, []);

  // Load existing template data when editing
  useEffect(() => {
    const loadTemplateData = async () => {
      if (isNewTemplate) {
        setIsLoading(false);
        return; // Skip for new templates
      }
      
      try {
        setIsLoading(true);
        console.log('Loading template data for ID:', params.id);
        console.log('Making fetch request to:', `/api/email-campaigns/templates/${params.id}`);
        const response = await fetch(`/api/email-campaigns/templates/${params.id}`);
        
        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Raw API response:', data);
          const template = data.template;
          
          console.log('Loaded template data:', template);
          console.log('Template audiences:', template.audiences);
          console.log('Template excluded audiences:', template.excludedAudiences);
          console.log('Current audiences state:', audiences);
          
          // Update template data state
          setTemplateData({
            id: template.id,
            name: template.name || '',
            subject: template.subject || '',
            senderName: template.sender_name || 'Cymasphere Team',
            senderEmail: template.sender_email || 'support@cymasphere.com',
            replyToEmail: template.reply_to_email || '',
            preheader: template.preheader || '',
            description: template.description || '',
            type: template.type || 'custom',
            status: template.status || 'draft',
            audienceIds: template.audienceIds || [],
            excludedAudienceIds: template.excludedAudienceIds || []
          });

          // If template has audience data, merge it with the existing audiences list
          if (template.audiences || template.excludedAudiences) {
            const templateAudiences = [
              ...(template.audiences || []),
              ...(template.excludedAudiences || [])
            ];
            
            // Merge with existing audiences, avoiding duplicates
            setAudiences(prevAudiences => {
              const existingIds = new Set(prevAudiences.map(a => a.id));
              const newAudiences = templateAudiences.filter(a => !existingIds.has(a.id));
              return [...prevAudiences, ...newAudiences];
            });
          }

          // Parse HTML content back to email elements if available
          if (template.htmlContent || template.html_content) {
            const htmlContent = template.htmlContent || template.html_content;
            // For now, set a basic text element with the HTML content
            // TODO: Parse HTML back to structured elements
            setEmailElements([
              { 
                id: 'loaded_content_' + Date.now(), 
                type: 'text', 
                content: htmlContent.replace(/<[^>]*>/g, '') // Strip HTML tags for now
              }
            ]);
          }
          
        } else {
          console.error('Failed to load template:', response.status, response.statusText);
          const errorData = await response.json().catch(() => ({}));
          console.error('Error details:', errorData);
          console.error('Full response:', response);
        }
      } catch (error) {
        console.error('Error loading template data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadTemplateData();
  }, [isNewTemplate, params.id]);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  if (isLoading) {
    return <LoadingComponent text="Loading template..." />;
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
      // Generate HTML content from email elements
      const htmlContent = emailElements.map((element: any) => {
        switch (element.type) {
          case 'header':
            return `<h1>${element.content}</h1>`;
          case 'text':
            return `<p>${element.content}</p>`;
          case 'button':
            return `<a href="${element.url || '#'}" style="display: inline-block; padding: 12px 24px; background-color: #6c63ff; color: white; text-decoration: none; border-radius: 6px;">${element.content}</a>`;
          case 'image':
            return `<img src="${element.src}" alt="${element.alt || ''}" style="max-width: 100%; height: auto;" />`;
          case 'divider':
            return `<hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;" />`;
          case 'spacer':
            return `<div style="height: ${element.height || '20px'};"></div>`;
          default:
            return '';
        }
      }).join('');

      // Generate text content
      const textContent = emailElements.map(element => {
        switch (element.type) {
          case 'header':
          case 'text':
            return element.content;
          case 'button':
            return `${element.content}: ${element.url || '#'}`;
          default:
            return '';
        }
      }).filter(Boolean).join('\n\n');

      const templatePayload = {
        ...(isNewTemplate ? {} : { id: templateData.id }),
        name: templateData.name,
        description: templateData.description,
        subject: templateData.subject,
        htmlContent: htmlContent,
        textContent: textContent,
        template_type: templateData.type || 'custom',
        status: templateData.status,
        audienceIds: templateData.audienceIds,
        excludedAudienceIds: templateData.excludedAudienceIds,
        variables: {} // Could extract variables from content in the future
      };

      console.log('🚀 Sending template payload:', templatePayload);
      console.log('📋 Template data state:', templateData);

      const url = '/api/email-campaigns/templates';
      const method = isNewTemplate ? 'POST' : 'PUT';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(templatePayload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save template');
      }

      const result = await response.json();
      console.log('Template saved:', result);
      
      if (templateData.status === 'draft') {
        setSavingMessage('Template saved as draft!');
        // Don't redirect when saving as draft, let user continue editing
        setTimeout(() => setSavingMessage(''), 3000);
      } else {
        setSavingMessage(isNewTemplate ? 'Template created successfully!' : 'Template updated successfully!');
        setTimeout(() => {
          router.push('/admin/email-campaigns/templates');
        }, 1500);
      }
      
    } catch (error) {
      console.error('Error saving template:', error);
      setSavingMessage(`Error saving template: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setSavingMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusToggle = () => {
    setTemplateData(prev => ({
      ...prev,
      status: prev.status === 'active' ? 'draft' : 'active'
    }));
  };

  const stepVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  // Audience management functions (copied from campaigns)
  const handleAudienceToggle = (audienceId: string, isChecked: boolean) => {
    console.log('🎯 Audience toggle:', { audienceId, isChecked });
    if (isChecked) {
      // Add to included, remove from excluded if present - SIMPLIFIED LOGIC
      setTemplateData(prev => {
        const newData = {
          ...prev,
          audienceIds: [...prev.audienceIds, audienceId], // ✅ Simple append like campaigns
          excludedAudienceIds: prev.excludedAudienceIds.filter(id => id !== audienceId)
        };
        console.log('📝 Updated template data (include):', newData);
        return newData;
      });
    } else {
      // Remove from included
      setTemplateData(prev => {
        const newData = {
          ...prev,
          audienceIds: prev.audienceIds.filter(id => id !== audienceId)
        };
        console.log('📝 Updated template data (remove):', newData);
        return newData;
      });
    }
  };

  const handleAudienceExclude = (audienceId: string) => {
    const isCurrentlyExcluded = templateData.excludedAudienceIds.includes(audienceId);
    
    if (isCurrentlyExcluded) {
      // Remove from excluded
      setTemplateData(prev => ({
        ...prev,
        excludedAudienceIds: prev.excludedAudienceIds.filter(id => id !== audienceId)
      }));
    } else {
      // Add to excluded and remove from included - MATCH CAMPAIGNS EXACTLY
      setTemplateData(prev => ({
        ...prev,
        audienceIds: prev.audienceIds.filter(id => id !== audienceId),
        excludedAudienceIds: [...prev.excludedAudienceIds, audienceId] // ✅ Simple append like campaigns
      }));
    }
  };

  const calculateAudienceStats = () => {
    const includedAudiences = audiences.filter(a => templateData.audienceIds.includes(a.id));
    const excludedAudiences = audiences.filter(a => templateData.excludedAudienceIds.includes(a.id));
    
    const totalIncluded = includedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
    const totalExcluded = excludedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
    
    return {
      includedCount: includedAudiences.length,
      excludedCount: excludedAudiences.length,
      totalIncluded,
      totalExcluded,
      estimatedReach: Math.max(0, totalIncluded - totalExcluded)
    };
  };

  const getFilteredAudiences = () => {
    if (!audienceSearchTerm.trim()) {
      return audiences;
    }
    
    const searchTerm = audienceSearchTerm.toLowerCase();
    return audiences.filter(audience => 
      audience.name.toLowerCase().includes(searchTerm) ||
      audience.description?.toLowerCase().includes(searchTerm) ||
      audience.type.toLowerCase().includes(searchTerm)
    );
  };



  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit" $isDesignStep={false}>
            <StepTitle>
              <FaInfoCircle />
              Template Setup
            </StepTitle>
            <StepDescription>
              Set up your template details, select your default audience, and configure template settings.
            </StepDescription>
            
            {/* Template Details Section */}
            <div style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ color: 'var(--text)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaInfoCircle style={{ color: 'var(--primary)' }} />
                Template Details
              </h3>
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
                  <Label>Default Sender Email</Label>
                  <Input
                    type="email"
                    value={templateData.senderEmail}
                    onChange={(e) => setTemplateData({...templateData, senderEmail: e.target.value})}
                    placeholder="e.g. support@cymasphere.com"
                  />
                </FormGroup>
              </FormGrid>
              <FormGrid>
                <FormGroup>
                  <Label>Default Reply-To Email (Optional)</Label>
                  <Input
                    type="email"
                    value={templateData.replyToEmail}
                    onChange={(e) => setTemplateData({...templateData, replyToEmail: e.target.value})}
                    placeholder="e.g. noreply@cymasphere.com"
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
              </FormGrid>
            </div>

            {/* Default Audience Selection Section */}
            <AudienceSelectionContainer>
              <h3 style={{ color: 'var(--text)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FaUsers style={{ color: 'var(--primary)' }} />
                Select Default Target Audiences
              </h3>
              
              {!audiencesLoading && audiences.length > 0 && (
                <SearchInputContainer>
                  <SearchIcon>
                    <FaSearch />
                  </SearchIcon>
                  <SearchInput
                    type="text"
                    placeholder="Search audiences by name, description, or type..."
                    value={audienceSearchTerm}
                    onChange={(e) => setAudienceSearchTerm(e.target.value)}
                  />
                  {audienceSearchTerm && (
                    <ClearSearchButton
                      onClick={() => setAudienceSearchTerm('')}
                      title="Clear search"
                    >
                      <FaTimes />
                    </ClearSearchButton>
                  )}
                </SearchInputContainer>
              )}
              
              {audiencesLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                  Loading audiences...
                </div>
              ) : audiences.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  padding: '2rem', 
                  color: 'var(--text-secondary)',
                  background: 'rgba(255, 255, 255, 0.02)',
                  borderRadius: '8px',
                  border: '1px solid rgba(255, 255, 255, 0.05)'
                }}>
                  <FaExclamationTriangle style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent)' }} />
                  <div>No audiences available. Create an audience first.</div>
                </div>
              ) : (
                <>
                  {getFilteredAudiences().length === 0 && audienceSearchTerm ? (
                    <div style={{ 
                      textAlign: 'center', 
                      padding: '2rem', 
                      color: 'var(--text-secondary)',
                      background: 'rgba(255, 255, 255, 0.02)',
                      borderRadius: '8px',
                      border: '1px solid rgba(255, 255, 255, 0.05)'
                    }}>
                      <FaSearch style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--text-secondary)' }} />
                      <div>No audiences found matching "{audienceSearchTerm}"</div>
                      <div style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        Try searching for a different term or{' '}
                        <button 
                          onClick={() => setAudienceSearchTerm('')}
                          style={{ 
                            background: 'none', 
                            border: 'none', 
                            color: 'var(--primary)', 
                            cursor: 'pointer',
                            textDecoration: 'underline'
                          }}
                        >
                          clear the search
                        </button>
                      </div>
                    </div>
                  ) : (
                    <AudienceList>
                      {getFilteredAudiences().map((audience) => {
                        const isIncluded = templateData.audienceIds.includes(audience.id);
                        const isExcluded = templateData.excludedAudienceIds.includes(audience.id);
                        
                        return (
                          <AudienceItem 
                            key={audience.id}
                            $isSelected={isIncluded}
                            $isExcluded={isExcluded}
                          >
                            <AudienceCheckbox
                              type="checkbox"
                              id={`audience-${audience.id}`}
                              checked={isIncluded}
                              onChange={(e) => handleAudienceToggle(audience.id, e.target.checked)}
                            />
                            
                            <AudienceInfo onClick={() => handleAudienceToggle(audience.id, !isIncluded)}>
                              <AudienceName>{audience.name}</AudienceName>
                              <AudienceDetails>
                                <AudienceCount>
                                  <FaUsers />
                                  {audience.subscriber_count.toLocaleString()} subscribers
                                </AudienceCount>
                                <AudienceType $type={audience.type}>
                                  {audience.type}
                                </AudienceType>
                              </AudienceDetails>
                            </AudienceInfo>
                            
                            <ExcludeButton
                              $isExcluded={isExcluded}
                              onClick={() => handleAudienceExclude(audience.id)}
                              title={isExcluded ? 'Remove from exclusions' : 'Exclude from template'}
                            >
                              <FaTimes />
                              {isExcluded ? 'Excluded' : 'Exclude'}
                            </ExcludeButton>
                          </AudienceItem>
                        );
                      })}
                    </AudienceList>
                  )}
                  
                  {/* Audience Statistics */}
                  {(templateData.audienceIds.length > 0 || templateData.excludedAudienceIds.length > 0) && (
                    <AudienceStatsContainer>
                      <AudienceStatItem>
                        <AudienceStatValue>{calculateAudienceStats().includedCount}</AudienceStatValue>
                        <AudienceStatLabel>Included</AudienceStatLabel>
                      </AudienceStatItem>
                      <AudienceStatItem>
                        <AudienceStatValue>{calculateAudienceStats().excludedCount}</AudienceStatValue>
                        <AudienceStatLabel>Excluded</AudienceStatLabel>
                      </AudienceStatItem>
                      <AudienceStatItem>
                        <AudienceStatValue>{calculateAudienceStats().totalIncluded.toLocaleString()}</AudienceStatValue>
                        <AudienceStatLabel>Total Included</AudienceStatLabel>
                      </AudienceStatItem>
                      <AudienceStatItem>
                        <AudienceStatValue>{calculateAudienceStats().totalExcluded.toLocaleString()}</AudienceStatValue>
                        <AudienceStatLabel>Total Excluded</AudienceStatLabel>
                      </AudienceStatItem>
                      <AudienceStatItem>
                        <AudienceStatValue style={{ color: 'var(--accent)' }}>
                          {calculateAudienceStats().estimatedReach.toLocaleString()}
                        </AudienceStatValue>
                        <AudienceStatLabel>Estimated Reach</AudienceStatLabel>
                      </AudienceStatItem>
                    </AudienceStatsContainer>
                  )}
                </>
              )}
            </AudienceSelectionContainer>
          </StepContent>
        );

      case 2:
        return (
          <StepContent variants={stepVariants} initial="hidden" animate="visible" exit="exit" $isDesignStep={true}>
            <StepTitle>
              <FaEdit />
              Design Your Template
            </StepTitle>
            <StepDescription>
              Use the drag-and-drop visual editor to design your email template.
            </StepDescription>
            
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
        title={isNewTemplate ? "Create New Template" : `Edit Template: ${templateData.name}`}
        description={isNewTemplate ? "Create a new email template with visual editor" : "Edit email template with visual editor"}
      />
      
      <CreateContainer $isDesignStep={currentStep === 2}>
        <Breadcrumbs>
          <BreadcrumbLink href="/admin/email-campaigns">Email Campaigns</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/templates">Templates</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>{isNewTemplate ? "Create Template" : `Edit: ${templateData.name}`}</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <Title>
            <FaFileAlt />
            {isNewTemplate ? "Create New Template" : "Edit Template"}
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

        {/* Status Toggle */}
        <StatusToggleContainer>
          <StatusLabel $isActive={templateData.status === 'active'}>
            {templateData.status === 'active' ? 'Active' : 'Draft'}
          </StatusLabel>
          <StatusToggle 
            $isActive={templateData.status === 'active'} 
            onClick={handleStatusToggle}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            {templateData.status === 'active' 
              ? 'Template is active and available for automations' 
              : 'Template is a draft and not available for automations'}
          </span>
        </StatusToggleContainer>

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
                {isSaving ? 'Saving...' : (isNewTemplate ? 'Create Template' : 'Save Template')}
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