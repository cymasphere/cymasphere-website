import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    // Get playlist data
    const { data: playlist, error: playlistError } = await supabase
      .from('tutorial_playlists')
      .select('*')
      .eq('id', id)
      .single();

    if (playlistError) {
      console.error('Error fetching playlist:', playlistError);
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





