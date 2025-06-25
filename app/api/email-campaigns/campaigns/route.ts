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

    // Get campaigns with audience info
    const { data: campaigns, error } = await supabase
      .from('email_campaigns')
      .select(`
        *,
        email_audiences(id, name)
      `)
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

    // Create new campaign
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .insert({
        name,
        subject,
        sender_name: sender_name || 'Cymasphere',
        sender_email: sender_email || 'support@cymasphere.com',
        reply_to_email,
        preheader,
        html_content,
        text_content,
        template_id,
        status,
        scheduled_at,
        created_by: user.id
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating campaign:', error);
      return NextResponse.json({ 
        error: 'Failed to create campaign' 
      }, { status: 500 });
    }

    // Insert included audiences into junction table
    if (audience_ids && audience_ids.length > 0) {
      const includedAudiences = audience_ids.map((audienceId: string) => ({
        campaign_id: campaign.id,
        audience_id: audienceId,
        is_excluded: false
      }));

      const { error: audienceError } = await (supabase as any)
        .from('email_campaign_audiences')
        .insert(includedAudiences);

      if (audienceError) {
        console.error('Error linking audiences to campaign:', audienceError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Insert excluded audiences into junction table
    if (excluded_audience_ids && excluded_audience_ids.length > 0) {
      const excludedAudiences = excluded_audience_ids.map((audienceId: string) => ({
        campaign_id: campaign.id,
        audience_id: audienceId,
        is_excluded: true
      }));

      const { error: excludeError } = await (supabase as any)
        .from('email_campaign_audiences')
        .insert(excludedAudiences);

      if (excludeError) {
        console.error('Error linking excluded audiences to campaign:', excludeError);
        // Don't fail the entire operation, just log the error
      }
    }

    // Fetch the complete campaign with audience relationships
    const { data: completeCampaign, error: fetchError } = await (supabase as any)
      .from('email_campaigns')
      .select(`
        *,
        email_campaign_audiences(
          is_excluded,
          email_audiences(id, name)
        )
      `)
      .eq('id', campaign.id)
      .single();

    return NextResponse.json({ 
      campaign: completeCampaign || campaign 
    }, { status: 201 });

  } catch (error) {
    console.error('Create campaign API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

 