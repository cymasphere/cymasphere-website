import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// GET /api/email-campaigns/campaigns - Get all campaigns
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

    // Get campaigns without the problematic join first
    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching campaigns:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch campaigns' 
      }, { status: 500 });
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('email_campaigns')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting campaigns count:', countError);
    }

    return NextResponse.json({
      campaigns: campaigns || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error) {
    console.error('Campaigns API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/email-campaigns/campaigns - Create new campaign
export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  console.log('🔐 POST /api/email-campaigns/campaigns called');
  console.log('📝 Headers:', Object.fromEntries(request.headers.entries()));
  
  // Get authenticated user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  console.log('👤 User:', user ? `${user.email} (${user.id})` : 'null');
  console.log('❌ Auth error:', authError);
  
  if (authError || !user) {
    console.log('🚫 Returning 401 - Authentication required');
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
    const { 
      name, 
      subject, 
      sender_name, 
      sender_email,
      reply_to_email,
      preheader, 
      html_content,
      text_content,
      audience_ids, // Array of audience IDs
      excluded_audience_ids, // Array of excluded audience IDs
      template_id,
      status = 'draft',
      scheduled_at
    } = body;

    if (!name || !subject) {
      return NextResponse.json({ 
        error: 'Name and subject are required' 
      }, { status: 400 });
    }

    // Create new campaign (using actual database field names - no audience_id field exists)
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        subject,
        description: body?.description || null,
        from_name: sender_name || 'Cymasphere',
        from_email: sender_email || 'support@cymasphere.com',
        reply_to: reply_to_email,
        template_id,
        status,
        scheduled_at,
        created_by: user.id
        // Note: audience_id, preheader, html_content, text_content don't exist in current schema
      })
      .select()
      .single();

    if (error) {
      console.error('🚨 Database error creating campaign:', error);
      console.error('🚨 Error details:', JSON.stringify(error, null, 2));
      console.error('🚨 Campaign data being inserted:', {
        name,
        subject,
        from_name: sender_name || 'Cymasphere',
        from_email: sender_email || 'support@cymasphere.com',
        reply_to: reply_to_email,
        template_id,
        status,
        scheduled_at,
        created_by: user.id
      });
      return NextResponse.json({ 
        error: 'Failed to create campaign' 
      }, { status: 500 });
    }

    // Note: Current schema only supports single audience_id per campaign
    // Multiple audience support would require the junction table email_campaign_audiences
    
    return NextResponse.json({ 
      campaign 
    }, { status: 201 });

  } catch (error) {
    console.error('Create campaign API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

 