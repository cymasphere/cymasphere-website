"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import useLanguage from "@/hooks/useLanguage";
import {
  FaPalette,
  FaSearch,
  FaEye,
  FaUsers,
  FaEnvelope,
  FaStar,
  FaStarHalfAlt,
  FaRegStar,
  FaArrowLeft,
  FaChevronRight,
  FaCopy,
  FaHeart,
  FaRegHeart,
  FaCalendarAlt,
  FaDownload,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";

const LibraryContainer = styled.div`
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

const LibraryTitle = styled.h1`
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

const LibrarySubtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin-bottom: 2rem;

  @media (max-width: 768px) {
    font-size: 1rem;
    margin-bottom: 1.5rem;
  }
`;

const FiltersRow = styled.div`
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

const LeftFilters = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  flex: 1;

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

const FilterSelect = styled.select`
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

const ViewToggle = styled.div`
  display: flex;
  gap: 0.25rem;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  padding: 0.25rem;
`;

const ViewButton = styled.button<{ active: boolean }>`
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  background-color: ${(props) =>
    props.active ? "var(--primary)" : "transparent"};
  color: ${(props) => (props.active ? "white" : "var(--text-secondary)")};
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    color: ${(props) => (props.active ? "white" : "var(--text)")};
  }
`;

const TemplatesGrid = styled.div<{ viewMode: string }>`
  display: grid;
  grid-template-columns: ${(props) =>
    props.viewMode === "grid"
      ? "repeat(auto-fill, minmax(300px, 1fr))"
      : "1fr"};
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const TemplateCard = styled(motion.div)<{ viewMode: string }>`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: ${(props) => (props.viewMode === "list" ? "flex" : "block")};
  align-items: ${(props) => (props.viewMode === "list" ? "center" : "stretch")};

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    border-color: var(--primary);
  }
`;

const TemplatePreview = styled.div<{ viewMode: string }>`
  position: relative;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  height: ${(props) => (props.viewMode === "list" ? "120px" : "200px")};
  width: ${(props) => (props.viewMode === "list" ? "200px" : "100%")};
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.3);
    z-index: 1;
  }
`;

const PreviewIcon = styled.div`
  position: relative;
  z-index: 2;
  color: white;
  font-size: 2rem;
  opacity: 0.8;
`;

const TemplateOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 3;

  ${TemplateCard}:hover & {
    opacity: 1;
  }
`;

const OverlayButton = styled.button`
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  background-color: rgba(255, 255, 255, 0.9);
  color: var(--text);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

  &:hover {
    background-color: white;
    transform: scale(1.05);
  }
`;

const TemplateContent = styled.div<{ viewMode: string }>`
  padding: ${(props) => (props.viewMode === "list" ? "1rem" : "1.5rem")};
  flex: 1;
`;

const TemplateHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
`;

const TemplateTitle = styled.h3`
  font-size: 1.1rem;
  color: var(--text);
  margin: 0;
  font-weight: 600;
`;

const FavoriteButton = styled.button<{ isFavorite: boolean }>`
  background: none;
  border: none;
  color: ${(props) => (props.isFavorite ? "#ff6b6b" : "var(--text-secondary)")};
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 1.1rem;

  &:hover {
    color: #ff6b6b;
    transform: scale(1.1);
  }
`;

const TemplateDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

const TemplateFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: auto;
`;

const TemplateCategory = styled.span<{ category: string }>`
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;

  ${(props) => {
    switch (props.category) {
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
      case "ecommerce":
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

const TemplateRating = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.8rem;
`;

const StarRating = styled.div`
  display: flex;
  gap: 0.1rem;
  color: #ffc107;
`;

const TemplateStats = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
  grid-column: 1 / -1;

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

// Mock template data
const mockTemplates = [
  {
    id: "1",
    title: "Welcome Series Starter",
    description:
      "A warm welcome email template perfect for new subscribers. Includes company introduction and next steps.",
    category: "welcome",
    rating: 4.8,
    downloads: 1250,
    favorites: 89,
    isFavorite: false,
    author: "Cymasphere Team",
    createdAt: "2024-01-15",
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    icon: FaUsers,
  },
  {
    id: "2",
    title: "Product Launch Announcement",
    description:
      "Eye-catching template for announcing new products or features. Includes product showcase and CTA buttons.",
    category: "promotional",
    rating: 4.6,
    downloads: 890,
    favorites: 67,
    isFavorite: true,
    author: "Design Studio",
    createdAt: "2024-01-12",
    gradient: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    icon: FaEnvelope,
  },
  {
    id: "3",
    title: "Monthly Newsletter",
    description:
      "Clean and professional newsletter template with sections for news, updates, and featured content.",
    category: "newsletter",
    rating: 4.9,
    downloads: 2100,
    favorites: 156,
    isFavorite: false,
    author: "Newsletter Pro",
    createdAt: "2024-01-10",
    gradient: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    icon: FaEnvelope,
  },
  {
    id: "4",
    title: "E-commerce Cart Recovery",
    description:
      "Persuasive template to recover abandoned carts. Includes product images and urgency elements.",
    category: "ecommerce",
    rating: 4.7,
    downloads: 1560,
    favorites: 98,
    isFavorite: false,
    author: "E-comm Expert",
    createdAt: "2024-01-08",
    gradient: "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    icon: FaEnvelope,
  },
  {
    id: "5",
    title: "Holiday Special Offer",
    description:
      "Festive template for holiday promotions and special offers. Customizable for any holiday season.",
    category: "promotional",
    rating: 4.5,
    downloads: 780,
    favorites: 45,
    isFavorite: true,
    author: "Holiday Designs",
    createdAt: "2024-01-05",
    gradient: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    icon: FaEnvelope,
  },
  {
    id: "6",
    title: "User Onboarding Guide",
    description:
      "Step-by-step onboarding template to help new users get started with your product or service.",
    category: "welcome",
    rating: 4.8,
    downloads: 1340,
    favorites: 112,
    isFavorite: false,
    author: "UX Team",
    createdAt: "2024-01-03",
    gradient: "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    icon: FaEnvelope,
  },
];

function TemplateLibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [favorites, setFavorites] = useState<string[]>(["2", "5"]);

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

  const filteredTemplates = mockTemplates.filter((template) => {
    const matchesSearch =
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || template.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const toggleFavorite = (templateId: string) => {
    setFavorites((prev) =>
      prev.includes(templateId)
        ? prev.filter((id) => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleTemplateAction = (action: string, templateId: string) => {
    console.log(`${action} template:`, templateId);
    if (action === "use") {
      router.push(
        `/admin/email-campaigns/campaigns/create?template=${templateId}`
      );
    } else if (action === "preview") {
      // Open preview modal
    } else if (action === "edit") {
      router.push(`/admin/email-campaigns/templates/${templateId}`);
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<FaStar key={i} />);
    }

    if (hasHalfStar) {
      stars.push(<FaStarHalfAlt key="half" />);
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<FaRegStar key={`empty-${i}`} />);
    }

    return stars;
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <>
      <NextSEO
        title="Template Library"
        description="Browse and select from our collection of professional email templates"
      />

      <LibraryContainer>
        <BackButton href="/admin/email-campaigns/templates">
          <FaArrowLeft />
          Back to Templates
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/templates">
            Email Templates
          </BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>Template Library</BreadcrumbCurrent>
        </Breadcrumbs>

        <LibraryTitle>
          <FaPalette />
          Template Library
        </LibraryTitle>
        <LibrarySubtitle>
          Choose from our collection of professionally designed email templates
        </LibrarySubtitle>

        <FiltersRow>
          <LeftFilters>
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

            <FilterSelect
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="welcome">Welcome</option>
              <option value="newsletter">Newsletter</option>
              <option value="promotional">Promotional</option>
              <option value="transactional">Transactional</option>
              <option value="ecommerce">E-commerce</option>
            </FilterSelect>
          </LeftFilters>

          <ViewToggle>
            <ViewButton
              active={viewMode === "grid"}
              onClick={() => setViewMode("grid")}
            >
              Grid
            </ViewButton>
            <ViewButton
              active={viewMode === "list"}
              onClick={() => setViewMode("list")}
            >
              List
            </ViewButton>
          </ViewToggle>
        </FiltersRow>

        <TemplatesGrid viewMode={viewMode}>
          {filteredTemplates.length === 0 ? (
            <EmptyState>
              <FaPalette />
              <h3>No templates found</h3>
              <p>
                Try adjusting your search criteria or browse different
                categories.
              </p>
            </EmptyState>
          ) : (
            filteredTemplates.map((template, index) => (
              <TemplateCard
                key={template.id}
                viewMode={viewMode}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                custom={index}
                onClick={() => handleTemplateAction("use", template.id)}
              >
                <TemplatePreview
                  viewMode={viewMode}
                  style={{ background: template.gradient }}
                >
                  <PreviewIcon>
                    <template.icon />
                  </PreviewIcon>
                  <TemplateOverlay>
                    <OverlayButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateAction("preview", template.id);
                      }}
                    >
                      <FaEye /> Preview
                    </OverlayButton>
                    <OverlayButton
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTemplateAction("use", template.id);
                      }}
                    >
                      <FaCopy /> Use Template
                    </OverlayButton>
                  </TemplateOverlay>
                </TemplatePreview>

                <TemplateContent viewMode={viewMode}>
                  <TemplateHeader>
                    <TemplateTitle>{template.title}</TemplateTitle>
                    <FavoriteButton
                      isFavorite={favorites.includes(template.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(template.id);
                      }}
                    >
                      {favorites.includes(template.id) ? (
                        <FaHeart />
                      ) : (
                        <FaRegHeart />
                      )}
                    </FavoriteButton>
                  </TemplateHeader>

                  <TemplateDescription>
                    {template.description}
                  </TemplateDescription>

                  <TemplateFooter>
                    <TemplateCategory category={template.category}>
                      {template.category}
                    </TemplateCategory>

                    <TemplateRating>
                      <StarRating>{renderStars(template.rating)}</StarRating>
                      <span>{template.rating}</span>
                    </TemplateRating>
                  </TemplateFooter>

                  {viewMode === "list" && (
                    <TemplateStats>
                      <StatItem>
                        <FaDownload />
                        {template.downloads.toLocaleString()} downloads
                      </StatItem>
                      <StatItem>
                        <FaHeart />
                        {template.favorites} favorites
                      </StatItem>
                      <StatItem>
                        <FaCalendarAlt />
                        {new Date(template.createdAt).toLocaleDateString()}
                      </StatItem>
                    </TemplateStats>
                  )}
                </TemplateContent>
              </TemplateCard>
            ))
          )}
        </TemplatesGrid>
      </LibraryContainer>
    </>
  );
}

export default TemplateLibraryPage;
