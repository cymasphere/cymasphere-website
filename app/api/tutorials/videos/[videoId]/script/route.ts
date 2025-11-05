import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

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
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    const { videoId } = await params;

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
      .maybeSingle();

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

