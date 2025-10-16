"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaCheck,
  FaTimes,
  FaSpinner,
  FaBug,
  FaCog,
  FaPlay,
  FaUser,
  FaChartLine,
} from "react-icons/fa";

const TesterContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const TesterHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const TesterTitle = styled.h3`
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

const TestButton = styled(motion.button)`
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

const TestResults = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const TestCategory = styled.div`
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const CategoryTitle = styled.h4`
  font-size: 1rem;
  margin: 0 0 0.75rem 0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const TestList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const TestItem = styled(motion.div)<{ $status: 'pending' | 'running' | 'passed' | 'failed' }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 6px;
  background-color: ${props => {
    switch (props.$status) {
      case 'passed': return 'rgba(16, 185, 129, 0.1)';
      case 'failed': return 'rgba(239, 68, 68, 0.1)';
      case 'running': return 'rgba(59, 130, 246, 0.1)';
      default: return 'rgba(255, 255, 255, 0.02)';
    }
  }};
  border: 1px solid ${props => {
    switch (props.$status) {
      case 'passed': return 'rgba(16, 185, 129, 0.3)';
      case 'failed': return 'rgba(239, 68, 68, 0.3)';
      case 'running': return 'rgba(59, 130, 246, 0.3)';
      default: return 'rgba(255, 255, 255, 0.05)';
    }
  }};
`;

const TestIcon = styled.div<{ $status: 'pending' | 'running' | 'passed' | 'failed' }>`
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${props => {
    switch (props.$status) {
      case 'passed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'running': return '#3b82f6';
      default: return 'rgba(255, 255, 255, 0.1)';
    }
  }};
  color: white;
  font-size: 0.7rem;

  svg {
    animation: ${props => props.$status === 'running' ? 'spin 1s linear infinite' : 'none'};
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const TestName = styled.span`
  flex: 1;
  font-size: 0.9rem;
  color: var(--text);
`;

const TestDetails = styled.div`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
`;

const Summary = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding-top: 1rem;
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

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  details?: string;
  duration?: number;
}

interface SystemTesterProps {
  className?: string;
}

