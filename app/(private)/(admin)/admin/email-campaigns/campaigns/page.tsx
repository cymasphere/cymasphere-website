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
  FaEnvelope,
  FaEllipsisV,
  FaClone,
  FaDownload,
  FaStop,
  FaClock,
  FaPaperPlane,
  FaExclamationTriangle,
  FaTimes
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";

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
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: visible;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  overflow: visible;
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

  &:nth-child(2), &:nth-child(3), &:nth-child(4), &:nth-child(5), &:nth-child(6) {
    text-align: center;
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

  &:nth-child(2), &:nth-child(3), &:nth-child(4), &:nth-child(5), &:nth-child(6) {
    text-align: center;
  }

  &:last-child {
    text-align: center;
  }
`;

const CampaignTitle = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.25rem;
`;

const CampaignDescription = styled.div`
  color: var(--text-secondary);
  font-size: 0.8rem;
  line-height: 1.4;
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

const MetricValue = styled.div`
  font-weight: 600;
  color: var(--text);
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const ActionsContainer = styled.div`
  display: flex;
  gap: 0.25rem;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: visible;
  width: 100%;
`;

const MoreButton = styled.button`
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
  width: 32px;
  height: 32px;

  &:hover {
    background-color: var(--primary);
    color: white;
  }

  &.active {
    background-color: var(--primary);
    color: white;
  }
`;

const DropdownMenu = styled(motion.div)`
  position: absolute;
  top: 100%;
  right: 0;
  background-color: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  min-width: 180px;
  overflow: visible;
  
  /* Ensure dropdown appears above other content */
  z-index: 9999;
  
  /* Handle positioning near edges */
  @media (max-width: 768px) {
    right: -10px;
    min-width: 160px;
  }
`;

const DropdownItem = styled.button`
  width: 100%;
  padding: 12px 16px;
  border: none;
  background: none;
  color: var(--text);
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--primary);
  }

  &:not(:last-child) {
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  }

  svg {
    font-size: 0.9rem;
    width: 16px;
  }
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

const TabsContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 2rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const Tab = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  padding: 12px 20px;
  border: none;
  background: none;
  color: ${props => props.active ? 'var(--primary)' : 'var(--text-secondary)'};
  font-weight: ${props => props.active ? '600' : '400'};
  cursor: pointer;
  transition: all 0.3s ease;
  border-bottom: 2px solid ${props => props.active ? 'var(--primary)' : 'transparent'};
  font-size: 0.9rem;

  &:hover {
    color: var(--primary);
  }

  @media (max-width: 768px) {
    padding: 8px 12px;
    font-size: 0.8rem;
  }
`;

// Confirmation Modal Styled Components
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
`;

const ModalContent = styled(motion.div)`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2rem;
  max-width: 500px;
  width: 90%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
`;

const ModalTitle = styled.h3`
  color: var(--text);
  font-size: 1.5rem;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: #f59e0b;
    font-size: 1.25rem;
  }
`;

const ModalMessage = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 2rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;

  @media (max-width: 480px) {
    flex-direction: column;
  }
`;

const ModalButton = styled.button<{ variant?: 'primary' | 'danger' | 'secondary' }>`
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.9rem;
  min-width: 100px;

  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background-color: #dc3545;
          color: white;
          &:hover {
            background-color: #c82333;
            transform: translateY(-1px);
          }
        `;
      case 'primary':
        return `
          background-color: var(--primary);
          color: white;
          &:hover {
            background-color: var(--accent);
            transform: translateY(-1px);
          }
        `;
      default:
        return `
          background-color: rgba(255, 255, 255, 0.1);
          color: var(--text-secondary);
          border: 1px solid rgba(255, 255, 255, 0.2);
          &:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: var(--text);
          }
        `;
    }
  }}
