import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const { searchParams } = new URL(request.url);
    const playlistId = searchParams.get('playlistId');
    const videoIds = searchParams.get('videoIds')?.split(',');
    
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
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
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

    return NextResponse.json({ 
      videos: videosWithDuration,
      total: videosWithDuration.length,
      cached_count: videosWithDuration.filter(v => v.duration_cached).length,
      needs_fetch_count: videosWithDuration.filter(v => v.needs_duration_fetch).length
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
