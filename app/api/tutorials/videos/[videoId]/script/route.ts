import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: { videoId: string } }
) {
  try {
    const { videoId } = params;

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Get video script with video details
    const { data: script, error: scriptError } = await supabase
      .from('video_scripts')
      .select(`
        *,
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
      `)
      .eq('video_id', videoId)
      .single();

    if (scriptError) {
      console.error('Error fetching video script:', scriptError);
      return NextResponse.json({ error: 'Failed to fetch video script' }, { status: 500 });
    }

    if (!script) {
      return NextResponse.json({ error: 'Video script not found' }, { status: 404 });
    }

    return NextResponse.json({ script });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
