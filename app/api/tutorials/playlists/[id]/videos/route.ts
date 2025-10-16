import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id;

    // Get all videos in the playlist with their order
    const { data: playlistVideos, error: playlistError } = await supabase
      .from('playlist_videos')
      .select(`
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
          musical_context,
          component_source_file,
          video_order,
          created_at,
          updated_at
        )
      `)
      .eq('playlist_id', playlistId)
      .order('sequence_order', { ascending: true });

    if (playlistError) {
      console.error('Error fetching playlist videos:', playlistError);
      return NextResponse.json({ error: 'Failed to fetch playlist videos' }, { status: 500 });
    }

    // Transform the data to flatten the structure
    const videos = playlistVideos?.map(pv => ({
      ...pv.tutorial_videos,
      sequence_order: pv.sequence_order,
      is_optional: pv.is_optional,
      is_conditional: pv.is_conditional
    })) || [];

    return NextResponse.json({
      videos,
      totalCount: videos.length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
