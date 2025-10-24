"use client";
import React, { useState, useEffect, useCallback } from "react";
import styled from "styled-components";
import { useRouter } from "next/navigation";
import VideoPlayer from './VideoPlayer';
import LoadingSpinner from "@/components/common/LoadingSpinner";

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
  position: relative;

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

const ProgressTrack = styled.div`
  position: absolute;
  left: 8px;
  right: 8px;
  bottom: 6px;
  height: 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.15);
  overflow: hidden;
`;

const ProgressFill = styled.div<{ $percent: number; $completed?: boolean }>`
  height: 100%;
  width: ${props => Math.min(Math.max(props.$percent, 0), 100)}%;
  background: ${props => props.$completed ? 'var(--success)' : 'var(--accent)'};
  transition: width 0.2s ease;
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

// No additional local spinner styles needed; use shared LoadingSpinner

interface Video {
  id: string;
  title: string;
  description: string;
  duration: number;
  video_order: number;
  youtube_video_id?: string;
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
  const [progressMap, setProgressMap] = useState<Record<string, { progress: number; completed: boolean }>>({});
  const [autoplayNext, setAutoplayNext] = useState<boolean>(true);
  const [progressPollingInterval, setProgressPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Poll database for progress updates - DATABASE IS SOURCE OF TRUTH
  const pollDatabaseProgress = useCallback(async () => {
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      const res = await fetch(`/api/tutorials/progress?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const prog = data.progress || {};
        
        // Update progress map with fresh database data
        setProgressMap((prev) => {
          const newMap = { ...prev };
          let hasChanges = false;
          
          videos.forEach((video) => {
            const youtubeId = video.youtube_video_id;
            if (youtubeId && prog[youtubeId]) {
              const dbProgress = prog[youtubeId].progress || 0;
              const dbCompleted = !!prog[youtubeId].completed;
              const currentProgress = prev[video.id]?.progress || 0;
              const currentCompleted = prev[video.id]?.completed || false;
              
              // Only update if there are actual changes
              if (dbProgress !== currentProgress || dbCompleted !== currentCompleted) {
                newMap[video.id] = { 
                  progress: dbProgress, 
                  completed: dbCompleted 
                };
                hasChanges = true;
                console.log(`Progress bar updated from DATABASE: ${video.title} - ${dbProgress}% (${dbCompleted ? 'completed' : 'in progress'})`);
              }
            }
          });
          
          return hasChanges ? newMap : prev;
        });
      }
    } catch (error) {
      console.error('Error polling database progress:', error);
    }
  }, [videos]);

  const handleProgressUpdate = useCallback((percent: number, completed: boolean) => {
    if (!selectedVideo) return;
    
    // Ensure forward-only progress - never go backwards (DATABASE IS SOURCE OF TRUTH)
    setProgressMap((prev) => {
      const currentProgress = prev[selectedVideo.id]?.progress || 0;
      const newProgress = Math.max(currentProgress, percent); // Only update if progress increased or stayed same
      
      // Only log significant progress changes to reduce noise
      if (newProgress % 10 === 0 || completed) {
        console.log('Progress update received (validated against DATABASE):', { videoId: selectedVideo.id, percent: newProgress, completed, wasIncreased: newProgress > currentProgress });
      }
      
      return {
        ...prev,
        [selectedVideo.id]: { progress: newProgress, completed },
      };
    });
  }, [selectedVideo]);

  // Get the current progress for a video, prioritizing real-time updates over saved progress
  const getVideoProgress = useCallback((video: Video) => {
    const savedProgress = progressMap[video.id];
    if (!savedProgress) return { progress: 0, completed: false };
    
    // If this is the currently selected video, use real-time progress
    if (selectedVideo && selectedVideo.id === video.id) {
      return savedProgress; // This will be updated by handleProgressUpdate
    }
    
    // For other videos, use saved progress (always forward-only)
    return savedProgress;
  }, [progressMap, selectedVideo]);

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

  // Fetch user progress from DATABASE (source of truth) once on mount and when playlist changes
  useEffect(() => {
    const loadProgress = async () => {
      try {
        const userId =
          (typeof window !== 'undefined' && localStorage.getItem('userId')) ||
          '900f11b8-c901-49fd-bfab-5fafe984ce72';
        const res = await fetch(`/api/tutorials/progress?userId=${userId}`);
        if (!res.ok) {
          console.log('Progress API response not ok:', res.status, res.statusText);
          return;
        }
        const data = await res.json();
        console.log('Progress data received from DATABASE (source of truth):', data);
        
        // Create a mapping from database video IDs to progress data - DATABASE IS SOURCE OF TRUTH
        const map: Record<string, { progress: number; completed: boolean }> = {};
        const prog = data.progress || {};
        console.log('Raw progress data from DATABASE:', prog);
        
        // Get the current videos to create the mapping
        const currentVideos = videos.length > 0 ? videos : await fetchCurrentVideos();
        console.log('Current videos for mapping:', currentVideos);
        
        if (currentVideos && currentVideos.length > 0) {
          currentVideos.forEach((video) => {
            const youtubeId = video.youtube_video_id;
            console.log(`Mapping video ${video.id} (${video.title}) with YouTube ID ${youtubeId}`);
            if (youtubeId && prog[youtubeId]) {
              // Map database video ID to progress data using YouTube ID - DATABASE IS SOURCE OF TRUTH
              map[video.id] = { 
                progress: prog[youtubeId].progress || 0, 
                completed: !!prog[youtubeId].completed 
              };
              console.log(`Mapped ${video.id} -> progress: ${prog[youtubeId].progress}, completed: ${prog[youtubeId].completed} (from DATABASE)`);
            } else {
              console.log(`No progress found for video ${video.id} with YouTube ID ${youtubeId}`);
            }
          });
        }
        
        console.log('Final progress map created from DATABASE:', map);
        setProgressMap(map);
      } catch (e) {
        console.error('Error loading progress from DATABASE:', e);
      }
    };

    const fetchCurrentVideos = async () => {
      try {
        if (playlistId === "personalized" && propVideos && propVideos.length > 0) {
          return propVideos;
        }
        
        const videosResponse = await fetch(`/api/tutorials/playlists/${playlistId}/videos`);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          return videosData.videos || [];
        }
        return [];
      } catch (e) {
        console.error('Error fetching current videos:', e);
        return [];
      }
    };
    loadProgress();
  }, [playlistId, videos]);

  // Start/stop database polling for progress bars - DATABASE IS SOURCE OF TRUTH
  useEffect(() => {
    if (videos.length > 0) {
      // Start polling every 5 seconds to keep progress bars synchronized with database
      const interval = setInterval(pollDatabaseProgress, 5000);
      setProgressPollingInterval(interval);
      
      console.log('Started database polling for progress bars (every 5 seconds)');
      
      return () => {
        clearInterval(interval);
        setProgressPollingInterval(null);
        console.log('Stopped database polling for progress bars');
      };
    }
  }, [videos, pollDatabaseProgress]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (progressPollingInterval) {
        clearInterval(progressPollingInterval);
        console.log('Cleaned up progress polling on unmount');
      }
    };
  }, [progressPollingInterval]);

  const fetchPlaylistData = async () => {
    try {
      setLoading(true);
      
      // Check if this is a personalized playlist (passed as videos prop)
      if (playlistId === "personalized" && propVideos && propVideos.length > 0) {
        // Normalize personalized videos: ensure youtube_video_id, duration, and order
        const normalizedVideos: Video[] = await Promise.all(
          propVideos.map(async (v, idx) => {
            const candidateYoutubeId: string | undefined = (v as any).youtube_video_id || (v as any).youtubeId || (v as any).youtube;
            const candidateDuration: number | undefined = (v as any).duration;
            const candidateOrder: number | undefined = (v as any).video_order || (v as any).order || (v as any).sequence_order;

            if (candidateYoutubeId && candidateDuration) {
              return {
                id: v.id,
                title: v.title,
                description: v.description,
                duration: candidateDuration,
                video_order: candidateOrder ?? idx + 1,
                youtube_video_id: candidateYoutubeId,
              };
            }

            // Fetch missing fields from API
            try {
              const res = await fetch(`/api/tutorials/videos/${v.id}`);
              if (res.ok) {
                const full = await res.json();
                return {
                  id: v.id,
                  title: v.title ?? full.title,
                  description: v.description ?? full.description,
                  duration: candidateDuration ?? full.duration ?? 300,
                  video_order: candidateOrder ?? idx + 1,
                  youtube_video_id: candidateYoutubeId ?? full.youtube_video_id,
                };
              }
            } catch (e) {
              console.error("Failed to hydrate personalized video", v.id, e);
            }

            // Fallback if API fails
            return {
              id: v.id,
              title: v.title,
              description: v.description,
              duration: candidateDuration ?? 300,
              video_order: candidateOrder ?? idx + 1,
              youtube_video_id: candidateYoutubeId,
            };
          })
        );

        // Sort by order just in case
        normalizedVideos.sort((a, b) => (a.video_order ?? 0) - (b.video_order ?? 0));
        setVideos(normalizedVideos);
        if (playlistTitle) {
          setPlaylist({
            id: "personalized",
            title: playlistTitle,
            description: "Your personalized learning path based on your profile"
          } as any);
        } else {
          setPlaylist({ id: "personalized", title: "Your Personalized Learning Path", description: "" } as any);
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

  const handleVideoSelect = async (video: Video) => {
    console.log('Video selected:', video.title, video.youtube_video_id);
    setSelectedVideo(video);
    fetchScript(video.id);
    
    // DATABASE IS SOURCE OF TRUTH - fetch fresh progress when video is selected
    try {
      const userId = (typeof window !== 'undefined' && localStorage.getItem('userId')) || '900f11b8-c901-49fd-bfab-5fafe984ce72';
      const res = await fetch(`/api/tutorials/progress?userId=${userId}`);
      if (res.ok) {
        const data = await res.json();
        const prog = data.progress || {};
        
        // Update progress map with fresh database data
        setProgressMap((prev) => {
          const newMap = { ...prev };
          videos.forEach((v) => {
            const youtubeId = v.youtube_video_id;
            if (youtubeId && prog[youtubeId]) {
              newMap[v.id] = { 
                progress: prog[youtubeId].progress || 0, 
                completed: !!prog[youtubeId].completed 
              };
            }
          });
          return newMap;
        });
      }
    } catch (error) {
      console.error('Error fetching fresh progress on video select:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds === -1) return "Loading...";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getYouTubeThumbnail = (videoId: string) => {
    if (!videoId) return undefined;
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
  };

  // Store YouTube durations as we discover them from the player
  const [youtubeDurations, setYoutubeDurations] = useState<Record<string, number>>({});

  const updateYoutubeDuration = useCallback((videoId: string, duration: number) => {
    setYoutubeDurations(prev => ({
      ...prev,
      [videoId]: duration
    }));
  }, []);

  const getDisplayDuration = useCallback((video: Video) => {
    // Always prefer YouTube duration if available, otherwise show "Loading..." for videos with YouTube IDs
    if (video.youtube_video_id) {
      const youtubeDuration = youtubeDurations[video.youtube_video_id];
      if (youtubeDuration) {
        return youtubeDuration;
      }
      // Show "Loading..." for videos that have YouTube IDs but haven't loaded yet
      return -1; // Special value to show "Loading..."
    }
    // Fall back to stored duration for videos without YouTube IDs
    return video.duration;
  }, [youtubeDurations]);

  // Load cached durations and fetch missing ones efficiently
  useEffect(() => {
    const loadDurationsEfficiently = async () => {
      console.log('loadDurationsEfficiently called with videos:', videos?.length || 0);
      if (!videos || videos.length === 0) {
        console.log('No videos to load durations for');
        return;
      }
      
      // Get video IDs for this playlist
      const videoIds = videos.map(v => v.id);
      console.log('Video IDs for duration loading:', videoIds);
      
      try {
        // Fetch videos with cached durations from database
        const response = await fetch(`/api/tutorials/videos-with-durations?videoIds=${videoIds.join(',')}`);
        console.log('Duration API response status:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log(`Loaded ${data.cached_count} cached durations, ${data.needs_fetch_count} need fetching`);
          console.log('Duration data:', data);
          
          // Update durations from cache
          data.videos.forEach((video: any) => {
            if (video.youtube_video_id && video.duration_cached) {
              console.log(`Updating cached duration for ${video.youtube_video_id}: ${video.duration}s`);
              updateYoutubeDuration(video.youtube_video_id, video.duration);
            }
          });
          
          // Only fetch durations for videos that don't have cached durations
          const videosNeedingDuration = data.videos.filter((v: any) => v.needs_duration_fetch);
          
          if (videosNeedingDuration.length > 0) {
            console.log(`Fetching durations for ${videosNeedingDuration.length} videos`);
            
            // Fetch durations in parallel (but limit to 5 at a time to avoid rate limiting)
            const batches = [];
            for (let i = 0; i < videosNeedingDuration.length; i += 5) {
              batches.push(videosNeedingDuration.slice(i, i + 5));
            }
            
            for (const batch of batches) {
              await Promise.all(batch.map(async (video: any) => {
                try {
                  const durationResponse = await fetch(`/api/youtube/duration?id=${video.youtube_video_id}`);
                  if (durationResponse.ok) {
                    const durationData = await durationResponse.json();
                    if (durationData.duration && durationData.duration > 0) {
                      updateYoutubeDuration(video.youtube_video_id, durationData.duration);
                      console.log(`Fetched and cached duration for ${video.title}: ${durationData.duration}s`);
                    }
                  }
                } catch (error) {
                  console.error('Failed to load duration for', video.youtube_video_id, error);
                }
              }));
              
              // Small delay between batches to be respectful to YouTube
              if (batches.indexOf(batch) < batches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }
        } else {
          console.error('Failed to fetch durations:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error loading durations efficiently:', error);
      }
    };

    loadDurationsEfficiently();
  }, [videos, updateYoutubeDuration]);

  if (loading) {
    return <LoadingSpinner fullScreen size="small" text="Loading playlist..." />;
  }

  return (
    <Container>
      <Sidebar>
        <PlaylistTitle>{playlist?.title || "Playlist Videos"}</PlaylistTitle>
        {Array.isArray(videos) && videos.map((video) => {
          const thumbnailUrl = getYouTubeThumbnail(video.youtube_video_id);
          const videoProgress = getVideoProgress(video);
          const p = videoProgress.progress;
          const isCompleted = videoProgress.completed;
          // Only log for debugging when needed
          // console.log('Rendering video progress:', { videoId: video.id, title: video.title, progress: p, completed: isCompleted, isSelected: selectedVideo?.id === video.id });
          
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
                <VideoDuration>{formatDuration(getDisplayDuration(video))}</VideoDuration>
              </VideoInfo>
              <ProgressTrack>
                <ProgressFill $percent={p} $completed={isCompleted} />
              </ProgressTrack>
            </VideoThumbnail>
          );
        })}
      </Sidebar>

      <MainContent>
        {selectedVideo ? (
          <>
            {/* Reduced logging to prevent console spam */}
            {selectedVideo.youtube_video_id ? (
              <VideoPlayer
                key={selectedVideo.youtube_video_id}
                videoId={selectedVideo.youtube_video_id}
                title={selectedVideo.title}
                description={selectedVideo.description}
                playlistId={playlistId}
                onProgressUpdate={handleProgressUpdate}
              />
            ) : (
              <VideoPlaceholder>
                <VideoTitleMain>No YouTube Video Available</VideoTitleMain>
                <VideoDescription>
                  This video doesn't have a YouTube video ID configured.
                </VideoDescription>
              </VideoPlaceholder>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '0 1rem 1rem 1rem' }}>
              <input
                id="autoplay-next-toggle"
                type="checkbox"
                checked={autoplayNext}
                onChange={(e) => setAutoplayNext(e.target.checked)}
              />
              <label htmlFor="autoplay-next-toggle" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Autoplay next video
              </label>
            </div>
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
            <ScriptContent>Loading script...</ScriptContent>
          ) : (
            <ScriptContent>{script}</ScriptContent>
          )}
        </ScriptPanel>
      </MainContent>
    </Container>
  );
}
