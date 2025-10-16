"use client";
import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";

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

const VideoPlayer = styled.div`
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

const VideoThumbnail = styled.div<{ isActive: boolean }>`
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

const ThumbnailImage = styled.div`
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
}

export default function PlaylistViewer({ playlistId, initialVideoId }: PlaylistViewerProps) {
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
  }, [playlistId]);

  useEffect(() => {
    if (initialVideoId && videos.length > 0) {
      const video = videos.find(v => v.id === initialVideoId);
      if (video) {
        setSelectedVideo(video);
        fetchScript(video.id);
      }
    } else if (videos.length > 0 && !selectedVideo) {
      // Auto-select first video if no initial video specified
      setSelectedVideo(videos[0]);
      fetchScript(videos[0].id);
    }
  }, [videos, initialVideoId]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      
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
        // Handle both array and object response formats
        const videosArray = Array.isArray(videosData) ? videosData : (videosData.videos || []);
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
        {Array.isArray(videos) && videos.map((video) => (
          <VideoThumbnail
            key={video.id}
            isActive={selectedVideo?.id === video.id}
            onClick={() => handleVideoSelect(video)}
          >
            <ThumbnailImage>
              {video.video_order}
            </ThumbnailImage>
            <VideoInfo>
              <VideoTitle>{video.title}</VideoTitle>
              <VideoDuration>{formatDuration(video.duration)}</VideoDuration>
            </VideoInfo>
          </VideoThumbnail>
        ))}
      </Sidebar>

      <MainContent>
        <VideoPlayer>
          {selectedVideo ? (
            <>
              <VideoTitleMain>{selectedVideo.title}</VideoTitleMain>
              <VideoDescription>{selectedVideo.description}</VideoDescription>
              <VideoPlaceholder>
                Video Player - {selectedVideo.title}
              </VideoPlaceholder>
            </>
          ) : (
            <VideoPlaceholder>
              Select a video to view content
            </VideoPlaceholder>
          )}
        </VideoPlayer>

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
