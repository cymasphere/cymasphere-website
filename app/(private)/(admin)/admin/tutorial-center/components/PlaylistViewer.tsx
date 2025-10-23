"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import VideoPlayer from './VideoPlayer';

const Container = styled.div`
  display: flex;
  height: 100vh;
  background-color: var(--bg);
`;

const Sidebar = styled.div`
  width: 300px;
  background-color: var(--card-bg);
  border-right: 1px solid var(--border);
  overflow-y: auto;
  padding: 1rem;
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background-color: var(--bg);
`;

const VideoPlayerContainer = styled.div`
  flex: 1;
  background-color: var(--card-bg);
  margin: 1rem;
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const ScriptPanel = styled.div`
  height: 300px;
  background-color: var(--card-bg);
  margin: 0 1rem 1rem 1rem;
  border-radius: 12px;
  padding: 1.5rem;
  overflow-y: auto;
`;

const PlaylistTitle = styled.h2`
  font-size: 1.5rem;
  margin-bottom: 1rem;
  color: var(--primary);
  text-align: center;
`;

const VideoThumbnail = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isActive',
})<{ isActive: boolean }>`
  display: flex;
  align-items: center;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  background-color: ${props => props.isActive ? 'var(--primary)' : 'transparent'};
  color: ${props => props.isActive ? 'white' : 'var(--text)'};
  border: 1px solid ${props => props.isActive ? 'var(--primary)' : 'var(--border)'};
  transition: all 0.2s ease;

  &:hover {
    background-color: ${props => props.isActive ? 'var(--primary)' : 'var(--hover)'};
    border-color: ${props => props.isActive ? 'var(--primary)' : 'var(--primary)'};
  }
`;

const ThumbnailImage = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'thumbnailUrl',
})<{ thumbnailUrl?: string }>`
  width: 60px;
  height: 40px;
  background-color: var(--border);
  border-radius: 4px;
  margin-right: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  color: var(--text-secondary);
  background-image: ${props => props.thumbnailUrl ? `url(${props.thumbnailUrl})` : 'none'};
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  
  ${props => props.thumbnailUrl && `
    color: white;
    text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
    font-weight: bold;
    background-color: #000;
  `}
  
  /* Ensure text is visible over thumbnail */
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: ${props => props.thumbnailUrl ? 'rgba(0, 0, 0, 0.3)' : 'transparent'};
    border-radius: 4px;
    z-index: 1;
  }
  
  /* Text should be above the overlay */
  & > * {
    position: relative;
    z-index: 2;
  }
`;

const VideoInfo = styled.div`
  flex: 1;
`;

const VideoTitle = styled.h4`
  font-size: 0.9rem;
  margin: 0 0 0.25rem 0;
  font-weight: 600;
`;

const VideoDuration = styled.span`
  font-size: 0.75rem;
  color: var(--text-secondary);
`;

const VideoTitleMain = styled.h1`
  font-size: 2rem;
  margin-bottom: 1rem;
  color: var(--text);
`;

const VideoDescription = styled.p`
  font-size: 1rem;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
`;

const VideoPlaceholder = styled.div`
  flex: 1;
  background-color: var(--border);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 1.1rem;
`;

const ScriptTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 1rem;
  color: var(--text);
`;

const ScriptContent = styled.div`
  font-size: 0.9rem;
  line-height: 1.6;
  color: var(--text-secondary);
  white-space: pre-wrap;
`;

const LoadingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  color: var(--text-secondary);
`;

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  video_order: number;
}

interface Playlist {
  id: string;
  title: string;
  description: string;
}

interface PlaylistViewerProps {
  playlistId?: string;
  initialVideoId?: string;
  videos?: Video[];
  playlistTitle?: string;
}

export default function PlaylistViewer({ playlistId, initialVideoId, videos: propVideos, playlistTitle }: PlaylistViewerProps) {
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [script, setScript] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [scriptLoading, setScriptLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistData();
    }
  }, [playlistId, propVideos, playlistTitle]);

  // Reset selected video when playlist changes
  useEffect(() => {
    setSelectedVideo(null);
    setScript("");
  }, [playlistId]);

  useEffect(() => {
    if (initialVideoId && videos.length > 0) {
      const video = videos.find(v => v.id === initialVideoId);
      if (video) {
        setSelectedVideo(video);
        fetchScript(video.id);
      }
    } else if (videos.length > 0) {
      // Auto-select first video if no initial video specified
      setSelectedVideo(videos[0]);
      fetchScript(videos[0].id);
    }
  }, [videos, initialVideoId]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      
      // Check if this is a personalized playlist (passed as videos prop)
      if (playlistId === "personalized" && propVideos && propVideos.length > 0) {
        // For personalized playlists, use the passed videos and playlist data
        setVideos(propVideos);
        if (playlistTitle) {
          setPlaylist({
            id: "personalized",
            name: playlistTitle,
            description: "Your personalized learning path based on your profile"
          });
        }
        setLoading(false);
        return;
      }
      
      // For regular playlists, fetch from API
      // Fetch playlist details
      const playlistResponse = await fetch(`/api/tutorials/playlists/${playlistId}`);
      if (playlistResponse.ok) {
        const playlistData = await playlistResponse.json();
        setPlaylist(playlistData);
      }

      // Fetch playlist videos
      const videosResponse = await fetch(`/api/tutorials/playlists/${playlistId}/videos`);
      if (videosResponse.ok) {
        const videosData = await videosResponse.json();
        console.log('Raw videos response:', videosData);
        // Handle both array and object response formats
        const videosArray = Array.isArray(videosData) ? videosData : (videosData.videos || []);
        console.log('Processed videos array:', videosArray);
        console.log('First video in processed array:', videosArray[0]);
        setVideos(videosArray);
      }
    } catch (error) {
      console.error("Error fetching playlist data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchScript = async (videoId: string) => {
    try {
      setScriptLoading(true);
      const response = await fetch(`/api/tutorials/videos/${videoId}/script`);
      if (response.ok) {
        const scriptData = await response.json();
        // Handle the API response format: { script: scriptObject }
        let scriptContent = "Script content will be available here.";
        
        if (scriptData && scriptData.script) {
          const scriptObj = scriptData.script;
          // Extract the main script content from the database record
          scriptContent = scriptObj.script_content || 
                         scriptObj.content || 
                         scriptObj.explanation ||
                         "Script content will be available here.";
        }
        
        setScript(scriptContent);
      } else {
        setScript("Script content will be available here.");
      }
    } catch (error) {
      console.error("Error fetching script:", error);
      setScript("Script content will be available here.");
    } finally {
      setScriptLoading(false);
    }
  };

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    fetchScript(video.id);
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getYouTubeThumbnail = (videoId: string) => {
    if (!videoId) return undefined;
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  if (loading) {
    return (
      <Container>
        <LoadingSpinner>Loading playlist...</LoadingSpinner>
      </Container>
    );
  }

  return (
    <Container>
      <Sidebar>
        <PlaylistTitle>{playlist?.title || "Playlist Videos"}</PlaylistTitle>
        {Array.isArray(videos) && videos.map((video) => {
          const thumbnailUrl = getYouTubeThumbnail(video.youtube_video_id);
          
          return (
            <VideoThumbnail
              key={video.id}
              isActive={selectedVideo?.id === video.id}
              onClick={() => handleVideoSelect(video)}
            >
              <ThumbnailImage thumbnailUrl={thumbnailUrl}>
                {video.video_order}
              </ThumbnailImage>
              <VideoInfo>
                <VideoTitle>{video.title}</VideoTitle>
                <VideoDuration>{formatDuration(video.duration)}</VideoDuration>
              </VideoInfo>
            </VideoThumbnail>
          );
        })}
      </Sidebar>

      <MainContent>
        {selectedVideo ? (
          <>
            {console.log('Selected video data:', selectedVideo)}
            {console.log('YouTube video ID:', selectedVideo.youtube_video_id)}
            <VideoPlayer
              videoId={selectedVideo.youtube_video_id || ''}
              title={selectedVideo.title}
              description={selectedVideo.description}
              playlistId={playlistId}
              onVideoEnd={() => {
                // Auto-play next video or show completion message
                console.log('Video ended:', selectedVideo.title);
              }}
              onProgressUpdate={(progress, isCompleted) => {
                console.log(`Video progress: ${progress}%, completed: ${isCompleted}`);
              }}
            />
          </>
        ) : (
          <VideoPlaceholder>
            <VideoTitleMain>Select a video to start learning</VideoTitleMain>
            <VideoDescription>
              Choose a video from the playlist on the left to begin your learning journey.
            </VideoDescription>
          </VideoPlaceholder>
        )}

        <ScriptPanel>
          <ScriptTitle>Script</ScriptTitle>
          {scriptLoading ? (
            <LoadingSpinner>Loading script...</LoadingSpinner>
          ) : (
            <ScriptContent>{script}</ScriptContent>
          )}
        </ScriptPanel>
      </MainContent>
    </Container>
  );
}
