import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const { userId, videoId, progress, completed } = await request.json();

    if (!userId || !videoId) {
      return NextResponse.json({ error: 'User ID and Video ID are required' }, { status: 400 });
    }

    // Get or create user tutorial path
    let { data: userPath, error: pathError } = await supabase
      .from('user_tutorial_paths')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pathError && pathError.code !== 'PGRST116') {
      console.error('Error fetching user path:', pathError);
      return NextResponse.json({ error: 'Failed to fetch user path' }, { status: 500 });
    }

    // If no user path exists, create one
    if (!userPath) {
      const { data: newPath, error: createError } = await supabase
        .from('user_tutorial_paths')
        .insert({
          user_id: userId,
          theory_level: 'beginner', // Default values
          tech_level: 'new_to_daws',
          app_mode: 'both',
          musical_goals: ['composition'],
          progress_data: {}
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating user path:', createError);
        return NextResponse.json({ error: 'Failed to create user path' }, { status: 500 });
      }

      userPath = newPath;
    }

    // Update progress data
    const currentProgress = userPath.progress_data || {};
    const videoProgress = {
      videoId,
      progress: progress || 0,
      completed: completed || false,
      lastWatched: new Date().toISOString(),
      ...(completed && { completedAt: new Date().toISOString() })
    };

    currentProgress[videoId] = videoProgress;

    // Update user path with new progress
    const { error: updateError } = await supabase
      .from('user_tutorial_paths')
      .update({
        progress_data: currentProgress,
        updated_at: new Date().toISOString()
      })
      .eq('id', userPath.id);

    if (updateError) {
      console.error('Error updating progress:', updateError);
      return NextResponse.json({ error: 'Failed to update progress' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      progress: videoProgress,
      totalProgress: calculateTotalProgress(currentProgress)
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user progress
    const { data: userPath, error: pathError } = await supabase
      .from('user_tutorial_paths')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pathError) {
      if (pathError.code === 'PGRST116') {
        return NextResponse.json({ progress: {}, totalProgress: 0 });
      }
      console.error('Error fetching user progress:', pathError);
      return NextResponse.json({ error: 'Failed to fetch user progress' }, { status: 500 });
    }

    const progressData = userPath.progress_data || {};
    const totalProgress = calculateTotalProgress(progressData);

    return NextResponse.json({ 
      progress: progressData,
      totalProgress,
      userPath: {
        theoryLevel: userPath.theory_level,
        techLevel: userPath.tech_level,
        appMode: userPath.app_mode,
        musicalGoals: userPath.musical_goals
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateTotalProgress(progressData: any): number {
  const videos = Object.keys(progressData);
  if (videos.length === 0) return 0;
  
  const completedVideos = videos.filter(videoId => progressData[videoId].completed);
  return Math.round((completedVideos.length / videos.length) * 100);
}



