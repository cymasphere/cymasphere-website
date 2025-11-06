"use server";

import { createClient } from '@/utils/supabase/server';

export interface VideoProgress {
  video_id: string;
  user_id: string;
  completed: boolean;
  progress_percentage: number;
  last_watched: string;
  watch_time_seconds: number;
}

/**
 * Get video progress for a user
 */
export async function getVideoProgress(
  userId: string,
  videoId?: string
): Promise<VideoProgress | VideoProgress[]> {
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

    // Ensure user can only access their own progress
    if (user.id !== userId) {
      throw new Error('Unauthorized to access this progress');
    }

    if (videoId) {
      // Get single video progress
      const { data: progress, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('video_id', videoId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching progress:', error);
        throw new Error('Failed to fetch progress');
      }

      return progress || {
        video_id: videoId,
        user_id: userId,
        completed: false,
        progress_percentage: 0,
        last_watched: new Date().toISOString(),
        watch_time_seconds: 0
      };
    } else {
      // Get all progress for user
      const { data: progress, error } = await supabase
        .from('video_progress')
        .select('*')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching progress:', error);
        throw new Error('Failed to fetch progress');
      }

      return progress || [];
    }
  } catch (error) {
    console.error('Unexpected error in getVideoProgress:', error);
    throw error;
  }
}

/**
 * Update video progress
 */
export async function updateVideoProgress(
  videoId: string,
  progress: {
    completed?: boolean;
    progress_percentage?: number;
    watch_time_seconds?: number;
  }
): Promise<VideoProgress> {
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

    // Check if progress exists
    const { data: existingProgress } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('video_id', videoId)
      .single();

    const updateData = {
      ...progress,
      last_watched: new Date().toISOString(),
    };

    if (existingProgress) {
      // Update existing progress
      const { data: updatedProgress, error } = await supabase
        .from('video_progress')
        .update(updateData)
        .eq('user_id', user.id)
        .eq('video_id', videoId)
        .select()
        .single();

      if (error) {
        console.error('Error updating progress:', error);
        throw new Error('Failed to update progress');
      }

      return updatedProgress;
    } else {
      // Create new progress
      const { data: newProgress, error } = await supabase
        .from('video_progress')
        .insert({
          user_id: user.id,
          video_id: videoId,
          completed: progress.completed || false,
          progress_percentage: progress.progress_percentage || 0,
          watch_time_seconds: progress.watch_time_seconds || 0,
          last_watched: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating progress:', error);
        throw new Error('Failed to create progress');
      }

      return newProgress;
    }
  } catch (error) {
    console.error('Unexpected error in updateVideoProgress:', error);
    throw error;
  }
}

