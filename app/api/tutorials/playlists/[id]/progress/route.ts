import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Retrieve all video progress for a playlist
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: playlistId } = await params;
    
    // Get user from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

    // Get all videos in the playlist with their progress
    const { data: playlistVideos, error: playlistError } = await supabase
      .from('playlist_videos')
      .select(`
        video_id,
        sequence_order,
        tutorial_videos (
          id,
          title,
          duration,
          youtube_video_id
        )
      `)
      .eq('playlist_id', playlistId)
      .order('sequence_order');

    if (playlistError) {
      console.error('Error fetching playlist videos:', playlistError);
      return NextResponse.json({ error: 'Failed to fetch playlist videos' }, { status: 500 });
    }

    if (!playlistVideos || playlistVideos.length === 0) {
      return NextResponse.json({ progress: [] });
    }

    // Get progress for all videos in the playlist
    const videoIds = playlistVideos.map(pv => pv.video_id);
    const { data: progressData, error: progressError } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', userId)
      .in('video_id', videoIds);

    if (progressError) {
      console.error('Error fetching video progress:', progressError);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    // Combine playlist videos with their progress
    const progressMap = new Map(progressData?.map(p => [p.video_id, p]) || []);
    
    const videosWithProgress = playlistVideos.map(pv => ({
      ...pv.tutorial_videos,
      sequence_order: pv.sequence_order,
      progress: progressMap.get(pv.video_id) || {
        watch_percentage: 0,
        is_completed: false,
        total_watch_time: 0,
        last_watched_at: null
      }
    }));

    return NextResponse.json({ progress: videosWithProgress });
  } catch (error) {
    console.error('Error in GET /api/tutorials/playlists/[playlistId]/progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