export default function SystemTester({ className }: SystemTesterProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<{ [category: string]: TestResult[] }>({});
  const [summary, setSummary] = useState({ total: 0, passed: 0, failed: 0 });

  // Test functions - defined before they are used
  const testSupabaseConnection = async () => {
    try {
      const response = await fetch('/api/tutorials/playlists');
      return { success: response.ok, message: response.ok ? 'Connected successfully' : 'Connection failed' };
    } catch (error) {
      return { success: false, message: 'Connection error' };
    }
  };

  const testPlaylistFetch = async () => {
    try {
      const response = await fetch('/api/tutorials/playlists');
      const data = await response.json();
      return { 
        success: data.playlists && data.playlists.length > 0, 
        message: `Found ${data.playlists?.length || 0} playlists` 
      };
    } catch (error) {
      return { success: false, message: 'Failed to fetch playlists' };
    }
  };

  const testVideoFetch = async () => {
    try {
      const response = await fetch('/api/tutorials/playlists');
      const data = await response.json();
      const totalVideos = data.playlists?.reduce((sum: number, p: any) => sum + (p.videos?.length || 0), 0) || 0;
      return { 
        success: totalVideos > 0, 
        message: `Found ${totalVideos} videos across all playlists` 
      };
    } catch (error) {
      return { success: false, message: 'Failed to fetch videos' };
    }
  };

  const testScriptFetch = async () => {
    try {
      // Test with a known video ID
      const response = await fetch('/api/tutorials/videos/0fc2b2e5-97e3-4b8a-b7f3-2cb3c71fc54a/script');
      const data = await response.json();
      return { 
        success: data.script && data.script.script_content, 
        message: data.script ? 'Script found' : 'No script found' 
      };
    } catch (error) {
      return { success: false, message: 'Failed to fetch script' };
    }
  };

  const testProfileGeneration = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'beginner',
          techLevel: 'new_to_daws',
          appMode: 'standalone',
          musicalGoals: ['composition']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos, 
        message: `Generated playlist with ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Failed to generate playlist' };
    }
  };

  const testPlaylistFiltering = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'advanced',
          techLevel: 'expert',
          appMode: 'plugin',
          musicalGoals: ['sound_design']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos, 
        message: `Filtered playlist with ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Failed to filter playlist' };
    }
  };

  const testConditionalLogic = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'intermediate',
          techLevel: 'familiar',
          appMode: 'both',
          musicalGoals: ['composition', 'learning_theory']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos, 
        message: `Conditional logic working with ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Failed conditional logic test' };
    }
  };

  const testPlaylistsAPI = async () => {
    try {
      const response = await fetch('/api/tutorials/playlists');
      return { success: response.ok, message: response.ok ? 'API working' : 'API failed' };
    } catch (error) {
      return { success: false, message: 'API error' };
    }
  };

  const testGeneratePlaylistAPI = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'beginner',
          techLevel: 'new_to_daws',
          appMode: 'standalone',
          musicalGoals: ['composition']
        })
      });
      return { success: response.ok, message: response.ok ? 'API working' : 'API failed' };
    } catch (error) {
      return { success: false, message: 'API error' };
    }
  };

  const testProgressAPI = async () => {
    try {
      const response = await fetch('/api/tutorials/progress?userId=900f11b8-c901-49fd-bfab-5fafe984ce72');
      return { success: response.ok, message: response.ok ? 'API working' : 'API failed' };
    } catch (error) {
      return { success: false, message: 'API error' };
    }
  };

  const testScriptAPI = async () => {
    try {
      const response = await fetch('/api/tutorials/videos/0fc2b2e5-97e3-4b8a-b7f3-2cb3c71fc54a/script');
      return { success: response.ok, message: response.ok ? 'API working' : 'API failed' };
    } catch (error) {
      return { success: false, message: 'API error' };
    }
  };

  const testBeginnerStandalonePath = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'beginner',
          techLevel: 'new_to_daws',
          appMode: 'standalone',
          musicalGoals: ['composition', 'learning_theory']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos.length > 0, 
        message: `Beginner path: ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Beginner path failed' };
    }
  };

  const testIntermediatePluginPath = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'intermediate',
          techLevel: 'familiar',
          appMode: 'plugin',
          musicalGoals: ['composition']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos.length > 0, 
        message: `Intermediate path: ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Intermediate path failed' };
    }
  };

  const testAdvancedBothPath = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'advanced',
          techLevel: 'expert',
          appMode: 'both',
          musicalGoals: ['composition', 'sound_design']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos.length > 0, 
        message: `Advanced path: ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Advanced path failed' };
    }
  };

  const testTheoryLearningPath = async () => {
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          theoryLevel: 'beginner',
          techLevel: 'new_to_daws',
          appMode: 'both',
          musicalGoals: ['learning_theory']
        })
      });
      const data = await response.json();
      return { 
        success: data.playlist && data.playlist.videos.length > 0, 
        message: `Theory path: ${data.playlist?.videos?.length || 0} videos` 
      };
    } catch (error) {
      return { success: false, message: 'Theory path failed' };
    }
  };

  const testCategories = [
    {
      name: 'Database Connectivity',
      tests: [
        { name: 'Supabase Connection', test: testSupabaseConnection },
        { name: 'Playlist Fetch', test: testPlaylistFetch },
        { name: 'Video Fetch', test: testVideoFetch },
        { name: 'Script Fetch', test: testScriptFetch },
      ]
    },
    {
      name: 'User Profiling',
      tests: [
        { name: 'Profile Generation', test: testProfileGeneration },
        { name: 'Playlist Filtering', test: testPlaylistFiltering },
        { name: 'Conditional Logic', test: testConditionalLogic },
      ]
    },
    {
      name: 'API Endpoints',
      tests: [
        { name: 'Playlists API', test: testPlaylistsAPI },
        { name: 'Generate Playlist API', test: testGeneratePlaylistAPI },
        { name: 'Progress API', test: testProgressAPI },
        { name: 'Script API', test: testScriptAPI },
      ]
    },
    {
      name: 'User Paths',
      tests: [
        { name: 'Beginner Standalone Path', test: testBeginnerStandalonePath },
        { name: 'Intermediate Plugin Path', test: testIntermediatePluginPath },
        { name: 'Advanced Both Path', test: testAdvancedBothPath },
        { name: 'Theory Learning Path', test: testTheoryLearningPath },
      ]
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    const results: { [category: string]: TestResult[] } = {};

    for (const category of testCategories) {
      results[category.name] = category.tests.map(test => ({
        name: test.name,
        status: 'pending' as const
      }));

      setTestResults({ ...results });

      for (let i = 0; i < category.tests.length; i++) {
        const test = category.tests[i];
        const startTime = Date.now();

        // Update status to running
        results[category.name][i].status = 'running';
        setTestResults({ ...results });

        try {
          const result = await test.test();
          const duration = Date.now() - startTime;
          
          results[category.name][i] = {
            name: test.name,
            status: result.success ? 'passed' : 'failed',
            details: result.message,
            duration
          };
        } catch (error) {
          const duration = Date.now() - startTime;
          results[category.name][i] = {
            name: test.name,
            status: 'failed',
            details: error instanceof Error ? error.message : 'Unknown error',
            duration
          };
        }

        setTestResults({ ...results });
        
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Calculate summary
    const allTests = Object.values(results).flat();
    const summary = {
      total: allTests.length,
      passed: allTests.filter(t => t.status === 'passed').length,
      failed: allTests.filter(t => t.status === 'failed').length
    };

    setSummary(summary);
    setIsRunning(false);
  };

  return (
    <TesterContainer className={className}>
      <TesterHeader>
        <TesterTitle>
          <FaBug />
          System Testing
        </TesterTitle>
        <TestButton
          onClick={runAllTests}
          disabled={isRunning}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {isRunning ? <FaSpinner /> : <FaPlay />}
          {isRunning ? 'Running Tests...' : 'Run All Tests'}
        </TestButton>
      </TesterHeader>

      {Object.keys(testResults).length > 0 && (
        <TestResults>
          {testCategories.map(category => (
            <TestCategory key={category.name}>
              <CategoryTitle>
                <FaCog />
                {category.name}
              </CategoryTitle>
              <TestList>
                {testResults[category.name]?.map((test, index) => (
                  <TestItem
                    key={index}
                    $status={test.status}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TestIcon $status={test.status}>
                      {test.status === 'pending' && <FaCog />}
                      {test.status === 'running' && <FaSpinner />}
                      {test.status === 'passed' && <FaCheck />}
                      {test.status === 'failed' && <FaTimes />}
                    </TestIcon>
                    <div>
                      <TestName>{test.name}</TestName>
                      {test.details && (
                        <TestDetails>{test.details}</TestDetails>
                      )}
                    </div>
                  </TestItem>
                ))}
              </TestList>
            </TestCategory>
          ))}
        </TestResults>
      )}

      {summary.total > 0 && (
        <Summary>
          <SummaryStats>
            <StatItem>
              <FaChartLine />
              {summary.total} tests
            </StatItem>
            <StatItem>
              <FaCheck />
              {summary.passed} passed
            </StatItem>
            <StatItem>
              <FaTimes />
              {summary.failed} failed
            </StatItem>
          </SummaryStats>
          <div style={{ 
            color: summary.failed === 0 ? '#10b981' : '#ef4444',
            fontWeight: '600'
          }}>
            {summary.failed === 0 ? 'All tests passed!' : `${summary.failed} tests failed`}
          </div>
        </Summary>
      )}
    </TesterContainer>
  );
}
