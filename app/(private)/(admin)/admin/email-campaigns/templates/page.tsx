"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import useLanguage from "@/hooks/useLanguage";
import {
  FaPalette,
  FaSearch,
  FaPlus,
  FaEye,
  FaEdit,
  FaTrash,
  FaClone,
  FaDownload,
  FaUsers,
  FaEnvelope,
  FaTag,
  FaEllipsisV,
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
      case "welcome":
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case "newsletter":
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      case "promotional":
        return `
          background-color: rgba(255, 193, 7, 0.2);
          color: #ffc107;
        `;
      case "transactional":
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

const DropdownMenu = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isOpen",
})<{ isOpen: boolean }>`
  position: relative;
  display: inline-block;
`;

const DropdownButton = styled.button`
  padding: 8px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 32px;
  height: 32px;

  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: var(--text);
  }
`;

const DropdownContent = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== "isOpen",
})<{ isOpen: boolean }>`
  position: absolute;
  right: 0;
  top: 100%;
  min-width: 200px;
  background-color: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  opacity: ${(props) => (props.isOpen ? 1 : 0)};
  visibility: ${(props) => (props.isOpen ? "visible" : "hidden")};
  transform: ${(props) =>
    props.isOpen ? "translateY(0)" : "translateY(-10px)"};
  transition: all 0.2s ease;
  overflow: hidden;
`;

const DropdownItem = styled.button<{ variant?: "primary" | "danger" }>`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;
  text-align: left;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
  }

  ${(props) =>
    props.variant === "primary" &&
    `
    color: var(--primary);
    font-weight: 600;
    
    &:hover {
      background-color: rgba(108, 99, 255, 0.1);
    }
  `}

  ${(props) =>
    props.variant === "danger" &&
    `
    color: #dc3545;
    
    &:hover {
      background-color: rgba(220, 53, 69, 0.1);
    }
  `}

  svg {
    font-size: 0.8rem;
    opacity: 0.7;
  }
`;

