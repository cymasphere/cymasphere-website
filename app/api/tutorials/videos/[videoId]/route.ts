import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;

    // Get video data
    const { data: video, error: videoError } = await supabase
      .from('tutorial_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) {
      console.error('Error fetching video:', videoError);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Get video script
    const { data: script, error: scriptError } = await supabase
      .from('video_scripts')
      .select('content')
      .eq('video_id', videoId)
      .single();

    return NextResponse.json({
      ...video,
      script: script?.content || null
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> }
) {
  try {
    const { videoId } = await params;
    const body = await request.json();

    // Update video data
    const { data: video, error: videoError } = await supabase
      .from('tutorial_videos')
      .update(body)
      .eq('id', videoId)
      .select()
      .single();

    if (videoError) {
      console.error('Error updating video:', videoError);
      return NextResponse.json({ error: 'Failed to update video' }, { status: 400 });
    }

    return NextResponse.json(video);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



