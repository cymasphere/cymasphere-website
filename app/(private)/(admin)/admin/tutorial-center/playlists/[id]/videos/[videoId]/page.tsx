"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import {
  FaPlay,
  FaVideo,
  FaClock,
  FaEye,
  FaArrowLeft,
  FaFileAlt,
  FaList,
  FaChevronRight,
  FaPause,
  FaVolumeUp,
  FaExpand,
  FaCog,
} from "react-icons/fa";
import { useAuth } from "@/contexts/AuthContext";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

// Animation variants
const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const slideIn = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const Container = styled.div`
  width: 100%;
  height: 100vh;
  display: flex;
  background-color: var(--bg);
  overflow: hidden;
`;

const Sidebar = styled(motion.div)`
  width: 320px;
  background-color: var(--card-bg);
  border-right: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 1024px) {
    width: 280px;
  }

  @media (max-width: 768px) {
    display: none;
  }
`;

const SidebarHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const SidebarTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const SidebarSubtitle = styled.p`
  font-size: 0.9rem;
  color: var(--text-secondary);
  margin: 0;
`;

const PlaylistVideos = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const VideoItem = styled(motion.div)<{ $isActive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;
  background-color: ${props => props.$isActive ? 'rgba(108, 99, 255, 0.1)' : 'transparent'};
  border: 1px solid ${props => props.$isActive ? 'var(--primary)' : 'transparent'};

  &:hover {
    background-color: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.1);
  }

  ${props => props.$isActive && `
    &:hover {
      background-color: rgba(108, 99, 255, 0.15);
      border-color: var(--primary);
    }
  `}
`;

const VideoThumbnail = styled.div`
  width: 60px;
  height: 36px;
  background: linear-gradient(135deg, var(--primary), rgba(108, 99, 255, 0.7));
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1rem;
  flex-shrink: 0;
`;

const VideoInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const VideoItemTitle = styled.h4`
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text);
  margin: 0 0 0.25rem 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const VideoItemDuration = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.25rem;

  svg {
    color: var(--primary);
    font-size: 0.7rem;
  }
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TopBar = styled.div`
  padding: 1rem 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: var(--card-bg);
`;

const Breadcrumb = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9rem;
  color: var(--text-secondary);

  a {
    color: var(--text-secondary);
    text-decoration: none;
    transition: color 0.2s ease;

    &:hover {
      color: var(--primary);
    }
  }

  svg {
    font-size: 0.7rem;
  }
`;

const VideoTitle = styled.h1`
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text);
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  overflow: hidden;
`;

const VideoSection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 1.5rem;
  overflow: hidden;
`;

const VideoPlayerContainer = styled.div`
  background-color: var(--card-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.05);
  margin-bottom: 1.5rem;
`;

const VideoPlayer = styled.div`
  width: 100%;
  aspect-ratio: 16/9;
  background: linear-gradient(135deg, var(--primary), var(--accent));
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 4rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    transform: scale(1.01);
    box-shadow: 0 8px 25px rgba(108, 99, 255, 0.3);
  }

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
    animation: shimmer 3s infinite;
  }

  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;

const PlayerControls = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: rgba(255, 255, 255, 0.02);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.05);
`;

const ControlGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const PlayButton = styled.button`
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

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(108, 99, 255, 0.4);
  }

  svg {
    font-size: 1rem;
  }
`;

const ControlButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  background-color: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
    color: var(--text);
    border-color: var(--primary);
  }

  svg {
    font-size: 0.9rem;
  }
`;

const TimeDisplay = styled.span`
  color: var(--text-secondary);
  font-size: 0.9rem;
  font-weight: 500;
`;

const VideoDescription = styled.p`
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
`;

const VideoStats = styled.div`
  display: flex;
  gap: 2rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
`;

const StatCard = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background-color: rgba(255, 255, 255, 0.02);
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);

  svg {
    font-size: 1rem;
    color: var(--primary);
  }
`;

const StatContent = styled.div`
  display: flex;
  flex-direction: column;
`;

const StatValue = styled.span`
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text);
`;

const StatLabel = styled.span`
  font-size: 0.8rem;
  color: var(--text-secondary);
`;

const ScriptSection = styled.div`
  width: 400px;
  background-color: var(--card-bg);
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;

  @media (max-width: 1200px) {
    width: 350px;
  }

  @media (max-width: 1024px) {
    display: none;
  }
`;

const ScriptHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const ScriptTitle = styled.h2`
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--text);
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  svg {
    color: var(--primary);
  }
`;

const ScriptContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text);
  white-space: pre-wrap;
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

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);

  svg {
    font-size: 3rem;
    color: var(--primary);
    margin-bottom: 1rem;
  }
`;

const EmptyTitle = styled.h3`
  font-size: 1.2rem;
  color: var(--text);
  margin: 0 0 0.5rem 0;
`;

const EmptyDescription = styled.p`
  font-size: 0.9rem;
  margin: 0;
  line-height: 1.5;
