import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// GET /api/email-campaigns/audiences - Get all audiences
export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'Authentication required' 
    }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('*')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ 
      error: 'Admin access required' 
    }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Get audiences
    const { data: audiences, error } = await supabase
      .from('email_audiences')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audiences:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch audiences' 
      }, { status: 500 });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('email_audiences')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting audiences count:', countError);
    }

    return NextResponse.json({
      audiences: audiences || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Audiences API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/email-campaigns/audiences - Create new audience
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ 
      error: 'Authentication required' 
    }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('*')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ 
      error: 'Admin access required' 
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { name, description, filters } = body;

    if (!name) {
      return NextResponse.json({ 
        error: 'Name is required' 
      }, { status: 400 });
    }

    // Create new audience
    const { data: audience, error } = await supabase
      .from('email_audiences')
      .insert({
        name,
        description: description || null,
        filters: filters || {},
        created_by: user.id,
        subscriber_count: 0
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating audience:', error);
      return NextResponse.json({ 
        error: 'Failed to create audience' 
      }, { status: 500 });
    }

    return NextResponse.json({ audience }, { status: 201 });

  } catch (error) {
    console.error('Create audience API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 