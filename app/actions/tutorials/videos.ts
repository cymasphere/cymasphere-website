"use server";

import { createClient } from '@/utils/supabase/server';

export interface GetVideosParams {
  category?: string;
  theoryLevel?: string;
  techLevel?: string;
  appMode?: string;
  search?: string;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  youtube_id: string;
  duration: number;
  feature_category: string;
  theory_level_required: string;
  tech_level_required: string;
  app_mode_applicability: string[];
  musical_context: string;
  created_at: string;
  updated_at: string;
}

export interface GetVideosResponse {
  videos: Video[];
  categories: string[];
  totalCount: number;
}

/**
 * Get all tutorial videos with optional filters
 */
export async function getVideos(
  params?: GetVideosParams
): Promise<GetVideosResponse> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Build query
    let query = supabase
      .from('tutorial_videos')
      .select('*')
      .order('feature_category', { ascending: true })
      .order('title', { ascending: true });

    // Apply filters
    if (params?.category && params.category !== 'all') {
      query = query.eq('feature_category', params.category);
    }

    if (params?.theoryLevel && params.theoryLevel !== 'all') {
      query = query.eq('theory_level_required', params.theoryLevel);
    }

    if (params?.techLevel && params.techLevel !== 'all') {
      query = query.eq('tech_level_required', params.techLevel);
    }

    if (params?.appMode && params.appMode !== 'all') {
      query = query.contains('app_mode_applicability', [params.appMode]);
    }

    if (params?.search) {
      query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
    }

    const { data: videos, error } = await query;

    if (error) {
      console.error('Error fetching videos:', error);
      throw new Error('Failed to fetch videos');
    }

    // Get categories for filter options
    const { data: categories } = await supabase
      .from('tutorial_videos')
      .select('feature_category')
      .order('feature_category');

    const uniqueCategories = [...new Set(categories?.map(c => c.feature_category) || [])];

    return {
      videos: videos || [],
      categories: uniqueCategories,
      totalCount: videos?.length || 0
    };
  } catch (error) {
    console.error('Unexpected error in getVideos:', error);
    throw error;
  }
}

/**
 * Get a single video by ID
 */
export async function getVideo(videoId: string): Promise<Video & { script: string | null }> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Get video data
    const { data: video, error: videoError } = await supabase
      .from('tutorial_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      throw new Error('Video not found');
    }

    // Get video script
    const { data: script, error: scriptError } = await supabase
      .from('video_scripts')
      .select('content')
      .eq('video_id', videoId)
      .single();

    return {
      ...video,
      script: script?.content || null
    };
  } catch (error) {
    console.error('Unexpected error in getVideo:', error);
    throw error;
  }
}

/**
 * Update a video (admin only)
 */
export async function updateVideo(
  videoId: string,
  updates: Partial<Video>
): Promise<Video> {
  try {
    const supabase = await createClient();

    // Note: RLS will enforce admin access - if user is not admin, queries will fail
    // Update video data
    const { data: video, error: videoError } = await supabase
      .from('tutorial_videos')
      .update(updates)
      .eq('id', videoId)
      .select()
      .single();

    if (videoError) {
      console.error('Error updating video:', videoError);
      throw new Error('Failed to update video');
    }

    return video;
  } catch (error) {
    console.error('Unexpected error in updateVideo:', error);
    throw error;
  }
}

/**
 * Get video script
 */
export async function getVideoScript(videoId: string): Promise<{
  script: any;
}> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    if (!videoId) {
      throw new Error('Video ID is required');
    }

    // Get video script with video details
    const { data: script, error: scriptError } = await supabase
      .from('video_scripts')
      .select(`
        *,
        tutorial_videos (
          id,
          title,
          description,
          duration,
          feature_category,
          theory_level_required,
          tech_level_required,
          app_mode_applicability,
          musical_context
        )
      `)
      .eq('video_id', videoId)
      .maybeSingle();

    if (scriptError) {
      console.error('Error fetching video script:', scriptError);
      throw new Error('Failed to fetch video script');
    }

    if (!script) {
      throw new Error('Video script not found');
    }

    return { script };
  } catch (error) {
    console.error('Unexpected error in getVideoScript:', error);
    throw error;
  }
}

export interface VideoWithDuration {
  id: string;
  title: string;
  description: string;
  youtube_video_id: string;
  duration: number;
  duration_cached: boolean;
  duration_last_updated: string | null;
  needs_duration_fetch: boolean;
}

export interface GetVideosWithDurationsResponse {
  videos: VideoWithDuration[];
  total: number;
  cached_count: number;
  needs_fetch_count: number;
}

/**
 * Get videos with cached durations
 */
export async function getVideosWithDurations(
  videoIds?: string[]
): Promise<GetVideosWithDurationsResponse> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    let query = supabase
      .from('tutorial_videos')
      .select('id, title, description, youtube_video_id, youtube_duration_cached, youtube_duration_last_updated, duration');

    // Filter by specific video IDs if provided
    if (videoIds && videoIds.length > 0) {
      query = query.in('id', videoIds);
    }

    const { data: videos, error } = await query;

    if (error) {
      console.error('Error fetching videos with cached durations:', error);
      throw new Error('Failed to fetch videos');
    }

    // Transform the data to include duration information
    const videosWithDuration = videos?.map(video => ({
      id: video.id,
      title: video.title,
      description: video.description,
      youtube_video_id: video.youtube_video_id,
      duration: video.youtube_duration_cached || video.duration || 300, // Use cached duration, fallback to stored duration, then default
      duration_cached: !!video.youtube_duration_cached,
      duration_last_updated: video.youtube_duration_last_updated,
      needs_duration_fetch: !video.youtube_duration_cached && !!video.youtube_video_id
    })) || [];

    return {
      videos: videosWithDuration,
      total: videosWithDuration.length,
      cached_count: videosWithDuration.filter(v => v.duration_cached).length,
      needs_fetch_count: videosWithDuration.filter(v => v.needs_duration_fetch).length
    };
  } catch (error) {
    console.error('Unexpected error in getVideosWithDurations:', error);
    throw error;
  }
}

