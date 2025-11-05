import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// GET - Retrieve video progress for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { videoId } = await params;
    const userId = user.id;

    const { data: progress, error } = await supabase
      .from('video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('video_id', videoId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching video progress:', error);
      return NextResponse.json({ error: 'Failed to fetch progress' }, { status: 500 });
    }

    return NextResponse.json({ progress: progress || null });
  } catch (error) {
    console.error('Error in GET /api/tutorials/videos/[videoId]/progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST/PUT - Update video progress
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { videoId } = await params;
    const body = await request.json();
    const { watchPercentage, isCompleted, totalWatchTime, playlistId } = body;
    const userId = user.id;

    // Validate input
    if (watchPercentage < 0 || watchPercentage > 100) {
      return NextResponse.json({ error: 'Invalid watch percentage' }, { status: 400 });
    }

    // Upsert progress record
    const { data, error } = await supabase
      .from('video_progress')
      .upsert({
        user_id: userId,
        video_id: videoId,
        playlist_id: playlistId,
        watch_percentage: watchPercentage,
        is_completed: isCompleted || false,
        total_watch_time: totalWatchTime || 0,
        last_watched_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,video_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error updating video progress:', error);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({ progress: data });
  } catch (error) {
    console.error('Error in POST /api/tutorials/videos/[videoId]/progress:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





