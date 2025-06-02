"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaUpload,
  FaDownload,
  FaSync,
  FaFilter,
  FaSearch,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaGlobe,
  FaHeart,
  FaShoppingCart,
  FaMobile,
  FaDesktop,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";
import { useRouter } from "next/navigation";

const Container = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
`;

const BackButton = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  text-decoration: none;
  margin-bottom: 1rem;
  transition: color 0.3s ease;

  &:hover {
    color: var(--primary);
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 1rem;

  svg {
    color: #1877f2;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0;
`;

const Controls = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: stretch;
  }
`;

const SearchBar = styled.div`
  position: relative;
  flex: 1;
  max-width: 400px;

  @media (max-width: 768px) {
    max-width: none;
  }
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 0.75rem 1rem 0.75rem 2.5rem;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text);
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: var(--primary);
    background: rgba(255, 255, 255, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    justify-content: stretch;
  }
`;

const Button = styled(motion.button)<{ $variant?: 'primary' | 'secondary' | 'danger' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      default: return 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)';
    }
  }};
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }

  @media (max-width: 768px) {
    flex: 1;
    justify-content: center;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const StatCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--primary), var(--accent));
  }
`;

const StatValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: var(--text);
  margin-bottom: 0.5rem;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const StatLabel = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
`;

const AudienceGrid = styled.div`
  display: grid;
  gap: 1.5rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }
`;

const AudienceCard = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  overflow: hidden;
  transition: all 0.3s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.02);
    border-color: var(--primary);
  }
`;

const AudienceHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
`;

const AudienceInfo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const AudienceDetails = styled.div`
  flex: 1;
`;

const AudienceName = styled.h3`
  font-size: 1.3rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
`;

const AudienceDescription = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.4;
`;

const AudienceMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const MetaItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`;

const AudienceActions = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: flex-start;

  @media (max-width: 768px) {
    justify-content: flex-end;
  }
`;

const SmallButton = styled(motion.button)`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: var(--text-secondary);
  padding: 0.5rem;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--primary);
    color: var(--primary);
  }

  svg {
    font-size: 0.9rem;
  }
`;

const AudienceStats = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  padding: 1.5rem;
  background: rgba(255, 255, 255, 0.02);
`;

const AudienceStatItem = styled.div`
  text-align: center;
`;

const AudienceStatValue = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text);
`;

const AudienceStatLabel = styled.div`
  font-size: 0.7rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-top: 0.25rem;
`;

