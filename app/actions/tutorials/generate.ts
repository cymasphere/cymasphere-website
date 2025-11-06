"use server";

import { createClient } from '@/utils/supabase/server';

export interface GeneratePlaylistParams {
  theoryLevel: string;
  techLevel: string;
  appMode: string;
  musicalGoals: string[];
  priorExperience: string;
}

export interface GeneratedPlaylist {
  id: string;
  title: string;
  description: string;
  videoCount: number;
  totalDuration: string;
  views: number;
  createdAt: string;
  updatedAt: string;
  isGenerated: boolean;
  userProfile: {
    theoryLevel: string;
    techLevel: string;
    appMode: string;
    musicalGoals: string[];
    priorExperience: string;
  };
  videos: any[];
}

function getLevelValue(level: string): number {
  const levels: Record<string, number> = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'new_to_daws': 1,
    'familiar': 2,
    'expert': 3
  };
  return levels[level] || 1;
}

function calculateTotalDuration(videos: any[]): string {
  const totalSeconds = videos.reduce((sum, video) => sum + (video.duration || 0), 0);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

/**
 * Generate a personalized playlist based on user profile
 */
export async function generatePlaylist(
  params: GeneratePlaylistParams
): Promise<{ playlist: GeneratedPlaylist }> {
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

    const { theoryLevel, techLevel, appMode, musicalGoals, priorExperience } = params;

    // Validate required fields
    if (!theoryLevel || !techLevel || !appMode || !musicalGoals || musicalGoals.length === 0) {
      throw new Error('Missing required profile information');
    }

    // Find the best matching playlist template with flexible matching
    let { data: playlists, error: playlistsError } = await supabase
      .from('tutorial_playlists')
      .select(`
        *,
        playlist_videos (
          sequence_order,
          is_optional,
          is_conditional,
          condition_theory_level,
          condition_tech_level,
          condition_app_mode,
          condition_musical_goal,
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
        )
      `)
      .eq('target_theory_level', theoryLevel)
      .eq('target_tech_level', techLevel)
      .eq('app_mode_filter', appMode);

    // If no exact match, try with flexible matching
    if (!playlists || playlists.length === 0) {
      // Try matching by theory level and app mode only
      const { data: flexiblePlaylists, error: flexibleError } = await supabase
        .from('tutorial_playlists')
        .select(`
          *,
          playlist_videos (
            sequence_order,
            is_optional,
            is_conditional,
            condition_theory_level,
            condition_tech_level,
            condition_app_mode,
            condition_musical_goal,
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
          )
        `)
        .eq('target_theory_level', theoryLevel)
        .or(`app_mode_filter.eq.${appMode},app_mode_filter.eq.both`);

      if (flexibleError) {
        console.error('Error fetching flexible playlists:', flexibleError);
        throw new Error('Failed to fetch playlists');
      }

      playlists = flexiblePlaylists;
    }

    // If still no match, get any playlist as fallback
    if (!playlists || playlists.length === 0) {
      const { data: fallbackPlaylists, error: fallbackError } = await supabase
        .from('tutorial_playlists')
        .select(`
          *,
          playlist_videos (
            sequence_order,
            is_optional,
            is_conditional,
            condition_theory_level,
            condition_tech_level,
            condition_app_mode,
            condition_musical_goal,
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
          )
        `)
        .limit(1);

      if (fallbackError) {
        console.error('Error fetching fallback playlists:', fallbackError);
        throw new Error('Failed to fetch playlists');
      }

      playlists = fallbackPlaylists;
    }

    if (!playlists || playlists.length === 0) {
      throw new Error('No playlists available');
    }

    // Use the first matching playlist as the base
    const basePlaylist = playlists[0];
    
    // Filter videos based on user profile and conditions
    const filteredVideos = basePlaylist.playlist_videos
      ?.filter(pv => {
        const video = pv.tutorial_videos;
        if (!video) return false;

        // Check theory level requirement
        if (getLevelValue(video.theory_level_required) > getLevelValue(theoryLevel)) {
          return false;
        }

        // Check tech level requirement
        if (getLevelValue(video.tech_level_required) > getLevelValue(techLevel)) {
          return false;
        }

        // Check app mode applicability
        if (video.app_mode_applicability !== 'both' && video.app_mode_applicability !== appMode) {
          return false;
        }

        // Check musical context alignment
        if (video.musical_context !== 'general' && !musicalGoals.includes(video.musical_context)) {
          return false;
        }

        // Check conditional requirements
        if (pv.is_conditional) {
          if (pv.condition_theory_level && getLevelValue(pv.condition_theory_level) > getLevelValue(theoryLevel)) {
            return false;
          }
          if (pv.condition_tech_level && getLevelValue(pv.condition_tech_level) > getLevelValue(techLevel)) {
            return false;
          }
          if (pv.condition_app_mode && pv.condition_app_mode !== appMode) {
            return false;
          }
          if (pv.condition_musical_goal && !musicalGoals.includes(pv.condition_musical_goal)) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => a.sequence_order - b.sequence_order)
      .map(pv => pv.tutorial_videos)
      .filter(Boolean) || [];

    // Create personalized playlist
    const personalizedPlaylist: GeneratedPlaylist = {
      id: `generated-${Date.now()}`,
      title: `Personalized Learning Path - ${theoryLevel} ${appMode}`,
      description: `Custom learning path tailored to your skill level and goals`,
      videoCount: filteredVideos.length,
      totalDuration: calculateTotalDuration(filteredVideos),
      views: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isGenerated: true,
      userProfile: {
        theoryLevel,
        techLevel,
        appMode,
        musicalGoals,
        priorExperience
      },
      videos: filteredVideos
    };

    return { playlist: personalizedPlaylist };
  } catch (error) {
    console.error('Unexpected error in generatePlaylist:', error);
    throw error;
  }
}

