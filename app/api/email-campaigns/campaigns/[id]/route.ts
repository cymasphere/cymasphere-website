import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// GET /api/email-campaigns/campaigns/[id] - Get single campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const campaignId = params.id;

    // Get campaign
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    console.log('🔍 GET /api/email-campaigns/campaigns/[id] - Campaign ID:', campaignId);
    console.log('🔍 Raw campaign data from database:', JSON.stringify(campaign, null, 2));
    console.log('🔍 Available fields:', campaign ? Object.keys(campaign).sort() : 'none');
    console.log('🔍 Database error:', error);

    if (error) {
      console.error('Error fetching campaign:', error);
      return NextResponse.json({ 
        error: 'Campaign not found' 
      }, { status: 404 });
    }

    // Transform the data for frontend consumption (actual schema has no audience_id field)
    const transformedCampaign = {
      ...campaign,
      senderName: (campaign as any).from_name,
      senderEmail: (campaign as any).from_email,
      replyToEmail: (campaign as any).reply_to,
      audienceIds: [], // No audience_id field in actual schema
      excludedAudienceIds: []
    };

    console.log('🔍 Campaign has no audience_id field in actual schema');
    console.log('🔍 Transformed campaign data:', JSON.stringify(transformedCampaign, null, 2));
    console.log('🔍 Field mapping check:');
    console.log('  - from_name:', (campaign as any).from_name);
    console.log('  - from_email:', (campaign as any).from_email);
    console.log('  - reply_to:', (campaign as any).reply_to);

    return NextResponse.json({
      campaign: transformedCampaign
    });

  } catch (error) {
    console.error('Get campaign API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 