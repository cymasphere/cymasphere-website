import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// GET - Retrieve video progress for a user
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    
    // Get user from request headers (set by middleware)
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

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
    const { videoId } = await params;
    const body = await request.json();
    const { watchPercentage, isCompleted, totalWatchTime, playlistId } = body;

    // Get user from request headers
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 });
    }

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




