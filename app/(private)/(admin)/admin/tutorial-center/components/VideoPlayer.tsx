"use client";
import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaExpand, FaCompress } from "react-icons/fa";

interface VideoPlayerProps {
  videoId: string;
  title: string;
  description?: string;
  onVideoEnd?: () => void;
  autoplay?: boolean;
  playlistId?: string;
  onProgressUpdate?: (progress: number, isCompleted: boolean) => void;
}

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background: #000;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.2);
  margin: 1rem;
`;

const VideoIframe = styled.iframe`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
`;

const VideoInfo = styled.div`
  margin: 1rem;
  margin-top: 1.5rem;
`;

const VideoTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
  font-weight: 600;
`;

const VideoDescription = styled.p`
  font-size: 1rem;
  margin: 0;
  color: var(--text-secondary);
  line-height: 1.6;
`;

const LoadingContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 1.1rem;
`;

const ErrorContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: white;
  text-align: center;
  padding: 2rem;
`;

const ErrorTitle = styled.h3`
  font-size: 1.2rem;
  margin: 0 0 1rem 0;
  color: #ff6b6b;
`;

const ErrorMessage = styled.p`
  font-size: 0.9rem;
  margin: 0;
  opacity: 0.8;
`;

const RetryButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;

  &:hover {
    background: var(--accent);
  }
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--border);
  border-radius: 2px;
  margin: 1rem 0;
  overflow: hidden;
`;

const ProgressFill = styled.div<{ percentage: number }>`
  height: 100%;
  background-color: var(--primary);
  width: ${props => props.percentage}%;
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  font-size: 0.9rem;
  color: var(--text-secondary);
  text-align: center;
  margin-top: 0.5rem;
`;

export default function VideoPlayer({ 
  videoId, 
  title, 
  description, 
  onVideoEnd, 
  autoplay = false,
  playlistId,
  onProgressUpdate
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [totalWatchTime, setTotalWatchTime] = useState(0);

  // Simplified progress tracking - just load existing progress
  const loadVideoProgress = async () => {
    try {
      const response = await fetch(`/api/tutorials/videos/${videoId}/progress`);
      if (response.ok) {
        const data = await response.json();
        if (data.progress) {
          setCurrentProgress(data.progress.watch_percentage || 0);
          setIsCompleted(data.progress.is_completed || false);
          setTotalWatchTime(data.progress.total_watch_time || 0);
        }
      }
    } catch (error) {
      console.error('Error loading video progress:', error);
    }
  };

  const saveVideoProgress = async (progress: number, completed: boolean = false) => {
    try {
      const response = await fetch(`/api/tutorials/videos/${videoId}/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          watchPercentage: progress,
          isCompleted: completed,
          totalWatchTime: totalWatchTime,
          playlistId: playlistId
        }),
      });

      if (response.ok) {
        if (onProgressUpdate) {
          onProgressUpdate(progress, completed);
        }
      }
    } catch (error) {
      console.error('Error saving video progress:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    // Reset progress tracking when video changes
    setCurrentProgress(0);
    setIsCompleted(false);
    setTotalWatchTime(0);

    // Load existing progress when video changes
    if (videoId) {
      loadVideoProgress();
    }
  }, [videoId]);

  const handleRetry = () => {
    setHasError(false);
    setIsLoading(true);
    // Reload the iframe by changing the key
    window.location.reload();
  };

  const getYouTubeEmbedUrl = (videoId: string) => {
    const params = new URLSearchParams({
      autoplay: autoplay ? '1' : '0',
      controls: '1',
      modestbranding: '1',
      rel: '0',
      showinfo: '0',
      fs: '1',
      cc_load_policy: '0',
      iv_load_policy: '3',
      autohide: '0',
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  };

  return (
    <VideoContainer>
      {isLoading && (
        <LoadingContainer>
          Loading video...
        </LoadingContainer>
      )}
      
      {hasError ? (
        <ErrorContainer>
          <ErrorTitle>Video Unavailable</ErrorTitle>
          <ErrorMessage>
            {!videoId 
              ? "No video ID provided. Please check the video configuration."
              : "This video could not be loaded. It may be private, deleted, or unavailable in your region."
            }
          </ErrorMessage>
          <RetryButton onClick={handleRetry}>
            Try Again
          </RetryButton>
        </ErrorContainer>
      ) : (
        <VideoIframe
          key={videoId} // Force re-render when videoId changes
          src={getYouTubeEmbedUrl(videoId)}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => {
            setIsLoading(false);
            setHasError(false);
          }}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      )}

      <VideoInfo>
        <VideoTitle>{title}</VideoTitle>
        {description && (
          <VideoDescription>{description}</VideoDescription>
        )}
        
        {currentProgress > 0 && (
          <>
            <ProgressBar>
              <ProgressFill percentage={currentProgress} />
            </ProgressBar>
            <ProgressText>
              {isCompleted ? '✅ Completed' : `${Math.round(currentProgress)}% watched`} 
              {totalWatchTime > 0 && ` • ${formatTime(totalWatchTime)} total watch time`}
            </ProgressText>
          </>
        )}
      </VideoInfo>
    </VideoContainer>
  );
}
