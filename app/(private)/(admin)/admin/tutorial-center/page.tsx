"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaVideo,
  FaList,
  FaClock,
  FaEye,
  FaSearch,
  FaFilter,
  FaSort,
  FaUser,
  FaCog,
  FaMusic,
  FaDesktop,
  FaPlug,
  FaCheck,
  FaArrowRight,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";
import ProgressTracker from "./components/ProgressTracker";
import SystemTester from "./components/SystemTester";
import SystemValidator from "./components/SystemValidator";
import AnalyticsDashboard from "./components/AnalyticsDashboard";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};


const Container = styled.div`
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;

  @media (max-width: 768px) {
    padding: 20px 15px;
  }
`;

const Header = styled.div`
  margin-bottom: 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const Title = styled.h1`
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--text);
  margin: 0;
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

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: var(--text-secondary);
  margin: 0.5rem 0 0 0;
  line-height: 1.6;
`;

// User Profiling Form Components
const ProfilingForm = styled(motion.div)`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 2rem;
`;

const FormTitle = styled.h2`
  font-size: 1.8rem;
  margin-bottom: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.75rem;

  svg {
    color: var(--primary);
  }
`;

const FormDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  margin-bottom: 2rem;
  line-height: 1.5;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionTitle = styled.h3`
  font-size: 1.2rem;
  margin-bottom: 1rem;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
    font-size: 1rem;
  }
`;

const OptionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
`;

const OptionCard = styled(motion.div)<{ $selected: boolean }>`
  background-color: ${props => props.$selected ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${props => props.$selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--primary);
    transform: translateY(-2px);
  }

  ${props => props.$selected && `
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.2);
  `}
`;

const OptionTitle = styled.h4`
  font-size: 1rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
    font-size: 0.9rem;
  }
`;

const OptionDescription = styled.p`
  font-size: 0.85rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
`;

const CheckboxGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
`;

const CheckboxCard = styled(motion.div)<{ $selected: boolean }>`
  background-color: ${props => props.$selected ? 'rgba(108, 99, 255, 0.1)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${props => props.$selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.1)'};
  border-radius: 8px;
  padding: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.75rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: var(--primary);
  }

  ${props => props.$selected && `
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.2);
  `}
`;

const CheckboxIcon = styled.div<{ $selected: boolean }>`
  width: 20px;
  height: 20px;
  border: 2px solid ${props => props.$selected ? 'var(--primary)' : 'rgba(255, 255, 255, 0.3)'};
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.$selected ? 'var(--primary)' : 'transparent'};
  transition: all 0.3s ease;

  svg {
    color: white;
    font-size: 0.8rem;
    opacity: ${props => props.$selected ? 1 : 0};
  }
`;

const CheckboxContent = styled.div`
  flex: 1;
`;

const CheckboxTitle = styled.h4`
  font-size: 0.95rem;
  margin: 0 0 0.25rem 0;
  color: var(--text);
`;

const CheckboxDescription = styled.p`
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.3;
`;

const FormActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const GenerateButton = styled.button`
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

const ResetButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--card-bg);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--text-secondary);
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    color: var(--text);
    border-color: var(--primary);
  }

  svg {
    font-size: 0.9rem;
  }
`;

const ViewAllButton = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--primary);
  color: white;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: all 0.2s ease;
  border: none;
  cursor: pointer;

  &:hover {
    background-color: rgba(108, 99, 255, 0.9);
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(108, 99, 255, 0.3);
  }

  svg {
    font-size: 0.8rem;
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
  }
`;

const ProfileStatus = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1rem;
  padding: 1rem;
  background-color: rgba(108, 99, 255, 0.05);
  border: 1px solid rgba(108, 99, 255, 0.2);
  border-radius: 8px;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const ProfileInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ProfileLabel = styled.span`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--primary);
`;

const ProfileDetails = styled.span`
  font-size: 0.85rem;
  color: var(--text-secondary);
`;

const EditProfileButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--text);
  padding: 0.5rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.85rem;
  font-weight: 500;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    border-color: var(--primary);
    color: var(--primary);
  }

  svg {
    font-size: 0.8rem;
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
  gap: 1rem;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;


export default function TutorialCenter() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  
  // User profiling state
  const [showProfilingForm, setShowProfilingForm] = useState(false);
  const [userProfile, setUserProfile] = useState({
    theoryLevel: '',
    techLevel: '',
    appMode: '',
    musicalGoals: [] as string[],
    priorExperience: ''
  });
  const [generatedPlaylist, setGeneratedPlaylist] = useState<any>(null);
  const [hasExistingProfile, setHasExistingProfile] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);

  // Check for existing user profile on load
  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/tutorials/user-profile?userId=${user?.id}`);
      if (response.ok) {
        const profileData = await response.json();
        if (profileData.profile) {
          setUserProfile(profileData.profile);
          setHasExistingProfile(true);
          // Auto-generate playlist for existing profile
          generatePlaylistFromProfile(profileData.profile);
        } else {
          setShowProfilingForm(true);
        }
      } else {
        setShowProfilingForm(true);
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      setShowProfilingForm(true);
    } finally {
      setProfileLoading(false);
    }
  };

  const generatePlaylistFromProfile = async (profile: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        setGeneratedPlaylist(data.playlist);
      }
    } catch (error) {
      console.error('Failed to generate playlist:', error);
    } finally {
      setLoading(false);
    }
  };

  // Profiling form handlers
  const handleTheoryLevelSelect = (level: string) => {
    setUserProfile(prev => ({ ...prev, theoryLevel: level }));
  };

  const handleTechLevelSelect = (level: string) => {
    setUserProfile(prev => ({ ...prev, techLevel: level }));
  };

  const handleAppModeSelect = (mode: string) => {
    setUserProfile(prev => ({ ...prev, appMode: mode }));
  };

  const handleMusicalGoalToggle = (goal: string) => {
    setUserProfile(prev => ({
      ...prev,
      musicalGoals: prev.musicalGoals.includes(goal)
        ? prev.musicalGoals.filter(g => g !== goal)
        : [...prev.musicalGoals, goal]
    }));
  };

  const handlePriorExperienceSelect = (experience: string) => {
    setUserProfile(prev => ({ ...prev, priorExperience: experience }));
  };

  const handleResetProfile = () => {
    setUserProfile({
      theoryLevel: '',
      techLevel: '',
      appMode: '',
      musicalGoals: [],
      priorExperience: ''
    });
    setGeneratedPlaylist(null);
    setShowProfilingForm(true);
  };

  const isProfileComplete = userProfile.theoryLevel && userProfile.techLevel && userProfile.appMode && userProfile.musicalGoals.length > 0;

  const handleGeneratePlaylist = async () => {
    setLoading(true);
    try {
      // Use default values if user profile is not complete
      const profileData = {
        theoryLevel: userProfile.theoryLevel || 'beginner',
        techLevel: userProfile.techLevel || 'new_to_daws',
        appMode: userProfile.appMode || 'standalone',
        musicalGoals: userProfile.musicalGoals.length > 0 ? userProfile.musicalGoals : ['composition'],
        priorExperience: userProfile.priorExperience || 'none'
      };

      // Save user profile to database
      const profileResponse = await fetch('/api/tutorials/user-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.id,
          profile: profileData
        }),
      });

      if (!profileResponse.ok) {
        console.error('Failed to save user profile');
      }

      // Generate playlist
      const response = await fetch('/api/tutorials/generate-playlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate playlist`);
      }

      const data = await response.json();
      setGeneratedPlaylist(data.playlist);
      setShowProfilingForm(false);
      setHasExistingProfile(true);
    } catch (error) {
      console.error("Failed to generate playlist:", error);
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      // Fallback to mock data if API fails
      const profileData = {
        theoryLevel: userProfile.theoryLevel || 'beginner',
        techLevel: userProfile.techLevel || 'new_to_daws',
        appMode: userProfile.appMode || 'standalone',
        musicalGoals: userProfile.musicalGoals.length > 0 ? userProfile.musicalGoals : ['composition'],
        priorExperience: userProfile.priorExperience || 'none'
      };

      const mockGeneratedPlaylist = {
        id: "generated-1",
        title: `Personalized Learning Path - ${profileData.theoryLevel} ${profileData.appMode}`,
        description: `Custom playlist generated for ${profileData.theoryLevel} theory level, ${profileData.techLevel} technical proficiency, using ${profileData.appMode} mode, focused on ${profileData.musicalGoals.join(', ')}. Note: This is a demo playlist as the API encountered an error: ${errorMessage}`,
        videoCount: 15,
        totalDuration: "2h 30m",
        views: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isGenerated: true,
        userProfile: profileData,
        isDemo: true
      };
      setGeneratedPlaylist(mockGeneratedPlaylist);
      setShowProfilingForm(false);
      setHasExistingProfile(true);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (profileLoading) {
    return (
      <Container>
        <LoadingContainer>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--primary)', borderTop: '3px solid transparent', animation: 'spin 1s linear infinite' }} />
          Loading your profile...
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <motion.div initial="hidden" animate="visible" variants={fadeIn}>
        <Header>
          <div>
            <Title>
              <FaPlay />
              Tutorial Center
            </Title>
            <Subtitle>
              Comprehensive learning platform for Cymasphere with personalized learning paths
            </Subtitle>
            {hasExistingProfile && !showProfilingForm && (
              <ProfileStatus>
                <ProfileInfo>
                  <ProfileLabel>Your Profile:</ProfileLabel>
                  <ProfileDetails>
                    {userProfile.theoryLevel} • {userProfile.techLevel.replace('_', ' ')} • {userProfile.appMode} • {userProfile.musicalGoals.join(', ')}
                  </ProfileDetails>
                </ProfileInfo>
                <EditProfileButton onClick={() => setShowProfilingForm(true)}>
                  <FaCog />
                  Edit Profile
                </EditProfileButton>
              </ProfileStatus>
            )}
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <ViewAllButton as={Link} href="/admin/tutorial-center/playlists">
              <FaList />
              View All Playlists
            </ViewAllButton>
            <ViewAllButton as={Link} href="/admin/tutorial-center/videos">
              <FaVideo />
              View All Videos
            </ViewAllButton>
          </div>
        </Header>

        {showProfilingForm && (
          <ProfilingForm variants={fadeIn}>
            <FormTitle>
              <FaUser />
              Personalize Your Learning Path
            </FormTitle>
            <FormDescription>
              Tell us about your background so we can create a customized tutorial playlist that matches your skill level and goals.
            </FormDescription>

            <FormSection>
              <SectionTitle>
                <FaMusic />
                Music Theory Knowledge
              </SectionTitle>
              <OptionGrid>
                <OptionCard
                  $selected={userProfile.theoryLevel === 'beginner'}
                  onClick={() => handleTheoryLevelSelect('beginner')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaMusic />
                    Beginner
                  </OptionTitle>
                  <OptionDescription>
                    New to music theory. Need to learn scales, intervals, and basic harmony concepts.
                  </OptionDescription>
                </OptionCard>
                <OptionCard
                  $selected={userProfile.theoryLevel === 'intermediate'}
                  onClick={() => handleTheoryLevelSelect('intermediate')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaMusic />
                    Intermediate
                  </OptionTitle>
                  <OptionDescription>
                    Understand basic theory. Familiar with scales, chords, and some advanced concepts.
                  </OptionDescription>
                </OptionCard>
                <OptionCard
                  $selected={userProfile.theoryLevel === 'advanced'}
                  onClick={() => handleTheoryLevelSelect('advanced')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaMusic />
                    Advanced
                  </OptionTitle>
                  <OptionDescription>
                    Strong theory background. Understand complex harmony, voice leading, and advanced concepts.
                  </OptionDescription>
                </OptionCard>
              </OptionGrid>
            </FormSection>

            <FormSection>
              <SectionTitle>
                <FaCog />
                Technical Proficiency
              </SectionTitle>
              <OptionGrid>
                <OptionCard
                  $selected={userProfile.techLevel === 'new_to_daws'}
                  onClick={() => handleTechLevelSelect('new_to_daws')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaCog />
                    New to DAWs
                  </OptionTitle>
                  <OptionDescription>
                    First time using digital audio workstations. Need basic computer and audio concepts explained.
                  </OptionDescription>
                </OptionCard>
                <OptionCard
                  $selected={userProfile.techLevel === 'familiar'}
                  onClick={() => handleTechLevelSelect('familiar')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaCog />
                    Familiar
                  </OptionTitle>
                  <OptionDescription>
                    Used DAWs before. Understand MIDI, audio routing, and basic production concepts.
                  </OptionDescription>
                </OptionCard>
                <OptionCard
                  $selected={userProfile.techLevel === 'expert'}
                  onClick={() => handleTechLevelSelect('expert')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaCog />
                    Expert
                  </OptionTitle>
                  <OptionDescription>
                    Experienced with DAWs and music production. Focus on advanced features and workflow optimization.
                  </OptionDescription>
                </OptionCard>
              </OptionGrid>
            </FormSection>

            <FormSection>
              <SectionTitle>
                <FaDesktop />
                How will you use Cymasphere?
              </SectionTitle>
              <OptionGrid>
                <OptionCard
                  $selected={userProfile.appMode === 'standalone'}
                  onClick={() => handleAppModeSelect('standalone')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaDesktop />
                    Standalone App
                  </OptionTitle>
                  <OptionDescription>
                    Use Cymasphere as a standalone application for composition and learning.
                  </OptionDescription>
                </OptionCard>
                <OptionCard
                  $selected={userProfile.appMode === 'plugin'}
                  onClick={() => handleAppModeSelect('plugin')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaPlug />
                    Plugin in DAW
                  </OptionTitle>
                  <OptionDescription>
                    Use Cymasphere as a VST3/AU plugin within your existing DAW workflow.
                  </OptionDescription>
                </OptionCard>
                <OptionCard
                  $selected={userProfile.appMode === 'both'}
                  onClick={() => handleAppModeSelect('both')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <OptionTitle>
                    <FaDesktop />
                    Both Modes
                  </OptionTitle>
                  <OptionDescription>
                    Use Cymasphere in both standalone and plugin modes depending on the project.
                  </OptionDescription>
                </OptionCard>
              </OptionGrid>
            </FormSection>

            <FormSection>
              <SectionTitle>
                <FaMusic />
                Musical Goals (Select all that apply)
              </SectionTitle>
              <CheckboxGrid>
                <CheckboxCard
                  $selected={userProfile.musicalGoals.includes('composition')}
                  onClick={() => handleMusicalGoalToggle('composition')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <CheckboxIcon $selected={userProfile.musicalGoals.includes('composition')}>
                    <FaCheck />
                  </CheckboxIcon>
                  <CheckboxContent>
                    <CheckboxTitle>Composition</CheckboxTitle>
                    <CheckboxDescription>Create original music and arrangements</CheckboxDescription>
                  </CheckboxContent>
                </CheckboxCard>
                <CheckboxCard
                  $selected={userProfile.musicalGoals.includes('learning_theory')}
                  onClick={() => handleMusicalGoalToggle('learning_theory')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <CheckboxIcon $selected={userProfile.musicalGoals.includes('learning_theory')}>
                    <FaCheck />
                  </CheckboxIcon>
                  <CheckboxContent>
                    <CheckboxTitle>Learning Theory</CheckboxTitle>
                    <CheckboxDescription>Study music theory and harmony concepts</CheckboxDescription>
                  </CheckboxContent>
                </CheckboxCard>
                <CheckboxCard
                  $selected={userProfile.musicalGoals.includes('sound_design')}
                  onClick={() => handleMusicalGoalToggle('sound_design')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <CheckboxIcon $selected={userProfile.musicalGoals.includes('sound_design')}>
                    <FaCheck />
                  </CheckboxIcon>
                  <CheckboxContent>
                    <CheckboxTitle>Sound Design</CheckboxTitle>
                    <CheckboxDescription>Create and manipulate sounds and textures</CheckboxDescription>
                  </CheckboxContent>
                </CheckboxCard>
                <CheckboxCard
                  $selected={userProfile.musicalGoals.includes('live_performance')}
                  onClick={() => handleMusicalGoalToggle('live_performance')}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  <CheckboxIcon $selected={userProfile.musicalGoals.includes('live_performance')}>
                    <FaCheck />
                  </CheckboxIcon>
                  <CheckboxContent>
                    <CheckboxTitle>Live Performance</CheckboxTitle>
                    <CheckboxDescription>Use Cymasphere in live performance settings</CheckboxDescription>
                  </CheckboxContent>
                </CheckboxCard>
              </CheckboxGrid>
            </FormSection>

            <FormActions>
              <ResetButton onClick={handleResetProfile}>
                <FaCog />
                Reset
              </ResetButton>
              <GenerateButton
                onClick={handleGeneratePlaylist}
                disabled={!isProfileComplete || loading}
              >
                {loading ? (
                  <>
                    <div style={{ width: '16px', height: '16px', borderRadius: '50%', border: '2px solid white', borderTop: '2px solid transparent', animation: 'spin 1s linear infinite' }} />
                    Generating...
                  </>
                ) : (
                  <>
                    <FaArrowRight />
                    Generate My Learning Path
                  </>
                )}
              </GenerateButton>
            </FormActions>
          </ProfilingForm>
        )}

        {generatedPlaylist && (
          <div style={{ 
            background: 'var(--card-bg)', 
            padding: '2rem', 
            borderRadius: '12px',
            border: '2px solid var(--primary)',
            marginBottom: '2rem'
          }}>
            <h3>{generatedPlaylist.title}</h3>
            <p>{generatedPlaylist.description}</p>
            <div style={{ marginTop: '1rem' }}>
              <span>📹 {generatedPlaylist.videoCount} videos</span>
              <span style={{ marginLeft: '1rem' }}>⏱️ {generatedPlaylist.totalDuration}</span>
            </div>
          </div>
        )}

        {!showProfilingForm && (
          <>
            <AnalyticsDashboard />
            <ProgressTracker />
            <SystemValidator />
            <SystemTester />
          </>
        )}
      </motion.div>
    </Container>
  );
}
