"use client";
import React, { useState, useEffect } from "react";
import NextSEO from "@/components/NextSEO";
import { useTranslation } from "react-i18next";
import useLanguage from "@/hooks/useLanguage";
import { 
  FaFlask, 
  FaArrowLeft,
  FaSave,
  FaPlay,
  FaStop,
  FaChevronRight,
  FaInfoCircle,
  FaChartLine,
  FaUsers,
  FaEnvelopeOpen,
  FaMousePointer,
  FaCalendarAlt,
  FaPlus,
  FaTimes,
  FaEdit,
  FaCopy,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaTrophy,
  FaBalanceScale,
  FaPercentage,
  FaClock,
  FaFlag,
  FaCog
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useParams } from "next/navigation";
import styled from "styled-components";
import { motion } from "framer-motion";
import LoadingComponent from "@/components/common/LoadingComponent";
import Link from "next/link";

const ABTestContainer = styled.div`
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

const TestTitle = styled.h1`
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

const TestMeta = styled.div`
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
      case 'running':
        return `
          background-color: rgba(40, 167, 69, 0.2);
          color: #28a745;
        `;
      case 'completed':
        return `
          background-color: rgba(108, 99, 255, 0.2);
          color: var(--primary);
        `;
      case 'draft':
        return `
          background-color: rgba(108, 117, 125, 0.2);
          color: #6c757d;
        `;
      case 'stopped':
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

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' | 'success' }>`
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
      case 'success':
        return `
          background-color: #28a745;
          color: white;
          &:hover {
            background-color: #218838;
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

const TestLayout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const VariantCard = styled(motion.div)<{ isWinner?: boolean }>`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 2px solid ${props => props.isWinner ? '#28a745' : 'rgba(255, 255, 255, 0.05)'};
  overflow: hidden;
  position: relative;

  ${props => props.isWinner && `
    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, #28a745, #20c997);
      z-index: 1;
    }
  `}
`;

const VariantHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const VariantTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const WinnerBadge = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 4px 8px;
  border-radius: 12px;
  background-color: rgba(40, 167, 69, 0.2);
  color: #28a745;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
`;

const VariantActions = styled.div`
  display: flex;
  gap: 0.25rem;
`;

const VariantButton = styled.button`
  padding: 6px 8px;
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

const VariantContent = styled.div`
  padding: 1.5rem;
`;

const VariantPreview = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const SubjectLine = styled.div`
  font-weight: 600;
  color: var(--text);
  margin-bottom: 0.5rem;
  font-size: 1rem;
`;

const PreheaderText = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  margin-bottom: 1rem;
`;

const VariantMetrics = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
`;

const MetricCard = styled.div`
  text-align: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 6px;
`;

const MetricValue = styled.div`
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 0.25rem;
`;

const MetricLabel = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const TestConfigSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
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

const ConfigGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
`;

const ConfigItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ConfigLabel = styled.label`
  font-weight: 500;
  color: var(--text);
  font-size: 0.9rem;
`;

const ConfigInput = styled.input`
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
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

const ConfigSelect = styled.select`
  padding: 10px 12px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
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

const ResultsSection = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  padding: 2rem;
  margin-bottom: 2rem;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const ResultCard = styled.div<{ variant?: string }>`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1.5rem;
  text-align: center;
  border: 1px solid ${props => {
    switch (props.variant) {
      case 'success': return 'rgba(40, 167, 69, 0.3)';
      case 'warning': return 'rgba(255, 193, 7, 0.3)';
      case 'danger': return 'rgba(220, 53, 69, 0.3)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
`;

const ResultValue = styled.div<{ variant?: string }>`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: ${props => {
    switch (props.variant) {
      case 'success': return '#28a745';
      case 'warning': return '#ffc107';
      case 'danger': return '#dc3545';
      default: return 'var(--primary)';
    }
  }};
`;

const ResultLabel = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
`;

const ResultChange = styled.div<{ positive: boolean }>`
  font-size: 0.8rem;
  color: ${props => props.positive ? '#28a745' : '#dc3545'};
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  overflow: hidden;
  margin: 1rem 0;
`;

const ProgressFill = styled.div<{ percentage: number; color?: string }>`
  height: 100%;
  width: ${props => props.percentage}%;
  background-color: ${props => props.color || 'var(--primary)'};
  transition: width 0.3s ease;