`;

export default function VideoDetail() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const playlistId = params.id as string;
  const videoId = params.videoId as string;
  
  const [video, setVideo] = useState<any>(null);
  const [script, setScript] = useState<string>('');
  const [playlistVideos, setPlaylistVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    fetchVideoData();
    fetchPlaylistVideos();
  }, [videoId, playlistId]);

  const fetchVideoData = async () => {
    try {
      // Fetch video data
      const videoResponse = await fetch(`/api/tutorials/videos/${videoId}`);
      if (videoResponse.ok) {
        const videoData = await videoResponse.json();
        setVideo(videoData);
      }

      // Fetch script data
      const scriptResponse = await fetch(`/api/tutorials/videos/${videoId}/script`);
      if (scriptResponse.ok) {
        const scriptData = await scriptResponse.json();
        setScript(scriptData.content || 'No script available for this video.');
      }
    } catch (error) {
      console.error('Failed to fetch video data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylistVideos = async () => {
    try {
      const response = await fetch(`/api/tutorials/playlists/${playlistId}/videos`);
      if (response.ok) {
        const data = await response.json();
        setPlaylistVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Failed to fetch playlist videos:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup': return '🛠️';
      case 'music_theory': return '🎵';
      case 'core_composition': return '🎼';
      case 'advanced_composition': return '🎹';
      case 'sound_design': return '🔊';
      case 'midi_audio': return '🎚️';
      case 'workflow': return '⚡';
      default: return '📹';
    }
  };

  const handleVideoSelect = (selectedVideoId: string) => {
    if (selectedVideoId !== videoId) {
      router.push(`/admin/tutorial-center/playlists/${playlistId}/videos/${selectedVideoId}`);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <Container>
        <LoadingContainer>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '3px solid var(--primary)', borderTop: '3px solid transparent', animation: 'spin 1s linear infinite' }} />
          Loading video...
        </LoadingContainer>
      </Container>
    );
  }

  if (!video) {
    return (
      <Container>
        <EmptyState>
          <FaVideo />
          <EmptyTitle>Video not found</EmptyTitle>
          <EmptyDescription>
            The requested video could not be found or loaded.
          </EmptyDescription>
        </EmptyState>
      </Container>
    );
  }

  return (
    <Container>
      <Sidebar variants={slideIn} initial="hidden" animate="visible">
        <SidebarHeader>
          <SidebarTitle>
            <FaList />
            Playlist Videos
          </SidebarTitle>
          <SidebarSubtitle>
            {playlistVideos.length} videos in this playlist
          </SidebarSubtitle>
        </SidebarHeader>
        
        <PlaylistVideos>
          {playlistVideos.map((playlistVideo, index) => (
            <VideoItem
              key={playlistVideo.id}
              $isActive={playlistVideo.id === videoId}
              onClick={() => handleVideoSelect(playlistVideo.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <VideoThumbnail>
                {getCategoryIcon(playlistVideo.feature_category)}
              </VideoThumbnail>
              <VideoInfo>
                <VideoItemTitle>{playlistVideo.title}</VideoItemTitle>
                <VideoItemDuration>
                  <FaClock />
                  {formatDuration(playlistVideo.duration)}
                </VideoItemDuration>
              </VideoInfo>
              {playlistVideo.id === videoId && (
                <FaChevronRight style={{ color: 'var(--primary)', fontSize: '0.8rem' }} />
              )}
            </VideoItem>
          ))}
        </PlaylistVideos>
      </Sidebar>

      <MainContent>
        <TopBar>
          <Breadcrumb>
            <Link href="/admin/tutorial-center">Tutorial Center</Link>
            <FaChevronRight />
            <Link href={`/admin/tutorial-center/playlists/${playlistId}`}>Playlist</Link>
            <FaChevronRight />
            <span>{video.title}</span>
          </Breadcrumb>
        </TopBar>

        <ContentArea>
          <VideoSection>
            <VideoPlayerContainer>
              <VideoPlayer onClick={() => setIsPlaying(!isPlaying)}>
                {isPlaying ? <FaPause /> : <FaPlay />}
              </VideoPlayer>
              
              <PlayerControls>
                <ControlGroup>
                  <PlayButton onClick={() => setIsPlaying(!isPlaying)}>
                    {isPlaying ? <FaPause /> : <FaPlay />}
                    {isPlaying ? 'Pause' : 'Play'}
                  </PlayButton>
                  <ControlButton>
                    <FaVolumeUp />
                  </ControlButton>
                  <ControlButton>
                    <FaExpand />
                  </ControlButton>
                </ControlGroup>
                
                <TimeDisplay>
                  0:00 / {formatDuration(video.duration)}
                </TimeDisplay>
              </PlayerControls>
            </VideoPlayerContainer>

            <VideoTitle>
              <FaVideo />
              {video.title}
            </VideoTitle>
            
            <VideoDescription>{video.description}</VideoDescription>
            
            <VideoStats>
              <StatCard>
                <FaClock />
                <StatContent>
                  <StatValue>{formatDuration(video.duration)}</StatValue>
                  <StatLabel>Duration</StatLabel>
                </StatContent>
              </StatCard>
              <StatCard>
                <FaEye />
                <StatContent>
                  <StatValue>{video.views || 0}</StatValue>
                  <StatLabel>Views</StatLabel>
                </StatContent>
              </StatCard>
              <StatCard>
                <FaCog />
                <StatContent>
                  <StatValue>{video.theory_level_required}</StatValue>
                  <StatLabel>Theory Level</StatLabel>
                </StatContent>
              </StatCard>
              <StatCard>
                <FaCog />
                <StatContent>
                  <StatValue>{video.tech_level_required.replace('_', ' ')}</StatValue>
                  <StatLabel>Tech Level</StatLabel>
                </StatContent>
              </StatCard>
            </VideoStats>
          </VideoSection>

          <ScriptSection>
            <ScriptHeader>
              <ScriptTitle>
                <FaFileAlt />
                Video Script
              </ScriptTitle>
            </ScriptHeader>
            
            <ScriptContent>
              {script || 'No script available for this video.'}
            </ScriptContent>
          </ScriptSection>
        </ContentArea>
      </MainContent>
    </Container>
  );
}