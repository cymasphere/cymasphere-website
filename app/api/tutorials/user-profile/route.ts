import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user profile
    const { data: userPath, error: pathError } = await supabase
      .from('user_tutorial_paths')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (pathError) {
      if (pathError.code === 'PGRST116') {
        return NextResponse.json({ profile: null });
      }
      console.error('Error fetching user profile:', pathError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    // Transform database format to frontend format
    const profile = {
      theoryLevel: userPath.theory_level,
      techLevel: userPath.tech_level,
      appMode: userPath.app_mode,
      musicalGoals: userPath.musical_goals || [],
      priorExperience: userPath.prior_experience || 'none'
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, profile } = await request.json();

    if (!userId || !profile) {
      return NextResponse.json({ error: 'User ID and profile are required' }, { status: 400 });
    }

    // Check if user profile already exists
    const { data: existingPath, error: checkError } = await supabase
      .from('user_tutorial_paths')
      .select('id')
      .eq('user_id', userId)
      .single();

    // Transform frontend format to database format
    const profileData = {
      user_id: userId,
      theory_level: profile.theoryLevel,
      tech_level: profile.techLevel,
      app_mode: profile.appMode,
      musical_goals: profile.musicalGoals,
      prior_experience: profile.priorExperience,
      progress_data: {},
      updated_at: new Date().toISOString()
    };

    let result;
    if (existingPath) {
      // Update existing profile
      const { data, error } = await supabase
        .from('user_tutorial_paths')
        .update(profileData)
        .eq('id', existingPath.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating user profile:', error);
        return NextResponse.json({ error: 'Failed to update user profile' }, { status: 500 });
      }

      result = data;
    } else {
      // Create new profile
      const { data, error } = await supabase
        .from('user_tutorial_paths')
        .insert({
          ...profileData,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating user profile:', error);
        return NextResponse.json({ error: 'Failed to create user profile' }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json({ 
      success: true, 
      profile: {
        theoryLevel: result.theory_level,
        techLevel: result.tech_level,
        appMode: result.app_mode,
        musicalGoals: result.musical_goals,
        priorExperience: result.prior_experience
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}