const StatusBadge = styled.div<{ $status: 'active' | 'inactive' | 'processing' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  background: ${props => {
    switch (props.$status) {
      case 'active': return 'rgba(34, 197, 94, 0.2)';
      case 'processing': return 'rgba(245, 158, 11, 0.2)';
      default: return 'rgba(107, 114, 128, 0.2)';
    }
  }};
  color: ${props => {
    switch (props.$status) {
      case 'active': return '#22c55e';
      case 'processing': return '#f59e0b';
      default: return '#6b7280';
    }
  }};
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 1rem;
  color: var(--text-secondary);
`;

const EmptyStateIcon = styled.div`
  font-size: 4rem;
  margin-bottom: 1rem;
  opacity: 0.5;
`;

const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ModalContent = styled(motion.div)`
  background: var(--card-bg);
  border-radius: 16px;
  padding: 2rem;
  max-width: 480px;
  width: 100%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  position: relative;
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const ModalIcon = styled.div`
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.5rem;
`;

const ModalTitle = styled.h3`
  font-size: 1.5rem;
  color: var(--text);
  margin: 0;
`;

const ModalBody = styled.div`
  margin-bottom: 2rem;
`;

const ModalText = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0 0 1rem 0;
`;

const AudienceInfoCard = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 1rem;
  border-left: 4px solid var(--primary);
`;

const AudienceInfoTitle = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
`;

const AudienceInfoDetails = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ModalButton = styled(motion.button)<{ $variant?: 'primary' | 'danger' | 'secondary' }>`
  background: ${props => {
    switch (props.$variant) {
      case 'danger': return 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
      case 'secondary': return 'rgba(255, 255, 255, 0.1)';
      default: return 'linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)';
    }
  }};
  border: none;
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const CloseButton = styled.button`
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
    color: var(--text);
  }
`;

interface Audience {
  id: string;
  name: string;
  description: string;
  type: 'custom' | 'lookalike' | 'saved';
  status: 'active' | 'inactive' | 'processing';
  size: number;
  reach: number;
  demographics: {
    ageRange: string;
    gender: string;
    locations: string[];
  };
  interests: string[];
  createdAt: string;
  lastUpdated: string;
}

interface DeleteModalProps {
  audience: Audience | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteModalProps> = ({
  audience,
  isOpen,
  onClose,
  onConfirm,
  isDeleting
}) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  if (!audience) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
        >
          <ModalContent
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <CloseButton onClick={onClose}>
              <FaTimes />
            </CloseButton>

            <ModalHeader>
              <ModalIcon>
                <FaExclamationTriangle />
              </ModalIcon>
              <ModalTitle>Delete Audience</ModalTitle>
            </ModalHeader>

            <ModalBody>
              <ModalText>
                Are you sure you want to delete this audience? This action cannot be undone and will permanently remove the audience from your account.
              </ModalText>

                             <AudienceInfoCard>
                 <AudienceInfoTitle>{audience.name}</AudienceInfoTitle>
                 <AudienceInfoDetails>
                  <span>Size: {formatNumber(audience.size)}</span>
                  <span>Reach: {formatNumber(audience.reach)}</span>
                  <span>Type: {audience.type.charAt(0).toUpperCase() + audience.type.slice(1)}</span>
                                     <span>Status: {audience.status.charAt(0).toUpperCase() + audience.status.slice(1)}</span>
                 </AudienceInfoDetails>
               </AudienceInfoCard>

              <ModalText style={{ marginTop: '1rem', fontSize: '0.9rem' }}>
                <strong>Note:</strong> Any active campaigns using this audience will need to be updated with a different audience.
              </ModalText>
            </ModalBody>

            <ModalActions>
              <ModalButton
                $variant="secondary"
                onClick={onClose}
                disabled={isDeleting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </ModalButton>
              <ModalButton
                $variant="danger"
                onClick={onConfirm}
                disabled={isDeleting}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <FaTrash />
                {isDeleting ? 'Deleting...' : 'Delete Audience'}
              </ModalButton>
            </ModalActions>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );
};

const mockAudiences: Audience[] = [
  {
    id: "1",
    name: "Music Producers 25-35",
    description: "Professional music producers aged 25-35 interested in electronic music production tools",
    type: "custom",
    status: "active",
    size: 45000,
    reach: 32000,
    demographics: {
      ageRange: "25-35",
      gender: "All",
      locations: ["United States", "Canada", "United Kingdom"]
    },
    interests: ["Music Production", "Electronic Music", "Audio Software", "DJ Equipment"],
    createdAt: "2024-01-15",
    lastUpdated: "2024-01-20"
  },
  {
    id: "2",
    name: "Lookalike - Existing Customers",
    description: "Lookalike audience based on our top-performing customers",
    type: "lookalike",
    status: "active",
    size: 2100000,
    reach: 1800000,
    demographics: {
      ageRange: "18-55",
      gender: "All",
      locations: ["United States"]
    },
    interests: ["Music", "Technology", "Creative Software"],
    createdAt: "2024-01-18",
    lastUpdated: "2024-01-19"
  },
  {
    id: "3",
    name: "Website Visitors - Last 30 Days",
    description: "Users who visited our website in the last 30 days",
    type: "custom",
    status: "processing",
    size: 8500,
    reach: 6800,
    demographics: {
      ageRange: "18-65",
      gender: "All",
      locations: ["Worldwide"]
    },
    interests: ["Music Production", "Software"],
    createdAt: "2024-01-22",
    lastUpdated: "2024-01-22"
  }
];

export default function AudiencesPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [audiences, setAudiences] = useState<Audience[]>(mockAudiences);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredAudiences, setFilteredAudiences] = useState<Audience[]>(mockAudiences);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    audience: Audience | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    audience: null,
    isDeleting: false
  });

  useEffect(() => {
    // Filter audiences based on search term
    const filtered = audiences.filter(audience =>
      audience.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audience.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audience.interests.some(interest => 
        interest.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredAudiences(filtered);
  }, [searchTerm, audiences]);

  const handleDeleteAudience = async (audienceId: string) => {
    const audience = audiences.find(a => a.id === audienceId);
    if (!audience) return;

    setDeleteModal({
      isOpen: true,
      audience,
      isDeleting: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteModal.audience) return;

    setDeleteModal(prev => ({ ...prev, isDeleting: true }));

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setAudiences(prev => prev.filter(audience => audience.id !== deleteModal.audience?.id));
      
      setDeleteModal({
        isOpen: false,
        audience: null,
        isDeleting: false
      });
    } catch (error) {
      console.error('Error deleting audience:', error);
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const closeDeleteModal = () => {
    if (deleteModal.isDeleting) return; // Prevent closing while deleting
    
    setDeleteModal({
      isOpen: false,
      audience: null,
      isDeleting: false
    });
  };

  const handleRefreshAudience = async (audienceId: string) => {
    // Simulate audience refresh
    setAudiences(prev => prev.map(audience => 
      audience.id === audienceId 
        ? { ...audience, status: 'processing' as const, lastUpdated: new Date().toISOString() }
        : audience
    ));

    // Simulate processing completion
    setTimeout(() => {
      setAudiences(prev => prev.map(audience => 
        audience.id === audienceId 
          ? { ...audience, status: 'active' as const }
          : audience
      ));
    }, 3000);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const totalAudiences = audiences.length;
  const activeAudiences = audiences.filter(a => a.status === 'active').length;
  const totalReach = audiences.reduce((sum, a) => sum + a.reach, 0);
  const avgAudienceSize = audiences.length > 0 
    ? audiences.reduce((sum, a) => sum + a.size, 0) / audiences.length 
    : 0;

  if (!user) {
    return <LoadingComponent />;
  }

  return (
    <>
      <Container>
        <Header>
          <BackButton href="/admin/ad-manager">
            <FaArrowLeft /> Back to Ad Manager
          </BackButton>
          <Title>
            <FaUsers />
            Audience Management
          </Title>
          <Subtitle>
            Create and manage custom audiences for targeted advertising campaigns
          </Subtitle>
        </Header>

        <StatsGrid>
          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <StatValue>{totalAudiences}</StatValue>
            <StatLabel>Total Audiences</StatLabel>
          </StatCard>

          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <StatValue>{activeAudiences}</StatValue>
            <StatLabel>Active Audiences</StatLabel>
          </StatCard>

          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <StatValue>{formatNumber(totalReach)}</StatValue>
            <StatLabel>Total Reach</StatLabel>
          </StatCard>

          <StatCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <StatValue>{formatNumber(Math.round(avgAudienceSize))}</StatValue>
            <StatLabel>Avg. Audience Size</StatLabel>
          </StatCard>
        </StatsGrid>

        <Controls>
          <SearchBar>
            <SearchIcon>
              <FaSearch />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Search audiences..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchBar>

          <ActionButtons>
            <Button
              $variant="secondary"
              onClick={() => {
                // In real implementation, this would open a file upload dialog
                alert('Import functionality would open a file upload dialog for customer lists, website visitors, etc.');
              }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaUpload />
              Import
            </Button>
            <Button
              onClick={() => router.push('/admin/ad-manager/audiences/create')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FaPlus />
              Create Audience
            </Button>
          </ActionButtons>
        </Controls>

        <AudienceGrid>
          {filteredAudiences.length > 0 ? (
            filteredAudiences.map((audience, index) => (
              <AudienceCard
                key={audience.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <AudienceHeader>
                  <AudienceInfo>
                    <AudienceDetails>
                      <AudienceName>{audience.name}</AudienceName>
                      <AudienceDescription>{audience.description}</AudienceDescription>
                      <AudienceMeta>
                        <MetaItem>
                          <FaUsers />
                          {audience.type.charAt(0).toUpperCase() + audience.type.slice(1)}
                        </MetaItem>
                        <MetaItem>
                          <FaGlobe />
                          {audience.demographics.locations.join(', ')}
                        </MetaItem>
                        <MetaItem>
                          <FaCheckCircle />
                          <StatusBadge $status={audience.status}>
                            {audience.status === 'processing' && <FaSync />}
                            {audience.status.charAt(0).toUpperCase() + audience.status.slice(1)}
                          </StatusBadge>
                        </MetaItem>
                      </AudienceMeta>
                    </AudienceDetails>

                    <AudienceActions>
                      <SmallButton
                        onClick={() => handleRefreshAudience(audience.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaSync />
                      </SmallButton>
                      <SmallButton
                        onClick={() => {
                          // In real implementation, this would open a detailed view modal or page
                          alert(`View details for audience: ${audience.name}\nSize: ${formatNumber(audience.size)}\nReach: ${formatNumber(audience.reach)}\nType: ${audience.type}`);
                        }}
                        title="View Audience Details"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaEye />
                      </SmallButton>
                      <SmallButton
                        onClick={() => router.push(`/admin/ad-manager/audiences/${audience.id}/edit`)}
                        title="Edit Audience"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaEdit />
                      </SmallButton>
                      <SmallButton
                        onClick={() => handleDeleteAudience(audience.id)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <FaTrash />
                      </SmallButton>
                    </AudienceActions>
                  </AudienceInfo>
                </AudienceHeader>

                <AudienceStats>
                  <AudienceStatItem>
                    <AudienceStatValue>{formatNumber(audience.size)}</AudienceStatValue>
                    <AudienceStatLabel>Audience Size</AudienceStatLabel>
                  </AudienceStatItem>
                  <AudienceStatItem>
                    <AudienceStatValue>{formatNumber(audience.reach)}</AudienceStatValue>
                    <AudienceStatLabel>Potential Reach</AudienceStatLabel>
                  </AudienceStatItem>
                  <AudienceStatItem>
                    <AudienceStatValue>{audience.demographics.ageRange}</AudienceStatValue>
                    <AudienceStatLabel>Age Range</AudienceStatLabel>
                  </AudienceStatItem>
                  <AudienceStatItem>
                    <AudienceStatValue>{audience.interests.length}</AudienceStatValue>
                    <AudienceStatLabel>Interests</AudienceStatLabel>
                  </AudienceStatItem>
                </AudienceStats>
              </AudienceCard>
            ))
          ) : (
            <EmptyState>
              <EmptyStateIcon>
                <FaUsers />
              </EmptyStateIcon>
              <h3>No audiences found</h3>
              <p>
                {searchTerm 
                  ? `No audiences match "${searchTerm}". Try a different search term.`
                  : "Create your first custom audience to start targeting specific groups of users."
                }
              </p>
              {!searchTerm && (
                <Button
                  style={{ marginTop: '1rem' }}
                  onClick={() => router.push('/admin/ad-manager/audiences/create')}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <FaPlus />
                  Create First Audience
                </Button>
              )}
            </EmptyState>
          )}
        </AudienceGrid>
      </Container>

      <DeleteConfirmationModal
        audience={deleteModal.audience}
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        isDeleting={deleteModal.isDeleting}
      />
    </>
  );
} 