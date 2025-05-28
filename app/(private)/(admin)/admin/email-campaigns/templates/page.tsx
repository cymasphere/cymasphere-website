"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaFileAlt, 
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCopy,
  FaCode,
  FaImage,
  FaEnvelope,
  FaCalendarAlt
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const TemplatesContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const TemplatesTitle = styled.h1`
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

const TemplatesSubtitle = styled.p`
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

const TemplatesGrid = styled.div`
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

const TemplateTitle = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const TemplateDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
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
const mockTemplates = [
  {
    id: "1",
    title: "Welcome Email",
    description: "A warm welcome message for new subscribers",
    type: "welcome",
    usageCount: 45,
    lastUsed: "2024-01-18",
    bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    createdAt: "2024-01-10",
  },
  {
    id: "2",
    title: "Monthly Newsletter",
    description: "Regular newsletter template with featured content",
    type: "newsletter",
    usageCount: 12,
    lastUsed: "2024-01-15",
    bgColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    createdAt: "2024-01-05",
  },
  {
    id: "3",
    title: "Product Launch",
    description: "Promotional template for new product announcements",
    type: "promotional",
    usageCount: 8,
    lastUsed: "2024-01-12",
    bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    createdAt: "2024-01-08",
  },
  {
    id: "4",
    title: "Order Confirmation",
    description: "Transactional email for order confirmations",
    type: "transactional",
    usageCount: 156,
    lastUsed: "2024-01-20",
    bgColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    createdAt: "2024-01-01",
  },
  {
    id: "5",
    title: "Password Reset",
    description: "Security template for password reset requests",
    type: "transactional",
    usageCount: 23,
    lastUsed: "2024-01-19",
    bgColor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    createdAt: "2024-01-03",
  },
  {
    id: "6",
    title: "Special Offer",
    description: "Eye-catching template for special promotions",
    type: "promotional",
    usageCount: 34,
    lastUsed: "2024-01-16",
    bgColor: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    createdAt: "2024-01-12",
  },
];

function TemplatesPage() {
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

  const filteredTemplates = mockTemplates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      value: mockTemplates.length.toString(),
      label: "Total Templates",
    },
    {
      value: mockTemplates.reduce((sum, t) => sum + t.usageCount, 0).toString(),
      label: "Total Usage",
    },
    {
      value: new Set(mockTemplates.map(t => t.type)).size.toString(),
      label: "Template Types",
    },
    {
      value: mockTemplates.filter(t => {
        const lastUsed = new Date(t.lastUsed);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return lastUsed > weekAgo;
      }).length.toString(),
      label: "Used This Week",
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

  const handleTemplateAction = (action: string, templateId: string) => {
    console.log(`${action} template:`, templateId);
    if (action === 'view' || action === 'edit') {
      router.push(`/admin/email-campaigns/templates/${templateId}`);
    } else if (action === 'browse') {
      router.push('/admin/email-campaigns/templates/library');
    }
    // Implement other template actions here
  };

  return (
    <>
      <NextSEO
        title="Email Templates"
        description="Manage and create email templates for your campaigns"
      />
      
      <TemplatesContainer>
        <TemplatesTitle>
          <FaFileAlt />
          Email Templates
        </TemplatesTitle>
        <TemplatesSubtitle>
          Create and manage reusable email templates for your campaigns
        </TemplatesSubtitle>

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
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <CreateButton onClick={() => handleTemplateAction('browse', '')}>
              <FaImage />
              Browse Templates
            </CreateButton>
            <CreateButton onClick={() => handleTemplateAction('create', '')}>
              <FaPlus />
              Create Template
            </CreateButton>
          </div>
        </ActionsRow>

        <TemplatesGrid>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Template</TableHeaderCell>
                <TableHeaderCell>Type</TableHeaderCell>
                <TableHeaderCell>Usage Count</TableHeaderCell>
                <TableHeaderCell>Last Used</TableHeaderCell>
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredTemplates.length === 0 ? (
                <tr>
                  <TableCell colSpan={6}>
                    <EmptyState>
                      <FaFileAlt />
                      <h3>No templates found</h3>
                      <p>Try adjusting your search criteria or create a new template.</p>
                    </EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredTemplates.map((template, index) => (
                  <TableRow
                    key={template.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    onClick={() => handleTemplateAction('view', template.id)}
                  >
                    <TableCell>
                      <TemplateTitle>{template.title}</TemplateTitle>
                      <TemplateDescription>{template.description}</TemplateDescription>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={template.type}>
                        {template.type}
                      </TypeBadge>
                    </TableCell>
                    <TableCell>
                      <MetricValue>{template.usageCount}</MetricValue>
                    </TableCell>
                    <TableCell>
                      {new Date(template.lastUsed).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {new Date(template.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ActionsContainer>
                        <ActionButton onClick={() => handleTemplateAction('preview', template.id)}>
                          <FaEye />
                        </ActionButton>
                        <ActionButton onClick={() => handleTemplateAction('edit', template.id)}>
                          <FaEdit />
                        </ActionButton>
                        <ActionButton onClick={() => handleTemplateAction('duplicate', template.id)}>
                          <FaCopy />
                        </ActionButton>
                        <ActionButton onClick={() => handleTemplateAction('code', template.id)}>
                          <FaCode />
                        </ActionButton>
                        <ActionButton variant="danger" onClick={() => handleTemplateAction('delete', template.id)}>
                          <FaTrash />
                        </ActionButton>
                      </ActionsContainer>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TemplatesGrid>
      </TemplatesContainer>
    </>
  );
}

export default TemplatesPage; 