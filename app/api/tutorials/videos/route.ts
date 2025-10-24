import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const theoryLevel = searchParams.get('theoryLevel');
    const techLevel = searchParams.get('techLevel');
    const appMode = searchParams.get('appMode');
    const search = searchParams.get('search');

    // Build query
    let query = supabase
      .from('tutorial_videos')
      .select('*')
      .order('feature_category', { ascending: true })
      .order('title', { ascending: true });

    // Apply filters
    if (category && category !== 'all') {
      query = query.eq('feature_category', category);
    }

    if (theoryLevel && theoryLevel !== 'all') {
      query = query.eq('theory_level_required', theoryLevel);
    }

    if (techLevel && techLevel !== 'all') {
      query = query.eq('tech_level_required', techLevel);
    }

    if (appMode && appMode !== 'all') {
      query = query.contains('app_mode_applicability', [appMode]);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    const { data: videos, error } = await query;

    if (error) {
      console.error('Error fetching videos:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    // Get categories for filter options
    const { data: categories } = await supabase
      .from('tutorial_videos')
      .select('feature_category')
      .order('feature_category');

    const uniqueCategories = [...new Set(categories?.map(c => c.feature_category) || [])];

    return NextResponse.json({
      videos: videos || [],
      categories: uniqueCategories,
      totalCount: videos?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}





