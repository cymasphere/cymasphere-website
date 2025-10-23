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

const VideoIframe = styled.div`
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

const LoadingContainer = styled.div<{ $visible: boolean }>`
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
  pointer-events: none;
  opacity: ${p => (p.$visible ? 1 : 0)};
  transition: opacity 150ms ease;
`;

const ErrorContainer = styled.div<{ $visible: boolean }>`
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
  opacity: ${p => (p.$visible ? 1 : 0)};
  pointer-events: ${p => (p.$visible ? 'auto' : 'none')};
  transition: opacity 150ms ease;
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

  // YouTube player refs and tracking state
  const playerRef = useRef<any>(null);
  const pollRef = useRef<any>(null);
  const durationRef = useRef<number>(0);
  const maxPositionRef = useRef<number>(0);
  const lastSavedPercentRef = useRef<number>(0);
  const lastSaveAtRef = useRef<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load previously saved forward progress and resume
  const loadVideoProgress = async () => {
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      const res = await fetch(`/api/tutorials/progress?userId=${userId}`);
      if (!res.ok) return;
      const data = await res.json();
      const entry = data?.progress?.[videoId];
      if (entry) {
        const percent = Math.min(100, Math.max(0, Math.round(entry.progress || 0)));
        setCurrentProgress(percent);
        setIsCompleted(!!entry.completed);
        lastSavedPercentRef.current = percent;
        // Seek near last max position once player and duration ready
        const trySeek = () => {
          if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            const dur = playerRef.current.getDuration();
            if (dur && dur > 0) {
              durationRef.current = dur;
              const target = Math.max(0, Math.min(dur - 1, (percent / 100) * dur - 3));
              try { playerRef.current.seekTo(target, true); } catch {}
              return true;
            }
          }
          return false;
        };
        // Attempt a few times
        let attempts = 0;
        const seekInterval = setInterval(() => {
          attempts++;
          if (trySeek() || attempts > 10) clearInterval(seekInterval);
        }, 300);
      }
    } catch (error) {
      // ignore
    }
  };

  const postProgress = async (progress: number, completed: boolean) => {
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      const body = { userId, videoId, progress, completed };
      const now = Date.now();
      lastSaveAtRef.current = now;
      const res = await fetch('/api/tutorials/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        keepalive: true,
      });
      if (res.ok && onProgressUpdate) onProgressUpdate(progress, completed);
    } catch (e) {
      // ignore transient errors
    }
  };

  const maybeSaveProgress = (percent: number, completed: boolean) => {
    const now = Date.now();
    const improved = percent >= lastSavedPercentRef.current + 1;
    const throttled = now - lastSaveAtRef.current < 3000;
    if ((improved && !throttled) || completed) {
      lastSavedPercentRef.current = percent;
      postProgress(percent, completed);
    }
  };

  const startPolling = () => {
    if (pollRef.current) return;
    pollRef.current = setInterval(() => {
      if (!playerRef.current) return;
      try {
        const ct = playerRef.current.getCurrentTime ? playerRef.current.getCurrentTime() : 0;
        const dur = durationRef.current || (playerRef.current.getDuration ? playerRef.current.getDuration() : 0);
        if (!dur || dur <= 0) return;
        durationRef.current = dur;
        if (ct > maxPositionRef.current) {
          maxPositionRef.current = ct;
        }
        const percent = Math.min(100, Math.round((maxPositionRef.current / dur) * 100));
        setCurrentProgress(percent);
        if (percent >= 90 && !isCompleted) setIsCompleted(true);
        maybeSaveProgress(percent, percent >= 90);
      } catch {}
    }, 1000);
  };

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  // Initialize YouTube Iframe API and player
  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
    maxPositionRef.current = 0;
    lastSavedPercentRef.current = 0;
    stopPolling();

    const createPlayer = () => {
      if (!window || !(window as any).YT || !(window as any).YT.Player) return false;
      if (!containerRef.current) return false;
      try {
        playerRef.current = new (window as any).YT.Player(containerRef.current, {
          height: '100%',
          width: '100%',
          videoId: videoId,
          playerVars: {
            autoplay: autoplay ? 1 : 0,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: typeof window !== 'undefined' ? window.location.origin : undefined,
          },
          events: {
            onReady: () => {
              try { durationRef.current = playerRef.current.getDuration() || 0; } catch {}
              setIsLoading(false);
              loadVideoProgress();
            },
            onStateChange: (e: any) => {
              const YTState = (window as any).YT?.PlayerState;
              if (!YTState) return;
              if (e.data === YTState.PLAYING) {
                startPolling();
              } else if (e.data === YTState.PAUSED) {
                stopPolling();
                maybeSaveProgress(currentProgress, false);
              } else if (e.data === YTState.ENDED) {
                stopPolling();
                setIsCompleted(true);
                maybeSaveProgress(100, true);
                if (onVideoEnd) onVideoEnd();
              }
            },
            onError: () => {
              setIsLoading(false);
              setHasError(true);
            },
          },
        });
        return true;
      } catch {
        setHasError(true);
        setIsLoading(false);
        return false;
      }
    };

    const ensureApi = () => {
      if ((window as any).YT && (window as any).YT.Player) {
        return createPlayer();
      }
      // Only assign a single global ready callback
      const w = window as any;
      const prevCb = w.onYouTubeIframeAPIReady;
      w.onYouTubeIframeAPIReady = () => {
        if (typeof prevCb === 'function') {
          try { prevCb(); } catch {}
        }
        createPlayer();
      };
      const existing = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      if (!existing) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
      return false;
    };

    ensureApi();

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        const percent = currentProgress;
        const completed = isCompleted || percent >= 90;
        try {
          const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
          const body = JSON.stringify({ userId, videoId, progress: percent, completed });
          const blob = new Blob([body], { type: 'application/json' });
          navigator.sendBeacon('/api/tutorials/progress', blob);
        } catch {}
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      stopPolling();
      try { playerRef.current && playerRef.current.destroy && playerRef.current.destroy(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

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

  // Player is injected by YT API, so no src builder here

  return (
    <VideoContainer>
      <LoadingContainer $visible={isLoading}>Loading video...</LoadingContainer>
      
      <VideoIframe ref={containerRef} />

      <ErrorContainer $visible={hasError}>
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
