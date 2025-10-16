import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    // Get all playlists with their videos
    const { data: playlists, error: playlistsError } = await supabase
      .from('tutorial_playlists')
      .select(`
        *,
        playlist_videos (
          sequence_order,
          is_optional,
          is_conditional,
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
      .order('name');

    if (playlistsError) {
      console.error('Error fetching playlists:', playlistsError);
      return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
    }

    // Transform the data to match the expected format
    const transformedPlaylists = playlists?.map(playlist => {
      const videos = playlist.playlist_videos
        ?.sort((a, b) => a.sequence_order - b.sequence_order)
        .map(pv => pv.tutorial_videos)
        .filter(Boolean) || [];

      return {
        id: playlist.id,
        title: playlist.name,
        description: playlist.description,
        videoCount: videos.length,
        totalDuration: calculateTotalDuration(videos),
        views: 0, // Placeholder for now
        createdAt: playlist.created_at,
        updatedAt: playlist.updated_at,
        targetTheoryLevel: playlist.target_theory_level,
        targetTechLevel: playlist.target_tech_level,
        appModeFilter: playlist.app_mode_filter,
        musicalGoal: playlist.musical_goal,
        estimatedDuration: playlist.estimated_duration,
        difficultyRating: playlist.difficulty_rating,
        videos: videos
      };
    }) || [];

    return NextResponse.json({ playlists: transformedPlaylists });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
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
