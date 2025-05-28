"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaEnvelopeOpen, 
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaPlay,
  FaPause,
  FaChartLine,
  FaCalendarAlt,
  FaUsers,
  FaEnvelope
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";

const CampaignsContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const CampaignsTitle = styled.h1`
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

const CampaignsSubtitle = styled.p`
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

const CampaignsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const CampaignCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
    border-color: rgba(255, 255, 255, 0.1);
  }
`;

const CampaignHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CampaignTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin: 0;
  margin-bottom: 0.5rem;
`;

const CampaignStatus = styled.span<{ status: string }>`
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

const CampaignDescription = styled.p`
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.5;
  margin-bottom: 1rem;
`;

const CampaignStats = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CampaignStat = styled.div`
  text-align: center;
`;

const CampaignStatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
`;

const CampaignStatLabel = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const CampaignActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 8px 12px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.25rem;

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

// Mock data
const mockCampaigns = [
  {
    id: "1",
    title: "Welcome Series",
    description: "Automated welcome email sequence for new subscribers",
    status: "active",
    recipients: 1250,
    sent: 3750,
    openRate: 24.5,
    clickRate: 3.2,
    createdAt: "2024-01-15",
  },
  {
    id: "2",
    title: "Product Launch Announcement",
    description: "Announcing our latest synthesizer features",
    status: "completed",
    recipients: 5420,
    sent: 5420,
    openRate: 31.2,
    clickRate: 5.8,
    createdAt: "2024-01-10",
  },
  {
    id: "3",
    title: "Monthly Newsletter",
    description: "Regular updates and tips for music producers",
    status: "draft",
    recipients: 0,
    sent: 0,
    openRate: 0,
    clickRate: 0,
    createdAt: "2024-01-20",
  },
  {
    id: "4",
    title: "Re-engagement Campaign",
    description: "Win back inactive subscribers",
    status: "paused",
    recipients: 890,
    sent: 445,
    openRate: 18.7,
    clickRate: 2.1,
    createdAt: "2024-01-12",
  },
];

function CampaignsPage() {
  const { user } = useAuth();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
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

  const filteredCampaigns = mockCampaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = [
    {
      value: mockCampaigns.length.toString(),
      label: "Total Campaigns",
    },
    {
      value: mockCampaigns.filter(c => c.status === "active").length.toString(),
      label: "Active Campaigns",
    },
    {
      value: "28.4%",
      label: "Avg Open Rate",
    },
    {
      value: "4.2%",
      label: "Avg Click Rate",
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

  const handleCampaignAction = (action: string, campaignId: string) => {
    console.log(`${action} campaign:`, campaignId);
    // Implement campaign actions here
  };

  return (
    <>
      <NextSEO
        title="Email Campaigns"
        description="Manage and monitor your email marketing campaigns"
      />
      
      <CampaignsContainer>
        <CampaignsTitle>
          <FaEnvelopeOpen />
          Email Campaigns
        </CampaignsTitle>
        <CampaignsSubtitle>
          Create, manage, and monitor your email marketing campaigns
        </CampaignsSubtitle>

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
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>
          
          <CreateButton onClick={() => handleCampaignAction('create', '')}>
            <FaPlus />
            Create Campaign
          </CreateButton>
        </ActionsRow>

        <CampaignsGrid>
          {filteredCampaigns.map((campaign, index) => (
            <CampaignCard
              key={campaign.id}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <CampaignHeader>
                <div>
                  <CampaignTitle>{campaign.title}</CampaignTitle>
                  <CampaignStatus status={campaign.status}>
                    {campaign.status}
                  </CampaignStatus>
                </div>
              </CampaignHeader>

              <CampaignDescription>
                {campaign.description}
              </CampaignDescription>

              <CampaignStats>
                <CampaignStat>
                  <CampaignStatValue>{campaign.recipients.toLocaleString()}</CampaignStatValue>
                  <CampaignStatLabel>Recipients</CampaignStatLabel>
                </CampaignStat>
                <CampaignStat>
                  <CampaignStatValue>{campaign.openRate}%</CampaignStatValue>
                  <CampaignStatLabel>Open Rate</CampaignStatLabel>
                </CampaignStat>
                <CampaignStat>
                  <CampaignStatValue>{campaign.clickRate}%</CampaignStatValue>
                  <CampaignStatLabel>Click Rate</CampaignStatLabel>
                </CampaignStat>
              </CampaignStats>

              <CampaignActions>
                <ActionButton onClick={() => handleCampaignAction('view', campaign.id)}>
                  <FaEye />
                </ActionButton>
                <ActionButton onClick={() => handleCampaignAction('edit', campaign.id)}>
                  <FaEdit />
                </ActionButton>
                {campaign.status === 'active' ? (
                  <ActionButton onClick={() => handleCampaignAction('pause', campaign.id)}>
                    <FaPause />
                  </ActionButton>
                ) : campaign.status === 'paused' ? (
                  <ActionButton variant="primary" onClick={() => handleCampaignAction('resume', campaign.id)}>
                    <FaPlay />
                  </ActionButton>
                ) : null}
                <ActionButton variant="danger" onClick={() => handleCampaignAction('delete', campaign.id)}>
                  <FaTrash />
                </ActionButton>
              </CampaignActions>
            </CampaignCard>
          ))}
        </CampaignsGrid>
      </CampaignsContainer>
    </>
  );
}

export default CampaignsPage; 