const DropdownDivider = styled.div`
  height: 1px;
  background-color: rgba(255, 255, 255, 0.1);
  margin: 4px 0;
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
    name: "Welcome Email",
    subject: "Welcome to Cymasphere! 🎵",
    senderName: "Cymasphere Team",
    preheader: "Let's get you started on your music creation journey",
    description: "A warm welcome message for new subscribers",
    type: "welcome",
    usageCount: 45,
    lastUsed: "2024-01-18",
    bgColor: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    createdAt: "2024-01-10",
    audience: "new",
    template: "welcome",
    content: `Welcome to Cymasphere! We're excited to have you join our community of music creators.`,
    emailElements: [
      { id: "header1", type: "header", content: "Welcome to Cymasphere! 🎵" },
      {
        id: "text1",
        type: "text",
        content:
          "Hi {{firstName}}, We're excited to have you join our community of music creators and synthesizer enthusiasts.",
      },
      {
        id: "button1",
        type: "button",
        content: "🚀 Get Started Now",
        url: "/dashboard",
      },
      {
        id: "image1",
        type: "image",
        src: "https://via.placeholder.com/600x300/667eea/ffffff?text=🎵+Welcome+to+Cymasphere",
      },
    ],
    scheduleType: "immediate",
    scheduleDate: "",
    scheduleTime: "",
  },
  {
    id: "2",
    name: "Monthly Newsletter",
    subject: "🎵 This Month in Music Production",
    senderName: "Cymasphere Newsletter",
    preheader:
      "The latest tips, trends, and updates from the music production world",
    description: "Regular newsletter template with featured content",
    type: "newsletter",
    usageCount: 12,
    lastUsed: "2024-01-15",
    bgColor: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    createdAt: "2024-01-05",
    audience: "all",
    template: "newsletter",
    content: `This Month in Music Production - Latest tips and updates`,
    emailElements: [
      {
        id: "header2",
        type: "header",
        content: "This Month in Music Production",
      },
      {
        id: "text2",
        type: "text",
        content:
          "Here are the latest tips, tricks, and updates from the world of electronic music production.",
      },
      { id: "divider1", type: "divider" },
      {
        id: "text3",
        type: "text",
        content: "Featured content and tutorials this month...",
      },
      { id: "button2", type: "button", content: "Read More", url: "/blog" },
    ],
    scheduleType: "scheduled",
    scheduleDate: "",
    scheduleTime: "",
  },
  {
    id: "3",
    name: "Product Launch",
    subject: "🚀 New Synthesizer Features Available Now!",
    senderName: "Cymasphere Product Team",
    preheader:
      "Revolutionary new features that will transform your music production",
    description: "Promotional template for new product announcements",
    type: "promotional",
    usageCount: 8,
    lastUsed: "2024-01-12",
    bgColor: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    createdAt: "2024-01-08",
    audience: "active",
    template: "promotional",
    content: `Exciting New Features Just Launched!`,
    emailElements: [
      {
        id: "header3",
        type: "header",
        content: "Exciting New Features Just Launched! 🚀",
      },
      {
        id: "image2",
        type: "image",
        src: "https://via.placeholder.com/600x300/4facfe/ffffff?text=🚀+New+Features",
      },
      {
        id: "text4",
        type: "text",
        content:
          "We've been working hard to bring you some amazing new synthesizer capabilities that will revolutionize your music production workflow.",
      },
      {
        id: "button3",
        type: "button",
        content: "Explore New Features",
        url: "/features",
      },
      { id: "spacer1", type: "spacer", height: "30px" },
    ],
    scheduleType: "immediate",
    scheduleDate: "",
    scheduleTime: "",
  },
  {
    id: "4",
    name: "Order Confirmation",
    subject: "Order Confirmed: Your Cymasphere Purchase",
    senderName: "Cymasphere Orders",
    preheader: "Thank you for your purchase! Here are your order details",
    description: "Transactional email for order confirmations",
    type: "transactional",
    usageCount: 156,
    lastUsed: "2024-01-20",
    bgColor: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    createdAt: "2024-01-01",
    audience: "customers",
    template: "custom",
    content: `Order Confirmation - Thank you for your purchase`,
    emailElements: [
      { id: "header4", type: "header", content: "Order Confirmed ✅" },
      {
        id: "text5",
        type: "text",
        content:
          "Hi {{firstName}}, Thank you for your purchase! Your order has been confirmed and is being processed.",
      },
      {
        id: "text6",
        type: "text",
        content: "Order Number: {{orderNumber}}\nTotal: {{orderTotal}}",
      },
      {
        id: "button4",
        type: "button",
        content: "View Order Details",
        url: "/orders/{{orderNumber}}",
      },
    ],
    scheduleType: "immediate",
    scheduleDate: "",
    scheduleTime: "",
  },
  {
    id: "5",
    name: "Password Reset",
    subject: "Reset Your Cymasphere Password",
    senderName: "Cymasphere Security",
    preheader: "Click here to securely reset your password",
    description: "Security template for password reset requests",
    type: "transactional",
    usageCount: 23,
    lastUsed: "2024-01-19",
    bgColor: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    createdAt: "2024-01-03",
    audience: "users",
    template: "custom",
    content: `Password Reset Request`,
    emailElements: [
      { id: "header5", type: "header", content: "Password Reset Request 🔒" },
      {
        id: "text7",
        type: "text",
        content:
          "Hi {{firstName}}, We received a request to reset your password for your Cymasphere account.",
      },
      {
        id: "button5",
        type: "button",
        content: "Reset Password",
        url: "/reset-password/{{resetToken}}",
      },
      {
        id: "text8",
        type: "text",
        content: "If you did not request this, please ignore this email.",
      },
    ],
    scheduleType: "immediate",
    scheduleDate: "",
    scheduleTime: "",
  },
  {
    id: "6",
    name: "Special Offer",
    subject: "Limited Time: 50% Off Premium Features! 🎉",
    senderName: "Cymasphere Offers",
    preheader: "Don't miss out on this exclusive discount",
    description: "Eye-catching template for special promotions",
    type: "promotional",
    usageCount: 34,
    lastUsed: "2024-01-16",
    bgColor: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    createdAt: "2024-01-12",
    audience: "active",
    template: "promotional",
    content: `Special Limited Time Offer`,
    emailElements: [
      { id: "header6", type: "header", content: "Limited Time Offer! 🎉" },
      {
        id: "text9",
        type: "text",
        content:
          "Hi {{firstName}}, For a limited time only, get 50% off all premium features!",
      },
      {
        id: "image3",
        type: "image",
        src: "https://via.placeholder.com/600x200/a8edea/333333?text=50%25+OFF",
      },
      {
        id: "button6",
        type: "button",
        content: "Claim Offer Now",
        url: "/upgrade?offer=50off",
      },
      {
        id: "text10",
        type: "text",
        content: "Offer expires in 48 hours. Don't miss out!",
      },
    ],
    scheduleType: "immediate",
    scheduleDate: "",
    scheduleTime: "",
  },
];

function TemplatesPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-dropdown]")) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (languageLoading || !translationsLoaded) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const filteredTemplates = mockTemplates.filter(
    (template) =>
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
      value: new Set(mockTemplates.map((t) => t.type)).size.toString(),
      label: "Template Types",
    },
    {
      value: mockTemplates
        .filter((t) => {
          const lastUsed = new Date(t.lastUsed);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return lastUsed > weekAgo;
        })
        .length.toString(),
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
    if (action === "view" || action === "edit") {
      // Navigate to edit page with proper route
      router.push(`/admin/email-campaigns/templates/edit/${templateId}`);
    } else if (action === "browse") {
      router.push("/admin/email-campaigns/templates/library");
    } else if (action === "use") {
      // Create a new campaign from this template
      const template = mockTemplates.find((t) => t.id === templateId);
      if (template) {
        // Navigate to create campaign with template data
        const queryParams = new URLSearchParams({
          template: templateId,
          prefill: "true",
        });
        router.push(
          `/admin/email-campaigns/campaigns/create?${queryParams.toString()}`
        );
      }
    } else if (action === "create") {
      router.push("/admin/email-campaigns/templates/create");
    } else if (action === "preview") {
      // Open preview modal or page
      console.log("Preview template:", templateId);
    } else if (action === "duplicate") {
      // Duplicate template and navigate to create page with pre-filled data
      const template = mockTemplates.find((t) => t.id === templateId);
      if (template) {
        const queryParams = new URLSearchParams({
          duplicate: templateId,
        });
        router.push(
          `/admin/email-campaigns/templates/create?${queryParams.toString()}`
        );
      }
    } else if (action === "download" || action === "export") {
      // Export template
      console.log("Export template:", templateId);
    } else if (action === "share") {
      // Share template
      console.log("Share template:", templateId);
    } else if (action === "code") {
      // View template code
      console.log("View template code:", templateId);
    } else if (action === "delete") {
      // Delete template with confirmation
      if (window.confirm("Are you sure you want to delete this template?")) {
        console.log("Delete template:", templateId);
      }
    }
    // Close dropdown after action
    setOpenDropdown(null);
  };

  return (
    <>
      <NextSEO
        title="Email Templates"
        description="Manage and create email templates for your campaigns"
      />

      <TemplatesContainer>
        <TemplatesTitle>
          <FaPalette />
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

          <div style={{ display: "flex", gap: "0.5rem" }}>
            <CreateButton onClick={() => handleTemplateAction("browse", "")}>
              <FaPalette />
              Browse Templates
            </CreateButton>
            <CreateButton onClick={() => handleTemplateAction("create", "")}>
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
                      <FaPalette />
                      <h3>No templates found</h3>
                      <p>
                        Try adjusting your search criteria or create a new
                        template.
                      </p>
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
                    onClick={() => handleTemplateAction("view", template.id)}
                  >
                    <TableCell>
                      <TemplateTitle>{template.name}</TemplateTitle>
                      <TemplateDescription>
                        {template.description}
                      </TemplateDescription>
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
                        <DropdownMenu
                          isOpen={openDropdown === template.id}
                          data-dropdown
                        >
                          <DropdownButton
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdown(
                                openDropdown === template.id
                                  ? null
                                  : template.id
                              );
                            }}
                          >
                            <FaEllipsisV />
                          </DropdownButton>
                          <DropdownContent
                            isOpen={openDropdown === template.id}
                          >
                            <DropdownItem
                              variant="primary"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("use", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaEnvelope />
                              Use Template
                            </DropdownItem>
                            <DropdownDivider />
                            <DropdownItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("preview", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaEye />
                              Preview
                            </DropdownItem>
                            <DropdownItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("edit", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaEdit />
                              Edit Template
                            </DropdownItem>
                            <DropdownItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("duplicate", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaClone />
                              Duplicate
                            </DropdownItem>
                            <DropdownDivider />
                            <DropdownItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("download", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaDownload />
                              Export
                            </DropdownItem>
                            <DropdownItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("share", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaUsers />
                              Share
                            </DropdownItem>
                            <DropdownItem
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("code", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaTag />
                              View Code
                            </DropdownItem>
                            <DropdownDivider />
                            <DropdownItem
                              variant="danger"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTemplateAction("delete", template.id);
                                setOpenDropdown(null);
                              }}
                            >
                              <FaTrash />
                              Delete
                            </DropdownItem>
                          </DropdownContent>
                        </DropdownMenu>
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
