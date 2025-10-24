import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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




