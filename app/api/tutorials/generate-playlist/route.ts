import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { theoryLevel, techLevel, appMode, musicalGoals, priorExperience } = await request.json();

    // Validate required fields
    if (!theoryLevel || !techLevel || !appMode || !musicalGoals || musicalGoals.length === 0) {
      return NextResponse.json({ error: 'Missing required profile information' }, { status: 400 });
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
        return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
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
        return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
      }

      playlists = fallbackPlaylists;
    }

    if (!playlists || playlists.length === 0) {
      return NextResponse.json({ error: 'No playlists available' }, { status: 404 });
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
    const personalizedPlaylist = {
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

    return NextResponse.json({ playlist: personalizedPlaylist });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function getLevelValue(level: string): number {
  const levels = {
    'beginner': 1,
    'intermediate': 2,
    'advanced': 3,
    'new_to_daws': 1,
    'familiar': 2,
    'expert': 3
  };
  return levels[level as keyof typeof levels] || 1;
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
