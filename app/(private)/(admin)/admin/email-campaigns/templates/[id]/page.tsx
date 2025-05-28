"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaFileAlt, 
  FaArrowLeft,
  FaEdit,
  FaSave,
  FaEye,
  FaCopy,
  FaTrash,
  FaChevronRight,
  FaInfoCircle,
  FaCode,
  FaImage,
  FaPalette,
  FaUsers,
  FaChartLine,
  FaCalendarAlt
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

const TemplateTitle = styled.h1`
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

const TemplateMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
`;

const TypeBadge = styled.span<{ type: string }>`
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: capitalize;
  
  ${(props) => {
    switch (props.type) {
      case 'welcome':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'newsletter':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      case 'promotional':
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case 'transactional':
        return `
          background-color: rgba(23, 162, 184, 0.2);
          color: #17a2b8;
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
  min-height: 400px;
`;

const EditorToolbar = styled.div`
  display: flex;
  gap: 0.5rem;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-wrap: wrap;
`;

const ToolbarButton = styled.button<{ active?: boolean }>`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: ${props => props.active ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  color: ${props => props.active ? 'white' : 'var(--text-secondary)'};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;

  &:hover {
    background-color: ${props => props.active ? 'var(--accent)' : 'rgba(255, 255, 255, 0.2)'};
    color: ${props => props.active ? 'white' : 'var(--text)'};
  }
`;

const EditorContent = styled.div`
  padding: 1rem;
  min-height: 300px;
`;

const PreviewArea = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-top: 1rem;
`;

const DesignGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ColorPicker = styled.input`
  width: 50px;
  height: 40px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const TemplatePreview = styled.div`
  background-color: white;
  color: #333;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  margin: 1rem 0;
`;

// Mock data
const mockTemplate = {
  id: "1",
  title: "Welcome Email Template",
  description: "A warm welcome message for new subscribers",
  type: "welcome",
  usageCount: 45,
  lastUsed: "2024-01-18",
  createdAt: "2024-01-10",
  subject: "Welcome to Cymasphere! 🎵",
  content: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6c63ff;">Welcome to Cymasphere!</h1>
      <p>We're excited to have you join our community of music creators and synthesizer enthusiasts.</p>
      <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>What you can expect:</h3>
        <ul>
          <li>Access to our powerful web-based synthesizer</li>
          <li>Regular updates on new features and sounds</li>
          <li>Tips and tutorials from our team</li>
        </ul>
      </div>
      <a href="#" style="background: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Get Started</a>
    </div>
  `,
  primaryColor: "#6c63ff",
  secondaryColor: "#4ecdc4",
  backgroundColor: "#ffffff",
  textColor: "#333333"
};

function TemplateEditPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [template, setTemplate] = useState(mockTemplate);
  
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
    console.log("Saving template:", template);
    // Implement save logic here
  };

  const handleAction = (action: string) => {
    console.log(`${action} template:`, template.id);
    // Implement action logic here
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <>
      <NextSEO
        title={`Edit Template: ${template.title}`}
        description="Edit email template design, content, and settings"
      />
      
      <EditContainer>
        <BackButton href="/admin/email-campaigns/templates">
          <FaArrowLeft />
          Back to Templates
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/templates">Email Templates</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>{template.title}</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <HeaderLeft>
            <TemplateTitle>
              <FaFileAlt />
              {template.title}
            </TemplateTitle>
            <TemplateMeta>
              <TypeBadge type={template.type}>{template.type}</TypeBadge>
              <MetricItem>
                <FaUsers />
                <strong>{template.usageCount}</strong> times used
              </MetricItem>
              <MetricItem>
                <FaCalendarAlt />
                Last used <strong>{new Date(template.lastUsed).toLocaleDateString()}</strong>
              </MetricItem>
            </TemplateMeta>
          </HeaderLeft>
          <HeaderActions>
            <ActionButton onClick={() => handleAction('preview')}>
              <FaEye />
              Preview
            </ActionButton>
            <ActionButton onClick={() => handleAction('duplicate')}>
              <FaCopy />
              Duplicate
            </ActionButton>
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
            active={activeTab === "design"} 
            onClick={() => setActiveTab("design")}
          >
            <FaPalette />
            Design
          </TabButton>
          <TabButton 
            active={activeTab === "content"} 
            onClick={() => setActiveTab("content")}
          >
            <FaCode />
            Content
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
                Template Details
              </SectionTitle>
              <FormGrid>
                <FormGroup>
                  <Label>Template Name</Label>
                  <Input
                    type="text"
                    value={template.title}
                    onChange={(e) => setTemplate({...template, title: e.target.value})}
                    placeholder="Enter template name"
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Template Type</Label>
                  <Select
                    value={template.type}
                    onChange={(e) => setTemplate({...template, type: e.target.value})}
                  >
                    <option value="welcome">Welcome</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="promotional">Promotional</option>
                    <option value="transactional">Transactional</option>
                  </Select>
                </FormGroup>
                <FormGroup>
                  <Label>Subject Line</Label>
                  <Input
                    type="text"
                    value={template.subject}
                    onChange={(e) => setTemplate({...template, subject: e.target.value})}
                    placeholder="Email subject"
                  />
                </FormGroup>
              </FormGrid>
              <FormGroup>
                <Label>Description</Label>
                <TextArea
                  value={template.description}
                  onChange={(e) => setTemplate({...template, description: e.target.value})}
                  placeholder="Template description for internal use"
                />
              </FormGroup>
            </Section>
          )}

          {activeTab === "design" && (
            <Section>
              <SectionTitle>
                <FaPalette />
                Template Design
              </SectionTitle>
              <DesignGrid>
                <FormGroup>
                  <Label>Primary Color</Label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ColorPicker
                      type="color"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({...template, primaryColor: e.target.value})}
                    />
                    <Input
                      type="text"
                      value={template.primaryColor}
                      onChange={(e) => setTemplate({...template, primaryColor: e.target.value})}
                      placeholder="#6c63ff"
                    />
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label>Secondary Color</Label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ColorPicker
                      type="color"
                      value={template.secondaryColor}
                      onChange={(e) => setTemplate({...template, secondaryColor: e.target.value})}
                    />
                    <Input
                      type="text"
                      value={template.secondaryColor}
                      onChange={(e) => setTemplate({...template, secondaryColor: e.target.value})}
                      placeholder="#4ecdc4"
                    />
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label>Background Color</Label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ColorPicker
                      type="color"
                      value={template.backgroundColor}
                      onChange={(e) => setTemplate({...template, backgroundColor: e.target.value})}
                    />
                    <Input
                      type="text"
                      value={template.backgroundColor}
                      onChange={(e) => setTemplate({...template, backgroundColor: e.target.value})}
                      placeholder="#ffffff"
                    />
                  </div>
                </FormGroup>
                <FormGroup>
                  <Label>Text Color</Label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <ColorPicker
                      type="color"
                      value={template.textColor}
                      onChange={(e) => setTemplate({...template, textColor: e.target.value})}
                    />
                    <Input
                      type="text"
                      value={template.textColor}
                      onChange={(e) => setTemplate({...template, textColor: e.target.value})}
                      placeholder="#333333"
                    />
                  </div>
                </FormGroup>
              </DesignGrid>
              <PreviewArea>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Design Preview</h4>
                <TemplatePreview style={{ 
                  backgroundColor: template.backgroundColor,
                  color: template.textColor 
                }}>
                  <h1 style={{ color: template.primaryColor }}>Sample Heading</h1>
                  <p>This is how your template will look with the selected colors.</p>
                  <div style={{ 
                    background: template.secondaryColor + '20', 
                    padding: '15px', 
                    borderRadius: '6px',
                    border: `1px solid ${template.secondaryColor}40`
                  }}>
                    <p>Highlighted content area</p>
                  </div>
                  <button style={{ 
                    background: template.primaryColor, 
                    color: 'white', 
                    padding: '10px 20px', 
                    border: 'none', 
                    borderRadius: '4px',
                    marginTop: '15px'
                  }}>
                    Call to Action
                  </button>
                </TemplatePreview>
              </PreviewArea>
            </Section>
          )}

          {activeTab === "content" && (
            <Section>
              <SectionTitle>
                <FaCode />
                Template Content
              </SectionTitle>
              <FormGroup>
                <Label>HTML Content</Label>
                <ContentEditor>
                  <EditorToolbar>
                    <ToolbarButton>Bold</ToolbarButton>
                    <ToolbarButton>Italic</ToolbarButton>
                    <ToolbarButton>Heading</ToolbarButton>
                    <ToolbarButton>Link</ToolbarButton>
                    <ToolbarButton>Image</ToolbarButton>
                    <ToolbarButton>Button</ToolbarButton>
                    <ToolbarButton>List</ToolbarButton>
                    <ToolbarButton>Table</ToolbarButton>
                    <ToolbarButton>Code</ToolbarButton>
                  </EditorToolbar>
                  <EditorContent>
                    <TextArea
                      value={template.content}
                      onChange={(e) => setTemplate({...template, content: e.target.value})}
                      placeholder="Enter your HTML template content here..."
                      style={{ 
                        border: 'none', 
                        background: 'transparent', 
                        minHeight: '300px',
                        width: '100%',
                        resize: 'vertical'
                      }}
                    />
                  </EditorContent>
                </ContentEditor>
              </FormGroup>
              <PreviewArea>
                <h4 style={{ marginBottom: '1rem', color: 'var(--text)' }}>Live Preview</h4>
                <TemplatePreview>
                  <div dangerouslySetInnerHTML={{ __html: template.content }} />
                </TemplatePreview>
              </PreviewArea>
            </Section>
          )}
        </TabContent>
      </EditContainer>
    </>
  );
}

export default TemplateEditPage; 