`;

function CampaignsPage() {
  const { user } = useAuth();
  const { success, error } = useToast();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'drafts' | 'scheduled' | 'sent'>('drafts');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelCampaignId, setCancelCampaignId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  const [campaignToDelete, setCampaignToDelete] = useState<any>(null);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [campaignAudienceData, setCampaignAudienceData] = useState<Record<string, {
    audienceIds: string[];
    excludedAudienceIds: string[];
    isLoaded: boolean;
  }>>({});
  const [campaignReachData, setCampaignReachData] = useState<Record<string, {
    totalIncluded: number;
    totalExcluded: number;
    estimatedReach: number;
    includedCount: number;
    excludedCount: number;
    isLoading: boolean;
  }>>({});

  // Fetch audience IDs for a campaign (same API call as edit modal)
  const fetchCampaignAudienceData = async (campaignId: string) => {
    if (campaignAudienceData[campaignId]?.isLoaded) return;

    try {
      const response = await fetch(`/api/email-campaigns/campaigns/${campaignId}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        const audienceIds = data.campaign?.audienceIds || [];
        const excludedAudienceIds = data.campaign?.excludedAudienceIds || [];
        
        setCampaignAudienceData(prev => ({
          ...prev,
          [campaignId]: {
            audienceIds,
            excludedAudienceIds,
            isLoaded: true
          }
        }));
        
        console.log(`✅ Loaded audience data for campaign ${campaignId}:`, { audienceIds, excludedAudienceIds });
      }
    } catch (error) {
      console.error(`Error fetching audience data for campaign ${campaignId}:`, error);
    }
  };

  // Copy exact function from edit modal that works
  const calculateAudienceStatsForCampaign = (audienceIds: string[], excludedAudienceIds: string[], campaignId: string) => {
    const includedAudiences = audiences.filter(a => audienceIds.includes(a.id));
    const excludedAudiences = audiences.filter(a => excludedAudienceIds.includes(a.id));
    
    // Calculate fallback totals from audience subscriber_count (EXACT same as edit modal)
    const fallbackTotalIncluded = includedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
    const fallbackTotalExcluded = excludedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
    
    return {
      totalIncluded: fallbackTotalIncluded,
      totalExcluded: fallbackTotalExcluded,
      estimatedReach: Math.max(0, fallbackTotalIncluded - fallbackTotalExcluded),
      includedCount: includedAudiences.length,
      excludedCount: excludedAudiences.length
    };
  };
  
  const { t } = useTranslation();
  const { isLoading: languageLoading } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!languageLoading) {
      setTranslationsLoaded(true);
    }
  }, [languageLoading]);

  // Function to calculate reach for a campaign (exact same logic as edit modal)
  const calculateCampaignReach = async (campaign: any) => {
    if (!campaign.id || campaignReachData[campaign.id]?.isLoading) return;

    // Don't calculate for sent campaigns that already have final metrics
    if (campaign.status === 'sent' || campaign.status === 'completed') {
      return;
    }

    let audienceIds: string[] = [];
    let excludedAudienceIds: string[] = [];
    
    try {
      console.log(`🔍🔍🔍 [${campaign.name}] =====CAMPAIGNS TABLE DEBUG=====`);
      console.log(`Campaign ID: ${campaign.id}`);
      console.log(`Campaign Status: ${campaign.status}`);

      const audienceResponse = await fetch(`/api/email-campaigns/campaigns/${campaign.id}`, {
        credentials: 'include'
      });

      if (!audienceResponse.ok) {
        throw new Error('Failed to fetch campaign details');
      }

      const campaignDetails = await audienceResponse.json();
      console.log(`🔍 Full campaign details response:`, JSON.stringify(campaignDetails, null, 2));
      
      audienceIds = campaignDetails.campaign?.audienceIds || [];
      excludedAudienceIds = campaignDetails.campaign?.excludedAudienceIds || [];
      
      console.log(`🔍 Extracted audience IDs:`, {
        audienceIds,
        excludedAudienceIds,
        totalAudienceCount: audienceIds.length,
        excludedCount: excludedAudienceIds.length
      });

      if (audienceIds.length === 0) {
        setCampaignReachData(prev => ({ 
          ...prev, 
          [campaign.id]: {
            totalIncluded: 0,
            totalExcluded: 0,
            estimatedReach: 0,
            includedCount: 0,
            excludedCount: 0,
            isLoading: false
          }
        }));
        return;
      }

      // Set loading state
      setCampaignReachData(prev => ({ 
        ...prev, 
        [campaign.id]: {
          ...prev[campaign.id],
          isLoading: true
        } as any
      }));

      console.log(`🔍 Calling reach calculation API with:`, {
        audienceIds,
        excludedAudienceIds,
        apiEndpoint: '/api/email-campaigns/campaigns/calculate-reach'
      });

      const reachResponse = await fetch('/api/email-campaigns/campaigns/calculate-reach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          audienceIds,
          excludedAudienceIds
        })
      });

      console.log(`🔍 Reach API response status:`, reachResponse.status);

      if (reachResponse.ok) {
        const reachData = await reachResponse.json();
        console.log(`🔍 Reach API response data:`, JSON.stringify(reachData, null, 2));
        
        const includedAudiences = audiences.filter(a => audienceIds.includes(a.id));
        const excludedAudiences = audiences.filter(a => excludedAudienceIds.includes(a.id));
        
        console.log(`🔍 Available audiences in state:`, audiences.map(a => ({ id: a.id, name: a.name, count: a.subscriber_count })));
        console.log(`🔍 Matched included audiences:`, includedAudiences.map(a => ({ id: a.id, name: a.name, count: a.subscriber_count })));
        console.log(`🔍 Matched excluded audiences:`, excludedAudiences.map(a => ({ id: a.id, name: a.name, count: a.subscriber_count })));
        
        const finalReachData = {
          totalIncluded: reachData.details?.totalIncluded || 0,
          totalExcluded: reachData.details?.totalExcluded || 0,
          estimatedReach: reachData.uniqueCount || 0, // Use uniqueCount like edit modal
          includedCount: includedAudiences.length,
          excludedCount: excludedAudiences.length,
          isLoading: false
        };
        
        console.log(`🔍 Final reach data being set:`, finalReachData);
        console.log(`🔍 KEY VALUE - estimatedReach: ${finalReachData.estimatedReach}`);
        
        setCampaignReachData(prev => ({ 
          ...prev, 
          [campaign.id]: finalReachData
        }));
      } else {
        // Fallback calculation (same as edit modal)
        const includedAudiences = audiences.filter(a => audienceIds.includes(a.id));
        const excludedAudiences = audiences.filter(a => excludedAudienceIds.includes(a.id));
        const totalIncluded = includedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
        const totalExcluded = excludedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
        
        setCampaignReachData(prev => ({ 
          ...prev, 
          [campaign.id]: {
            totalIncluded,
            totalExcluded,
            estimatedReach: Math.max(0, totalIncluded - totalExcluded),
            includedCount: includedAudiences.length,
            excludedCount: excludedAudiences.length,
            isLoading: false
          }
        }));
      }
    } catch (error) {
      // Fallback calculation (same as edit modal)
      const includedAudiences = audiences.filter(a => audienceIds.includes(a.id));
      const excludedAudiences = audiences.filter(a => excludedAudienceIds.includes(a.id));
      const totalIncluded = includedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
      const totalExcluded = excludedAudiences.reduce((sum, audience) => sum + audience.subscriber_count, 0);
      
      setCampaignReachData(prev => ({ 
        ...prev, 
        [campaign.id]: {
          totalIncluded,
          totalExcluded,
          estimatedReach: Math.max(0, totalIncluded - totalExcluded),
          includedCount: includedAudiences.length,
          excludedCount: excludedAudiences.length,
          isLoading: false
        }
      }));
    }
  };

  // Fetch campaigns from API
  useEffect(() => {
    const fetchCampaigns = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/email-campaigns/campaigns', {
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('📧 Fetched campaigns:', data);
          const fetchedCampaigns = data.campaigns || [];
          setCampaigns(fetchedCampaigns);
          
          console.log('🔍🔍🔍 =====CAMPAIGNS TABLE FILTER DEBUG=====');
          console.log('All fetched campaigns:', fetchedCampaigns.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            scheduled_at: c.scheduled_at,
            scheduled_at_date: c.scheduled_at ? new Date(c.scheduled_at) : null,
            current_date: new Date(),
            is_future: c.scheduled_at ? new Date(c.scheduled_at) > new Date() : false
          })));
          
          // Calculate reach for scheduled AND draft campaigns (both need reach calculation)
          const campaignsNeedingReach = fetchedCampaigns.filter((c: any) => 
            c.status === 'scheduled' || c.status === 'draft' || (c.scheduled_at && new Date(c.scheduled_at) > new Date())
          );
          
          console.log('🔍 Campaigns that will get reach calculation:', campaignsNeedingReach.map((c: any) => ({
            id: c.id,
            name: c.name,
            status: c.status,
            scheduled_at: c.scheduled_at
          })));
          
          // Fetch audience data for campaigns that need reach calculation (like edit modal does)
          campaignsNeedingReach.forEach((campaign: any) => {
            console.log(`🔍 Fetching audience data for: ${campaign.name} (${campaign.id})`);
            fetchCampaignAudienceData(campaign.id);
          });
        } else {
          console.error('Failed to fetch campaigns:', response.status);
        }
      } catch (error) {
        console.error('Error fetching campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaigns();
  }, [user]);

  // Load audiences for reach calculation fallbacks (same as edit modal)
  useEffect(() => {
    const loadAudiences = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/email-campaigns/audiences', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          console.log('📊 Loaded audiences for reach calculations:', data.audiences?.length || 0);
          setAudiences(data.audiences || []);
        } else {
          console.error('Failed to load audiences:', response.status);
        }
      } catch (error) {
        console.error('Error loading audiences:', error);
      }
    };

    loadAudiences();
  }, [user]);



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openDropdown && !(event.target as Element).closest('[data-dropdown]')) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  if (languageLoading || !translationsLoaded || loading) {
    return <LoadingComponent />;
  }

  if (!user) {
    return <LoadingComponent />;
  }

  const filteredCampaigns = campaigns.filter((campaign: any) => {
    // First filter by search term
    const matchesSearch = campaign.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      campaign.subject?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Then filter by tab
    switch (activeTab) {
      case 'drafts':
        return campaign.status === 'draft';
      case 'scheduled':
        return campaign.status === 'scheduled' || (campaign.scheduled_at && new Date(campaign.scheduled_at) > new Date());
      case 'sent':
        return campaign.status === 'sent' || campaign.status === 'completed';
      default:
        return campaign.status === 'draft';
    }
  });

  const stats = [
    {
      value: campaigns.length.toString(),
      label: "Total Campaigns",
    },
    {
      value: campaigns.filter((c: any) => c.status === "draft").length.toString(),
      label: "Draft Campaigns",
    },
    {
      value: campaigns.filter((c: any) => c.status === "scheduled" || (c.scheduled_at && new Date(c.scheduled_at) > new Date())).length.toString(),
      label: "Scheduled",
    },
    {
      value: campaigns.filter((c: any) => c.status === "sent" || c.status === "completed").length.toString(),
      label: "Sent Campaigns",
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
    setOpenDropdown(null); // Close dropdown after action
    
    const campaign = campaigns.find(c => c.id === campaignId);
    
    switch (action) {
      case 'create':
        router.push('/admin/email-campaigns/campaigns/create');
        break;
        
      case 'edit':
        // Check if campaign is sent - prevent editing
        if (campaign && (campaign.status === 'sent' || campaign.status === 'completed')) {
          error('Sent campaigns cannot be edited.', 3000);
          return;
        }
        router.push(`/admin/email-campaigns/campaigns/create?edit=${campaignId}`);
        break;
        
      case 'send':
        // Navigate to step 3 (Review & Schedule) with Send Now pre-selected
        router.push(`/admin/email-campaigns/campaigns/create?edit=${campaignId}&step=3&scheduleType=immediate`);
        break;
        
      case 'schedule':
        // Navigate to step 3 (Review & Schedule) of campaign edit
        router.push(`/admin/email-campaigns/campaigns/create?edit=${campaignId}&step=3`);
        break;
        
      case 'editSchedule':
        // Navigate to step 3 (Review & Schedule) of campaign edit
        router.push(`/admin/email-campaigns/campaigns/create?edit=${campaignId}&step=3`);
        break;
        
      case 'editSchedule':
        // Navigate to step 3 (Review & Schedule) of campaign edit
        router.push(`/admin/email-campaigns/campaigns/create?edit=${campaignId}&step=3`);
        break;
        
      case 'cancel':
        // Show confirmation modal instead of browser alert
        setCancelCampaignId(campaignId);
        setShowCancelModal(true);
        break;
        
      case 'pause':
        if (confirm('Are you sure you want to pause this campaign?')) {
          // TODO: Implement pause functionality
          console.log('Pausing campaign:', campaignId);
          success('Campaign paused successfully!', 3000);
        }
        break;
        
      case 'resume':
        if (confirm('Are you sure you want to resume this campaign?')) {
          // TODO: Implement resume functionality
          console.log('Resuming campaign:', campaignId);
          success('Campaign resumed successfully!', 3000);
        }
        break;
        
      case 'view':
        // TODO: Navigate to analytics page
        console.log('Viewing analytics for:', campaignId);
        router.push(`/admin/email-campaigns/analytics?campaign=${campaignId}`);
        break;
        
      case 'clone':
        // TODO: Implement clone functionality
        console.log('Cloning campaign:', campaignId);
        router.push(`/admin/email-campaigns/campaigns/create?clone=${campaignId}`);
        break;
        
      case 'export':
        // TODO: Implement export functionality
        console.log('Exporting data for:', campaignId);
        success('Export functionality coming soon!', 3000);
        break;
        
      case 'delete':
        // Show delete confirmation modal
        const campaignToDelete = campaigns.find(c => c.id === campaignId);
        setDeleteCampaignId(campaignId);
        setCampaignToDelete(campaignToDelete);
        setShowDeleteModal(true);
        break;
        
      default:
        console.log('Unknown action:', action);
    }
  };

  const handleDropdownToggle = (campaignId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenDropdown(openDropdown === campaignId ? null : campaignId);
  };

  const handleCancelConfirm = async () => {
    if (cancelCampaignId) {
      try {
        console.log("Cancelling scheduled campaign:", cancelCampaignId);
        
        // Call API to update campaign status from "scheduled" to "draft"
        const response = await fetch(`/api/email-campaigns/campaigns/${cancelCampaignId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            status: "draft",
            scheduled_at: null // Clear the scheduled time
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log("✅ Campaign schedule cancelled:", result);
          
          // Update the local campaigns state to reflect the change
          setCampaigns(prevCampaigns => 
            prevCampaigns.map(campaign => 
              campaign.id === cancelCampaignId 
                ? { ...campaign, status: "draft", scheduled_at: null }
                : campaign
            )
          );
          
          // Show success toast
          success("Campaign schedule cancelled successfully! Campaign is now a draft.", 4000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to cancel campaign schedule");
        }
        
        // Close modal and reset state
        setShowCancelModal(false);
        setCancelCampaignId(null);
      } catch (err) {
        // Show error toast
        error("Failed to cancel campaign schedule. Please try again.", 5000);
        console.error("Error cancelling campaign:", err);
      }
    }
  };

  const handleCancelClose = () => {
    setShowCancelModal(false);
    setCancelCampaignId(null);
  };

  const handleDeleteConfirm = async () => {
    if (deleteCampaignId) {
      try {
        console.log("Deleting campaign:", deleteCampaignId);
        
        // Call API to delete the campaign
        const response = await fetch(`/api/email-campaigns/campaigns/${deleteCampaignId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          console.log("✅ Campaign deleted successfully");
          
          // Remove the campaign from local state
          setCampaigns(prevCampaigns => 
            prevCampaigns.filter(campaign => campaign.id !== deleteCampaignId)
          );
          
          // Show success toast
          success(`Campaign "${campaignToDelete?.name || 'Untitled'}" deleted successfully!`, 4000);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete campaign");
        }
        
        // Close modal and reset state
        setShowDeleteModal(false);
        setDeleteCampaignId(null);
        setCampaignToDelete(null);
      } catch (err) {
        // Show error toast
        error("Failed to delete campaign. Please try again.", 5000);
        console.error("Error deleting campaign:", err);
        
        // Keep modal open on error so user can try again
      }
    }
  };

  const handleDeleteClose = () => {
    setShowDeleteModal(false);
    setDeleteCampaignId(null);
    setCampaignToDelete(null);
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
          
          <ActionButton variant="primary" onClick={() => handleCampaignAction('create', '')}>
            <FaPlus />
            Create Campaign
          </ActionButton>
        </ActionsRow>

        <TabsContainer>
          <Tab active={activeTab === 'drafts'} onClick={() => setActiveTab('drafts')}>
            Drafts
          </Tab>
          <Tab active={activeTab === 'scheduled'} onClick={() => setActiveTab('scheduled')}>
            Scheduled
          </Tab>
          <Tab active={activeTab === 'sent'} onClick={() => setActiveTab('sent')}>
            Sent
          </Tab>
        </TabsContainer>

        <CampaignsGrid>
          <Table>
            <TableHeader>
              <tr>
                <TableHeaderCell>Campaign</TableHeaderCell>
                <TableHeaderCell>Status</TableHeaderCell>
                {activeTab === 'scheduled' ? (
                  <>
                    <TableHeaderCell>Scheduled Time</TableHeaderCell>  
                    <TableHeaderCell>Reach</TableHeaderCell>
                  </>
                ) : activeTab === 'drafts' ? (
                  <>
                    <TableHeaderCell>Reach</TableHeaderCell>
                  </>
                ) : (
                  <>
                    <TableHeaderCell>Recipients</TableHeaderCell>
                    <TableHeaderCell>Open Rate</TableHeaderCell>
                    <TableHeaderCell>Click Rate</TableHeaderCell>
                  </>
                )}
                <TableHeaderCell>Created</TableHeaderCell>
                <TableHeaderCell>Actions</TableHeaderCell>
              </tr>
            </TableHeader>
            <TableBody>
              {filteredCampaigns.length === 0 ? (
                <tr>
                  <TableCell colSpan={activeTab === 'scheduled' ? 6 : 7}>
                    <EmptyState>
                      <FaEnvelopeOpen />
                      <h3>No campaigns found</h3>
                      <p>Try adjusting your search criteria or create a new campaign.</p>
                    </EmptyState>
                  </TableCell>
                </tr>
              ) : (
                filteredCampaigns.map((campaign: any, index: number) => (
                  <TableRow
                    key={campaign.id}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={index}
                    onClick={() => {
                      // Prevent editing sent campaigns
                      if (campaign.status === 'sent' || campaign.status === 'completed') {
                        error('Sent campaigns cannot be edited.', 3000);
                        return;
                      }
                      handleCampaignAction('edit', campaign.id);
                    }}
                  >
                    <TableCell>
                      <CampaignTitle>{campaign.name || 'Untitled'}</CampaignTitle>
                      <CampaignDescription>{campaign.subject || campaign.description || 'No description'}</CampaignDescription>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={campaign.status || 'draft'}>{campaign.status || 'draft'}</StatusBadge>
                    </TableCell>
                    {activeTab === 'scheduled' ? (
                      <>
                        <TableCell>
                          <MetricValue>
                            {campaign.scheduled_at 
                              ? (() => {
                                  const scheduledDate = new Date(campaign.scheduled_at);
                                  console.log('📅 Displaying scheduled time:', {
                                    campaignName: campaign.name,
                                    storedValue: campaign.scheduled_at,
                                    parsedDate: scheduledDate.toString(),
                                    utcString: scheduledDate.toUTCString(),
                                    localString: scheduledDate.toLocaleString(),
                                    timezoneOffset: scheduledDate.getTimezoneOffset()
                                  });
                                  
                                  return scheduledDate.toLocaleString(undefined, {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZoneName: 'short'
                                  });
                                })()
                              : 'Not scheduled'
                            }
                          </MetricValue>
                        </TableCell>
                        <TableCell>
                          <MetricValue>
                            {campaignReachData[campaign.id]?.isLoading ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  style={{ width: '12px', height: '12px', border: '2px solid rgba(108, 99, 255, 0.3)', borderTop: '2px solid var(--primary)', borderRadius: '50%' }}
                                />
                                Calculating...
                              </span>
                            ) : (() => {
                              // Get audience data (fetched separately like edit modal)
                              const campaignAudiences = campaignAudienceData[campaign.id];
                              
                              if (!campaignAudiences?.isLoaded) {
                                console.log(`🔄 Still loading audience data for ${campaign.name}...`);
                                return '...';
                              }
                              
                              const audienceIds = campaignAudiences.audienceIds || [];
                              const excludedAudienceIds = campaignAudiences.excludedAudienceIds || [];
                              
                              if (audienceIds.length === 0) {
                                console.log(`⚠️ No audiences for ${campaign.name}`);
                                return '0';
                              }
                              
                              if (audiences.length === 0) {
                                console.log(`🔄 Audiences list not loaded yet for ${campaign.name}`);
                                return '...';
                              }
                              
                              // Use EXACT same logic as edit modal
                              const stats = calculateAudienceStatsForCampaign(audienceIds, excludedAudienceIds, campaign.id);
                              const finalReach = stats.estimatedReach;
                              
                              console.log(`🎯 FINAL REACH for ${campaign.name}:`, {
                                audienceIds,
                                excludedAudienceIds,
                                stats,
                                finalReach
                              });
                              
                              return finalReach.toLocaleString();
                            })()}
                          </MetricValue>
                          <MetricLabel>subscribers</MetricLabel>
                        </TableCell>
                      </>
                    ) : activeTab === 'drafts' ? (
                      <>
                        <TableCell>
                          <MetricValue>
                            {campaignReachData[campaign.id]?.isLoading ? (
                              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                  style={{ width: '12px', height: '12px', border: '2px solid rgba(108, 99, 255, 0.3)', borderTop: '2px solid var(--primary)', borderRadius: '50%' }}
                                />
                                Calculating...
                              </span>
                            ) : (() => {
                              // Get audience data (fetched separately like edit modal)
                              const campaignAudiences = campaignAudienceData[campaign.id];
                              
                              if (!campaignAudiences?.isLoaded) {
                                console.log(`🔄 Still loading audience data for ${campaign.name}...`);
                                return '...';
                              }
                              
                              const audienceIds = campaignAudiences.audienceIds || [];
                              const excludedAudienceIds = campaignAudiences.excludedAudienceIds || [];
                              
                              if (audienceIds.length === 0) {
                                console.log(`⚠️ No audiences for ${campaign.name}`);
                                return '0';
                              }
                              
                              if (audiences.length === 0) {
                                console.log(`🔄 Audiences list not loaded yet for ${campaign.name}`);
                                return '...';
                              }
                              
                              // Use EXACT same logic as edit modal
                              const stats = calculateAudienceStatsForCampaign(audienceIds, excludedAudienceIds, campaign.id);
                              const finalReach = stats.estimatedReach;
                              
                              console.log(`🎯 FINAL REACH for ${campaign.name}:`, {
                                audienceIds,
                                excludedAudienceIds,
                                stats,
                                finalReach
                              });
                              
                              return finalReach.toLocaleString();
                            })()}
                          </MetricValue>
                          <MetricLabel>subscribers</MetricLabel>
                        </TableCell>
                      </>
                    ) : (
                      <>
                        <TableCell>
                          <MetricValue>{campaign.total_recipients || 0}</MetricValue>
                        </TableCell>
                        <TableCell>
                          <MetricValue>0%</MetricValue>
                        </TableCell>
                        <TableCell>
                          <MetricValue>0%</MetricValue>
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      {campaign.created_at ? new Date(campaign.created_at).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <ActionsContainer data-dropdown>
                        <MoreButton 
                          onClick={(e) => handleDropdownToggle(campaign.id, e)}
                          className={openDropdown === campaign.id ? 'active' : ''}
                        >
                          <FaEllipsisV />
                        </MoreButton>
                        <AnimatePresence>
                          {openDropdown === campaign.id && (
                            <DropdownMenu
                              initial={{ opacity: 0, scale: 0.8, y: -10 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.8, y: -10 }}
                              transition={{ duration: 0.15 }}
                            >
                              {/* Draft Campaign Options */}
                              {campaign.status === 'draft' && (
                                <>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('edit', campaign.id); }}>
                                    <FaEdit />
                                    Edit Campaign
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('send', campaign.id); }}>
                                    <FaPaperPlane />
                                    Send Now
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('schedule', campaign.id); }}>
                                    <FaClock />
                                    Schedule
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('clone', campaign.id); }}>
                                    <FaClone />
                                    Duplicate
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('delete', campaign.id); }}>
                                    <FaTrash />
                                    Delete
                                  </DropdownItem>
                                </>
                              )}

                              {/* Scheduled Campaign Options */}
                              {campaign.status === 'scheduled' && (
                                <>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('editSchedule', campaign.id); }}>
                                    <FaEdit />
                                    Edit Schedule
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('send', campaign.id); }}>
                                    <FaPaperPlane />
                                    Send Now
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('cancel', campaign.id); }}>
                                    <FaStop />
                                    Cancel Schedule
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('clone', campaign.id); }}>
                                    <FaClone />
                                    Duplicate
                                  </DropdownItem>
                                </>
                              )}

                              {/* Sent/Completed Campaign Options */}
                              {(campaign.status === 'sent' || campaign.status === 'completed') && (
                                <>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('view', campaign.id); }}>
                                    <FaEye />
                                    View Analytics
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('export', campaign.id); }}>
                                    <FaDownload />
                                    Export Data
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('clone', campaign.id); }}>
                                    <FaClone />
                                    Duplicate
                                  </DropdownItem>
                                </>
                              )}

                              {/* Active/Paused Campaign Options */}
                              {campaign.status === 'active' && (
                                <>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('pause', campaign.id); }}>
                                    <FaPause />
                                    Pause Campaign
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('view', campaign.id); }}>
                                    <FaEye />
                                    View Analytics
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('clone', campaign.id); }}>
                                    <FaClone />
                                    Duplicate
                                  </DropdownItem>
                                </>
                              )}

                              {campaign.status === 'paused' && (
                                <>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('resume', campaign.id); }}>
                                    <FaPlay />
                                    Resume Campaign
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('edit', campaign.id); }}>
                                    <FaEdit />
                                    Edit Campaign
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('view', campaign.id); }}>
                                    <FaEye />
                                    View Analytics
                                  </DropdownItem>
                                  <DropdownItem onClick={(e) => { e.stopPropagation(); handleCampaignAction('clone', campaign.id); }}>
                                    <FaClone />
                                    Duplicate
                                  </DropdownItem>
                                </>
                              )}
                            </DropdownMenu>
                          )}
                        </AnimatePresence>
                      </ActionsContainer>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CampaignsGrid>
      </CampaignsContainer>

      {/* Cancel Schedule Confirmation Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancelClose}
          >
            <ModalContent
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalTitle>
                <FaExclamationTriangle />
                Cancel Scheduled Campaign
              </ModalTitle>
              <ModalMessage>
                Are you sure you want to cancel this scheduled campaign? This action cannot be undone and the campaign will not be sent to your subscribers.
              </ModalMessage>
              <ModalActions>
                <ModalButton onClick={handleCancelClose}>
                  Cancel
                </ModalButton>
                <ModalButton variant="danger" onClick={handleCancelConfirm}>
                  Yes, Cancel Schedule
                </ModalButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>

      {/* Delete Campaign Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDeleteClose}
          >
            <ModalContent
              initial={{ opacity: 0, scale: 0.8, y: 50 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 50 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalTitle>
                <FaExclamationTriangle />
                Delete Campaign
              </ModalTitle>
              <ModalMessage>
                Are you sure you want to delete the campaign "{campaignToDelete?.name || 'Untitled'}"? This action cannot be undone and all campaign data will be permanently lost.
              </ModalMessage>
              <ModalActions>
                <ModalButton onClick={handleDeleteClose}>
                  Cancel
                </ModalButton>
                <ModalButton variant="danger" onClick={handleDeleteConfirm}>
                  Yes, Delete Campaign
                </ModalButton>
              </ModalActions>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
}

export default CampaignsPage; 