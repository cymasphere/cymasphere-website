"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import styled from "styled-components";

const VideoContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
`;

const VideoWrapper = styled.div`
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; /* 16:9 aspect ratio */
  background-color: #000;
  border-radius: 8px;
  overflow: hidden;
  
  iframe {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    width: 100% !important;
    height: 100% !important;
    border: none !important;
  }
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
  padding: 1rem 0;
`;

const VideoTitle = styled.h2`
  font-size: 1.5rem;
  margin: 0 0 0.5rem 0;
  color: var(--text);
`;

const VideoDescription = styled.p`
  color: var(--text-secondary);
  line-height: 1.6;
  margin: 0;
`;

const ProgressContainer = styled.div`
  margin-top: 1rem;
  padding: 1rem;
  background-color: var(--card-bg);
  border-radius: 8px;
  border: 1px solid var(--border);
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 8px;
  background-color: var(--border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
`;

const ProgressFill = styled.div<{ $progress: number }>`
  height: 100%;
  width: ${props => props.$progress}%;
  background: linear-gradient(90deg, var(--primary), var(--accent));
  transition: width 0.3s ease;
`;

const ProgressText = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
  color: var(--text-secondary);
`;

interface VideoPlayerProps {
  videoId: string;
  title: string;
  description: string;
  playlistId: string;
  onProgressUpdate?: (percent: number, completed: boolean) => void;
}

export default function VideoPlayer({ 
  videoId, 
  title, 
  description, 
  playlistId,
  onProgressUpdate 
}: VideoPlayerProps) {
  console.log('VideoPlayer component rendered with:', { videoId, title, description, playlistId });
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentProgressRef = useRef(0);
  const lastSavedPercentRef = useRef(0);
  const lastSaveAtRef = useRef(0);
  const maxPositionRef = useRef(0);
  const durationRef = useRef(0);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load previously saved forward progress and resume - DATABASE IS SOURCE OF TRUTH
  const loadVideoProgress = async () => {
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      console.log('Loading progress for videoId:', videoId, 'userId:', userId);
      const res = await fetch(`/api/tutorials/progress?userId=${userId}`);
      if (!res.ok) {
        console.log('Progress fetch failed:', res.status, res.statusText);
        return;
      }
      const data = await res.json();
      console.log('Progress data loaded:', data);
      console.log('Looking for progress entry for videoId:', videoId);
      const entry = data?.progress?.[videoId];
      console.log('Found progress entry:', entry);
      if (entry) {
        const percent = Math.min(100, Math.max(0, Math.round(entry.progress || 0)));
        console.log('Setting progress from DATABASE (source of truth):', percent);
        
        // DATABASE IS SOURCE OF TRUTH - always use database values
        currentProgressRef.current = percent;
        setCurrentProgress(percent);
        setIsCompleted(!!entry.completed);
        lastSavedPercentRef.current = percent;
        
        // Set the max position to ensure forward-only progress based on DATABASE values
        const trySeek = () => {
          if (playerRef.current && typeof playerRef.current.getDuration === 'function') {
            const dur = playerRef.current.getDuration();
            if (dur && dur > 0) {
              durationRef.current = dur;
              const targetTime = Math.max(0, Math.min(dur - 1, (percent / 100) * dur - 3));
              
              // Set maxPositionRef to the DATABASE progress time to ensure forward-only progress
              maxPositionRef.current = Math.max(maxPositionRef.current, targetTime);
              
              try { playerRef.current.seekTo(targetTime, true); } catch {}
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
      console.error('Error loading video progress:', error);
    }
  };

  // Check database progress before updating local state - DATABASE IS SOURCE OF TRUTH
  const validateProgressAgainstDatabase = async (newPercent: number): Promise<number> => {
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      const res = await fetch(`/api/tutorials/progress?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const entry = data?.progress?.[videoId];
        if (entry) {
          const dbPercent = Math.min(100, Math.max(0, Math.round(entry.progress || 0)));
          console.log('Database validation:', { newPercent, dbPercent, willUse: Math.max(newPercent, dbPercent) });
          // Always use the higher of local progress or database progress
          return Math.max(newPercent, dbPercent);
        }
      }
    } catch (error) {
      console.error('Error validating progress against database:', error);
    }
    return newPercent;
  };

  // Save progress to database
  const postProgress = async (percent: number, completed: boolean) => {
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      const res = await fetch('/api/tutorials/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, videoId, progress: percent, completed }),
      });
      if (res.ok) {
        console.log('Progress saved to DATABASE (source of truth):', { videoId, percent, completed });
        lastSaveAtRef.current = Date.now();
      } else {
        console.error('Failed to save progress:', res.status, res.statusText);
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  };

  // Throttled progress saving
  const maybeSaveProgress = (percent: number, completed: boolean) => {
    const now = Date.now();
    const improved = percent >= lastSavedPercentRef.current + 1;
    const throttled = now - lastSaveAtRef.current < 3000;
    console.log('Progress check:', { 
      percent, 
      lastSaved: lastSavedPercentRef.current, 
      improved, 
      throttled, 
      completed,
      willSave: (improved && !throttled) || completed,
      timeSinceLastSave: now - lastSaveAtRef.current
    });
    if ((improved && !throttled) || completed) {
      console.log('Calling postProgress with:', { percent, completed });
      lastSavedPercentRef.current = percent;
      postProgress(percent, completed);
    }
  };

  // Start polling for progress updates
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    pollingIntervalRef.current = setInterval(async () => {
      if (!playerRef.current || typeof playerRef.current.getCurrentTime !== 'function') return;
      
      try {
        const currentTime = playerRef.current.getCurrentTime();
        const duration = playerRef.current.getDuration();
        
        if (duration && duration > 0) {
          durationRef.current = duration;
          const percent = Math.min(100, Math.max(0, Math.round((currentTime / duration) * 100)));
          
          // Validate against database before updating local state
          const validatedPercent = await validateProgressAgainstDatabase(percent);
          
          // Update progress (but ensure it never goes backwards) - DATABASE IS SOURCE OF TRUTH
          if (validatedPercent >= currentProgressRef.current) {
            console.log('Updating progress to:', validatedPercent);
            currentProgressRef.current = validatedPercent;
            setCurrentProgress(validatedPercent);
            if (validatedPercent >= 90 && !isCompleted) setIsCompleted(true);
            
            // Call the progress update callback to update the sidebar progress bars
            if (onProgressUpdate) {
              onProgressUpdate(validatedPercent, validatedPercent >= 90);
            }
          } else {
            console.log('Progress not updating because:', validatedPercent, '<', currentProgressRef.current);
          }
          
          // Save progress to database (source of truth)
          maybeSaveProgress(validatedPercent, validatedPercent >= 90);
        }
      } catch (error) {
        console.error('Error polling progress:', error);
      }
    }, 1000);
  }, [videoId, onProgressUpdate, isCompleted]);

  // Stop polling
  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Initialize YouTube player
  useEffect(() => {
    console.log('VideoPlayer useEffect triggered:', { videoId, hasYT: !!window.YT, hasPlayer: !!window.YT?.Player });
    
    if (!videoId) {
      console.log('No videoId provided');
      return;
    }
    
    if (!window.YT) {
      console.log('YouTube API not loaded yet, waiting...');
      return;
    }

    const initializePlayer = () => {
      console.log('Initializing YouTube player for videoId:', videoId);
      
      // Clean up existing player
      if (playerRef.current) {
        console.log('Cleaning up existing YouTube player');
        playerRef.current.destroy();
      }

      // Ensure the container exists
      const container = containerRef.current;
      if (!container) {
        console.error('YouTube player container not found!');
        return;
      }
      
      console.log('Container found:', container);
      console.log('Container dimensions:', {
        width: container.offsetWidth,
        height: container.offsetHeight,
        clientWidth: container.clientWidth,
        clientHeight: container.clientHeight
      });

      try {
        // Create iframe manually first
        const iframe = document.createElement('iframe');
        iframe.src = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&origin=${window.location.origin}`;
        iframe.width = '100%';
        iframe.height = '100%';
        iframe.frameBorder = '0';
        iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
        iframe.allowFullscreen = true;
        iframe.style.position = 'absolute';
        iframe.style.top = '0';
        iframe.style.left = '0';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Add iframe to container (don't clear innerHTML to avoid React conflicts)
        container.appendChild(iframe);
        
        console.log('Manual iframe created:', iframe);
        console.log('Iframe src:', iframe.src);
        
        // Now create the YouTube Player
        playerRef.current = new window.YT.Player(iframe, {
          events: {
            onReady: (event: any) => {
              console.log('YouTube player ready for:', videoId);
              console.log('Player element:', event.target);
              console.log('Player iframe:', iframe);
              
              setIsLoaded(true);
              loadVideoProgress();
            },
            onStateChange: (event: any) => {
              console.log('YouTube player state changed:', event.data);
              if (event.data === window.YT.PlayerState.PLAYING) {
                startPolling();
              } else {
                stopPolling();
              }
            },
            onError: (event: any) => {
              console.error('YouTube player error:', event.data);
              setIsLoaded(false);
            },
          },
        });
        
        console.log('Player created:', playerRef.current);
      } catch (error) {
        console.error('Error creating YouTube player:', error);
        setIsLoaded(false);
      }
    };

    if (window.YT.Player) {
      initializePlayer();
    } else {
      console.log('YT.Player not ready, waiting for YT.ready');
      window.YT.ready(initializePlayer);
    }

    return () => {
      console.log('Cleaning up YouTube player');
      stopPolling();
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
      // Clean up manually created iframe
      if (containerRef.current) {
        const iframe = containerRef.current.querySelector('iframe');
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
      }
    };
  }, [videoId, startPolling, stopPolling]);

  return (
    <VideoContainer>
      <VideoWrapper>
        <div ref={containerRef} style={{ width: '100%', height: '100%', backgroundColor: '#000' }}>
          {!isLoaded && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              color: 'white',
              fontSize: '1.2rem',
              textAlign: 'center',
              padding: '2rem',
              backgroundColor: '#000'
            }}>
              <div>
                <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>🎬</div>
                <div>Loading YouTube Player...</div>
                <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '0.5rem' }}>
                  Video ID: {videoId}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
                  YouTube API: {window.YT ? '✅ Loaded' : '❌ Not loaded'}
                </div>
                <div style={{ fontSize: '0.8rem', opacity: 0.5, marginTop: '0.5rem' }}>
                  Player Ready: {isLoaded ? '✅ Yes' : '❌ No'}
                </div>
              </div>
            </div>
          )}
        </div>
      </VideoWrapper>
      
      <VideoInfo>
        <VideoTitle>{title}</VideoTitle>
        <VideoDescription>{description}</VideoDescription>
        
        <ProgressContainer>
          <ProgressBar>
            <ProgressFill $progress={currentProgress} />
          </ProgressBar>
          <ProgressText>
            <span>{currentProgress}% Complete</span>
            <span>{isCompleted ? '✅ Completed' : '⏳ In Progress'}</span>
          </ProgressText>
        </ProgressContainer>
      </VideoInfo>
    </VideoContainer>
  );
}