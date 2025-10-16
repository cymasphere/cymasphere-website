"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaTimesCircle,
  FaCog,
  FaDatabase,
  FaCode,
  FaUsers,
  FaChartBar,
  FaPlay,
  FaSpinner,
} from "react-icons/fa";

const ValidatorContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const ValidatorHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ValidatorTitle = styled.h3`
  font-size: 1.3rem;
  margin: 0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const ValidateButton = styled(motion.button)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  svg {
    font-size: 0.9rem;
  }
`;

const ValidationResults = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
`;

const ValidationCard = styled(motion.div)<{ $status: 'success' | 'warning' | 'error' }>`
  background-color: ${props => {
    switch (props.$status) {
      case 'success': return 'rgba(16, 185, 129, 0.1)';
      case 'warning': return 'rgba(245, 158, 11, 0.1)';
      case 'error': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'success': return 'rgba(16, 185, 129, 0.3)';
      case 'warning': return 'rgba(245, 158, 11, 0.3)';
      case 'error': return 'rgba(239, 68, 68, 0.3)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
  border-radius: 8px;
  padding: 1rem;
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
`;

const CardIcon = styled.div<{ $status: 'success' | 'warning' | 'error' }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$status) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: white;
  font-size: 1rem;
`;

const CardTitle = styled.h4`
  font-size: 1rem;
  margin: 0;
  color: var(--text);
`;

const CardContent = styled.div`
  color: var(--text-secondary);
  font-size: 0.9rem;
  line-height: 1.4;
`;

const ValidationList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0.5rem 0 0 0;
`;

const ValidationItem = styled.li<{ $status: 'success' | 'warning' | 'error' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-size: 0.85rem;
  color: ${props => {
    switch (props.$status) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return 'var(--text-secondary)';
    }
  }};

  svg {
    font-size: 0.8rem;
  }
`;

const Summary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
`;

const SummaryStats = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  color: var(--text-secondary);
  font-size: 0.9rem;
`;

const StatItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const OverallStatus = styled.div<{ $status: 'success' | 'warning' | 'error' }>`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${props => {
    switch (props.$status) {
      case 'success': return '#10b981';
      case 'warning': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return 'var(--text)';
    }
  }};
`;

interface ValidationResult {
  category: string;
  status: 'success' | 'warning' | 'error';
  message: string;
  details: string[];
  icon: React.ReactNode;
}

interface SystemValidatorProps {
  className?: string;
}

export default function SystemValidator({ className }: SystemValidatorProps) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [overallStatus, setOverallStatus] = useState<'success' | 'warning' | 'error'>('success');

  const runValidation = async () => {
    setIsValidating(true);
    const results: ValidationResult[] = [];

    // Database Validation
    try {
      const dbResponse = await fetch('/api/tutorials/playlists');
      const dbData = await dbResponse.json();
      
      const dbDetails = [];
      if (dbData.playlists) {
        dbDetails.push(`✓ Found ${dbData.playlists.length} playlists`);
        const totalVideos = dbData.playlists.reduce((sum: number, p: any) => sum + (p.videos?.length || 0), 0);
        dbDetails.push(`✓ Found ${totalVideos} videos across all playlists`);
      } else {
        dbDetails.push('⚠ No playlists found');
      }

      results.push({
        category: 'Database Connectivity',
        status: dbResponse.ok ? 'success' : 'error',
        message: dbResponse.ok ? 'Database connection successful' : 'Database connection failed',
        details: dbDetails,
        icon: <FaDatabase />
      });
    } catch (error) {
      results.push({
        category: 'Database Connectivity',
        status: 'error',
        message: 'Database connection error',
        details: ['✗ Failed to connect to database', '✗ Check Supabase configuration'],
        icon: <FaDatabase />
      });
    }

    // API Validation
    try {
      const apiTests = [
        { name: 'Playlists API', url: '/api/tutorials/playlists', method: 'GET' },
        { name: 'Generate Playlist API', url: '/api/tutorials/generate-playlist', method: 'POST' },
        { name: 'Progress API', url: '/api/tutorials/progress?userId=900f11b8-c901-49fd-bfab-5fafe984ce72', method: 'GET' },
        { name: 'Script API', url: '/api/tutorials/videos/0fc2b2e5-97e3-4b8a-b7f3-2cb3c71fc54a/script', method: 'GET' }
      ];

      const apiDetails = [];
      let apiSuccessCount = 0;

      for (const test of apiTests) {
        try {
          const response = await fetch(test.url, {
            method: test.method,
            headers: test.method === 'POST' ? { 'Content-Type': 'application/json' } : {},
            body: test.method === 'POST' ? JSON.stringify({
              theoryLevel: 'beginner',
              techLevel: 'new_to_daws',
              appMode: 'standalone',
              musicalGoals: ['composition']
            }) : undefined
          });
          
          if (response.ok) {
            apiDetails.push(`✓ ${test.name} working`);
            apiSuccessCount++;
          } else {
            apiDetails.push(`⚠ ${test.name} returned ${response.status}`);
          }
        } catch (error) {
          apiDetails.push(`✗ ${test.name} failed`);
        }
      }

      results.push({
        category: 'API Endpoints',
        status: apiSuccessCount === apiTests.length ? 'success' : apiSuccessCount > 0 ? 'warning' : 'error',
        message: `${apiSuccessCount}/${apiTests.length} API endpoints working`,
        details: apiDetails,
        icon: <FaCode />
      });
    } catch (error) {
      results.push({
        category: 'API Endpoints',
        status: 'error',
        message: 'API validation failed',
        details: ['✗ Failed to validate API endpoints'],
        icon: <FaCode />
      });
    }

    // Content Validation
    try {
      const contentResponse = await fetch('/api/tutorials/playlists');
      const contentData = await contentResponse.json();
      
      const contentDetails = [];
      let contentScore = 0;

      if (contentData.playlists) {
        contentDetails.push(`✓ ${contentData.playlists.length} playlists available`);
        contentScore++;
      }

      const totalVideos = contentData.playlists?.reduce((sum: number, p: any) => sum + (p.videos?.length || 0), 0) || 0;
      if (totalVideos > 0) {
        contentDetails.push(`✓ ${totalVideos} videos cataloged`);
        contentScore++;
      }

      // Check for scripts
      try {
        const scriptResponse = await fetch('/api/tutorials/videos/0fc2b2e5-97e3-4b8a-b7f3-2cb3c71fc54a/script');
        if (scriptResponse.ok) {
          contentDetails.push('✓ Video scripts available');
          contentScore++;
        } else {
          contentDetails.push('⚠ Some videos missing scripts');
        }
      } catch (error) {
        contentDetails.push('⚠ Script validation failed');
      }

      results.push({
        category: 'Content Library',
        status: contentScore >= 2 ? 'success' : contentScore >= 1 ? 'warning' : 'error',
        message: contentScore >= 2 ? 'Content library complete' : 'Content library needs attention',
        details: contentDetails,
        icon: <FaUsers />
      });
    } catch (error) {
      results.push({
        category: 'Content Library',
        status: 'error',
        message: 'Content validation failed',
        details: ['✗ Failed to validate content'],
        icon: <FaUsers />
      });
    }

    // User Experience Validation
    try {
      const uxDetails = [];
      let uxScore = 0;

      // Test playlist generation
      try {
        const genResponse = await fetch('/api/tutorials/generate-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            theoryLevel: 'beginner',
            techLevel: 'new_to_daws',
            appMode: 'standalone',
            musicalGoals: ['composition']
          })
        });
        
        if (genResponse.ok) {
          uxDetails.push('✓ Playlist generation working');
          uxScore++;
        } else {
          uxDetails.push('⚠ Playlist generation issues');
        }
      } catch (error) {
        uxDetails.push('✗ Playlist generation failed');
      }

      // Test different user profiles
      const testProfiles = [
        { theoryLevel: 'advanced', techLevel: 'expert', appMode: 'plugin', musicalGoals: ['sound_design'] },
        { theoryLevel: 'intermediate', techLevel: 'familiar', appMode: 'both', musicalGoals: ['composition', 'learning_theory'] }
      ];

      let profileSuccessCount = 0;
      for (const profile of testProfiles) {
        try {
          const response = await fetch('/api/tutorials/generate-playlist', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(profile)
          });
          if (response.ok) profileSuccessCount++;
        } catch (error) {
          // Profile test failed
        }
      }

      if (profileSuccessCount === testProfiles.length) {
        uxDetails.push('✓ All user profiles supported');
        uxScore++;
      } else {
        uxDetails.push(`⚠ ${profileSuccessCount}/${testProfiles.length} profiles working`);
      }

      results.push({
        category: 'User Experience',
        status: uxScore >= 2 ? 'success' : uxScore >= 1 ? 'warning' : 'error',
        message: uxScore >= 2 ? 'User experience optimal' : 'User experience needs improvement',
        details: uxDetails,
        icon: <FaChartBar />
      });
    } catch (error) {
      results.push({
        category: 'User Experience',
        status: 'error',
        message: 'User experience validation failed',
        details: ['✗ Failed to validate user experience'],
        icon: <FaChartBar />
      });
    }

    setValidationResults(results);

    // Calculate overall status
    const errorCount = results.filter(r => r.status === 'error').length;
    const warningCount = results.filter(r => r.status === 'warning').length;
    
    if (errorCount > 0) {
      setOverallStatus('error');
    } else if (warningCount > 0) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('success');
    }

    setIsValidating(false);
  };

  return (
    <ValidatorContainer className={className}>
      <ValidatorHeader>
        <ValidatorTitle>
          <FaCog />
          System Validation
        </ValidatorTitle>
        <ValidateButton
          onClick={runValidation}
          disabled={isValidating}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isValidating ? <FaSpinner /> : <FaPlay />}
          {isValidating ? 'Validating...' : 'Run Validation'}
        </ValidateButton>
      </ValidatorHeader>

      {validationResults.length > 0 && (
        <>
          <ValidationResults>
            {validationResults.map((result, index) => (
              <ValidationCard
                key={index}
                $status={result.status}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardHeader>
                  <CardIcon $status={result.status}>
                    {result.status === 'success' ? <FaCheckCircle /> :
                     result.status === 'warning' ? <FaExclamationTriangle /> :
                     <FaTimesCircle />}
                  </CardIcon>
                  <CardTitle>{result.category}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ marginBottom: '0.5rem' }}>{result.message}</div>
                  <ValidationList>
                    {result.details.map((detail, i) => (
                      <ValidationItem
                        key={i}
                        $status={detail.startsWith('✓') ? 'success' : 
                                detail.startsWith('⚠') ? 'warning' : 'error'}
                      >
                        {detail.startsWith('✓') ? <FaCheckCircle /> :
                         detail.startsWith('⚠') ? <FaExclamationTriangle /> :
                         <FaTimesCircle />}
                        {detail}
                      </ValidationItem>
                    ))}
                  </ValidationList>
                </CardContent>
              </ValidationCard>
            ))}
          </ValidationResults>

          <Summary>
            <SummaryStats>
              <StatItem>
                <FaCheckCircle />
                {validationResults.filter(r => r.status === 'success').length} passed
              </StatItem>
              <StatItem>
                <FaExclamationTriangle />
                {validationResults.filter(r => r.status === 'warning').length} warnings
              </StatItem>
              <StatItem>
                <FaTimesCircle />
                {validationResults.filter(r => r.status === 'error').length} errors
              </StatItem>
            </SummaryStats>
            <OverallStatus $status={overallStatus}>
              {overallStatus === 'success' ? 'System Ready!' :
               overallStatus === 'warning' ? 'System Needs Attention' :
               'System Has Issues'}
            </OverallStatus>
          </Summary>
        </>
      )}
    </ValidatorContainer>
  );
}