`;

// Mock data
const mockABTest = {
  id: "1",
  campaignId: "1",
  name: "Subject Line Test",
  status: "running",
  startDate: "2024-01-20",
  endDate: "2024-01-27",
  testType: "subject_line",
  sampleSize: 1000,
  confidence: 95,
  variants: [
    {
      id: "A",
      name: "Variant A (Control)",
      subject: "🎵 New Beats Available - Check Them Out!",
      preheader: "Discover fresh sounds for your next track",
      traffic: 50,
      sent: 500,
      opens: 125,
      clicks: 18,
      openRate: 25.0,
      clickRate: 3.6,
      isControl: true
    },
    {
      id: "B",
      name: "Variant B",
      subject: "Fresh Beats Just Dropped - Listen Now",
      preheader: "New music samples ready for download",
      traffic: 50,
      sent: 500,
      opens: 145,
      clicks: 23,
      openRate: 29.0,
      clickRate: 4.6,
      isControl: false
    }
  ],
  winner: "B",
  significance: 87.5,
  improvement: 16.0
};

function ABTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams();
  const [translationsLoaded, setTranslationsLoaded] = useState(false);
  const [testData, setTestData] = useState(mockABTest);
  
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

  const handleTestAction = (action: string) => {
    console.log(`${action} A/B test:`, testData.id);
    // Implement test actions here
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.2, duration: 0.6, ease: "easeOut" },
    }),
  };

  return (
    <>
      <NextSEO
        title={`A/B Test: ${testData.name}`}
        description="Analyze and manage your email campaign A/B test results"
      />
      
      <ABTestContainer>
        <BackButton href={`/admin/email-campaigns/campaigns/${params.id}`}>
          <FaArrowLeft />
          Back to Campaign
        </BackButton>

        <Breadcrumbs>
          <BreadcrumbLink href="/admin">Admin</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href="/admin/email-campaigns/campaigns">Email Campaigns</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbLink href={`/admin/email-campaigns/campaigns/${params.id}`}>Campaign</BreadcrumbLink>
          <FaChevronRight />
          <BreadcrumbCurrent>A/B Test</BreadcrumbCurrent>
        </Breadcrumbs>

        <Header>
          <HeaderLeft>
            <TestTitle>
              <FaFlask />
              {testData.name}
            </TestTitle>
            <TestMeta>
              <StatusBadge status={testData.status}>{testData.status}</StatusBadge>
              <MetricItem>
                <FaUsers />
                <strong>{testData.sampleSize.toLocaleString()}</strong> recipients
              </MetricItem>
              <MetricItem>
                <FaPercentage />
                <strong>{testData.confidence}%</strong> confidence
              </MetricItem>
              <MetricItem>
                <FaCalendarAlt />
                {new Date(testData.startDate).toLocaleDateString()} - {new Date(testData.endDate).toLocaleDateString()}
              </MetricItem>
            </TestMeta>
          </HeaderLeft>
          <HeaderActions>
            {testData.status === 'running' ? (
              <ActionButton variant="danger" onClick={() => handleTestAction('stop')}>
                <FaStop />
                Stop Test
              </ActionButton>
            ) : testData.status === 'draft' ? (
              <ActionButton variant="success" onClick={() => handleTestAction('start')}>
                <FaPlay />
                Start Test
              </ActionButton>
            ) : null}
            <ActionButton onClick={() => handleTestAction('save')}>
              <FaSave />
              Save
            </ActionButton>
          </HeaderActions>
        </Header>

        {testData.status === 'completed' && (
          <ResultsSection>
            <SectionTitle>
              <FaTrophy />
              Test Results
            </SectionTitle>
            
            <ResultsGrid>
              <ResultCard variant="success">
                <ResultValue variant="success">{testData.improvement}%</ResultValue>
                <ResultLabel>Performance Improvement</ResultLabel>
                <ResultChange positive={true}>
                  <FaCheckCircle />
                  Variant {testData.winner} wins
                </ResultChange>
              </ResultCard>
              
              <ResultCard>
                <ResultValue>{testData.significance}%</ResultValue>
                <ResultLabel>Statistical Significance</ResultLabel>
                <ResultChange positive={testData.significance >= 95}>
                  {testData.significance >= 95 ? <FaCheckCircle /> : <FaTimesCircle />}
                  {testData.significance >= 95 ? 'Significant' : 'Not significant'}
                </ResultChange>
              </ResultCard>
              
              <ResultCard>
                <ResultValue>{testData.variants.reduce((sum, v) => sum + v.sent, 0).toLocaleString()}</ResultValue>
                <ResultLabel>Total Emails Sent</ResultLabel>
              </ResultCard>
              
              <ResultCard>
                <ResultValue>{testData.variants.reduce((sum, v) => sum + v.opens, 0).toLocaleString()}</ResultValue>
                <ResultLabel>Total Opens</ResultLabel>
              </ResultCard>
            </ResultsGrid>
          </ResultsSection>
        )}

        <TestLayout>
          {testData.variants.map((variant, index) => (
            <VariantCard
              key={variant.id}
              isWinner={variant.id === testData.winner}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              custom={index}
            >
              <VariantHeader>
                <VariantTitle>
                  <FaBalanceScale />
                  {variant.name}
                  {variant.isControl && <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>(Control)</span>}
                </VariantTitle>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {variant.id === testData.winner && (
                    <WinnerBadge>
                      <FaTrophy />
                      Winner
                    </WinnerBadge>
                  )}
                  <VariantActions>
                    <VariantButton>
                      <FaEye />
                    </VariantButton>
                    <VariantButton>
                      <FaEdit />
                    </VariantButton>
                    <VariantButton>
                      <FaCopy />
                    </VariantButton>
                  </VariantActions>
                </div>
              </VariantHeader>
              
              <VariantContent>
                <VariantPreview>
                  <SubjectLine>{variant.subject}</SubjectLine>
                  <PreheaderText>{variant.preheader}</PreheaderText>
                  
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                    Traffic Split: {variant.traffic}%
                  </div>
                  <ProgressBar>
                    <ProgressFill 
                      percentage={variant.traffic} 
                      color={variant.id === testData.winner ? '#28a745' : 'var(--primary)'}
                    />
                  </ProgressBar>
                </VariantPreview>
                
                <VariantMetrics>
                  <MetricCard>
                    <MetricValue>{variant.openRate}%</MetricValue>
                    <MetricLabel>Open Rate</MetricLabel>
                  </MetricCard>
                  
                  <MetricCard>
                    <MetricValue>{variant.clickRate}%</MetricValue>
                    <MetricLabel>Click Rate</MetricLabel>
                  </MetricCard>
                  
                  <MetricCard>
                    <MetricValue>{variant.opens.toLocaleString()}</MetricValue>
                    <MetricLabel>Opens</MetricLabel>
                  </MetricCard>
                  
                  <MetricCard>
                    <MetricValue>{variant.clicks.toLocaleString()}</MetricValue>
                    <MetricLabel>Clicks</MetricLabel>
                  </MetricCard>
                </VariantMetrics>
              </VariantContent>
            </VariantCard>
          ))}
        </TestLayout>

        <TestConfigSection>
          <SectionTitle>
            <FaCog />
            Test Configuration
          </SectionTitle>
          
          <ConfigGrid>
            <ConfigItem>
              <ConfigLabel>Test Type</ConfigLabel>
              <ConfigSelect value={testData.testType}>
                <option value="subject_line">Subject Line</option>
                <option value="send_time">Send Time</option>
                <option value="content">Email Content</option>
                <option value="from_name">From Name</option>
              </ConfigSelect>
            </ConfigItem>
            
            <ConfigItem>
              <ConfigLabel>Sample Size</ConfigLabel>
              <ConfigInput 
                type="number" 
                value={testData.sampleSize}
                placeholder="1000"
              />
            </ConfigItem>
            
            <ConfigItem>
              <ConfigLabel>Confidence Level</ConfigLabel>
              <ConfigSelect value={testData.confidence}>
                <option value="90">90%</option>
                <option value="95">95%</option>
                <option value="99">99%</option>
              </ConfigSelect>
            </ConfigItem>
            
            <ConfigItem>
              <ConfigLabel>Test Duration</ConfigLabel>
              <ConfigSelect>
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">7 days</option>
                <option value="14">14 days</option>
              </ConfigSelect>
            </ConfigItem>
            
            <ConfigItem>
              <ConfigLabel>Winner Selection</ConfigLabel>
              <ConfigSelect>
                <option value="automatic">Automatic</option>
                <option value="manual">Manual</option>
              </ConfigSelect>
            </ConfigItem>
            
            <ConfigItem>
              <ConfigLabel>Success Metric</ConfigLabel>
              <ConfigSelect>
                <option value="open_rate">Open Rate</option>
                <option value="click_rate">Click Rate</option>
                <option value="conversion_rate">Conversion Rate</option>
              </ConfigSelect>
            </ConfigItem>
          </ConfigGrid>
        </TestConfigSection>
      </ABTestContainer>
    </>
  );
}

export default ABTestPage; 