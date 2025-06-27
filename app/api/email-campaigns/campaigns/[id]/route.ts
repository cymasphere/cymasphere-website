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

    // Get campaign with updated schema fields
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

    // Get audience relationships from junction table
    const { data: audienceRelations, error: audienceError } = await supabase
      .from('email_campaign_audiences')
      .select('audience_id, is_excluded')
      .eq('campaign_id', campaignId);

    if (audienceError) {
      console.error('Error fetching campaign audiences:', audienceError);
      // Don't fail the request, just log the error
    }

    console.log('🔍 Audience relations:', JSON.stringify(audienceRelations, null, 2));

    // Separate included and excluded audiences
    const audienceIds: string[] = [];
    const excludedAudienceIds: string[] = [];

    if (audienceRelations) {
      for (const relation of audienceRelations) {
        if (relation.audience_id) { // Check for null
          if (relation.is_excluded) {
            excludedAudienceIds.push(relation.audience_id);
          } else {
            audienceIds.push(relation.audience_id);
          }
        }
      }
    }

    // Transform the data for frontend consumption with new schema fields
    const transformedCampaign = {
      ...campaign,
      senderName: campaign.sender_name || (campaign as any).from_name, // Fallback to old field
      senderEmail: campaign.sender_email || (campaign as any).from_email, // Fallback to old field
      replyToEmail: campaign.reply_to_email || (campaign as any).reply_to, // Fallback to old field
      audienceIds,
      excludedAudienceIds
    };

    console.log('🔍 Using new schema fields:');
    console.log('  - sender_name:', campaign.sender_name);
    console.log('  - sender_email:', campaign.sender_email);
    console.log('  - reply_to_email:', campaign.reply_to_email);
    console.log('  - preheader:', campaign.preheader);
    console.log('  - html_content:', campaign.html_content ? 'present' : 'null');
    console.log('  - text_content:', campaign.text_content ? 'present' : 'null');
    console.log('🔍 Transformed campaign data:', JSON.stringify(transformedCampaign, null, 2));

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

// PUT /api/email-campaigns/campaigns/[id] - Update campaign
export async function PUT(
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
    const body = await request.json();
    const { 
      name, 
      subject, 
      senderName, 
      senderEmail, 
      replyToEmail, 
      preheader, 
      description,
      htmlContent,
      textContent,
      audienceIds = [], 
      excludedAudienceIds = [], 
      template_id,
      status,
      scheduled_at
    } = body;

    console.log('🔄 PUT /api/email-campaigns/campaigns/[id] - Campaign ID:', campaignId);
    console.log('📊 Update data received:', {
      name, subject, senderName, senderEmail, replyToEmail, 
      audienceIds, excludedAudienceIds
    });

    // Update campaign using correct field names
    const { data: campaign, error } = await supabase
      .from('email_campaigns')
      .update({
        name,
        subject,
        description,
        sender_name: senderName,
        sender_email: senderEmail, 
        reply_to_email: replyToEmail,
        preheader,
        html_content: htmlContent,
        text_content: textContent,
        template_id,
        status,
        scheduled_at,
        updated_at: new Date().toISOString()
      })
      .eq('id', campaignId)
      .select()
      .single();

    if (error) {
      console.error('Error updating campaign:', error);
      return NextResponse.json({ 
        error: 'Failed to update campaign',
        details: error.message 
      }, { status: 500 });
    }

    console.log('✅ Campaign updated:', campaignId);

    // Update audience relationships by replacing existing ones
    // First, delete existing relationships
    const { error: deleteError } = await supabase
      .from('email_campaign_audiences')
      .delete()
      .eq('campaign_id', campaignId);

    if (deleteError) {
      console.error('Error deleting existing campaign audiences:', deleteError);
      // Don't fail the entire request, just log the error
    }

    // Insert new audience relationships
    const audienceInserts = [];

    // Add included audiences
    for (const audienceId of audienceIds) {
      audienceInserts.push({
        campaign_id: campaignId,
        audience_id: audienceId,
        is_excluded: false
      });
    }

    // Add excluded audiences
    for (const audienceId of excludedAudienceIds) {
      audienceInserts.push({
        campaign_id: campaignId,
        audience_id: audienceId,
        is_excluded: true
      });
    }

    // Insert new audience relationships if any
    if (audienceInserts.length > 0) {
      const { error: audienceError } = await supabase
        .from('email_campaign_audiences')
        .insert(audienceInserts);

      if (audienceError) {
        console.error('🚨 Database error updating campaign audiences:', audienceError);
        // Don't fail the entire request, just log the error
        console.warn('⚠️ Campaign updated but audience relationships may have failed');
      } else {
        console.log(`✅ Updated ${audienceInserts.length} audience relationships`);
      }
    }

    return NextResponse.json({ 
      campaign,
      audienceCount: audienceInserts.length,
      message: 'Campaign updated successfully'
    });

  } catch (error) {
    console.error('Update campaign API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// DELETE /api/email-campaigns/campaigns/[id] - Delete campaign
export async function DELETE(
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
    
    console.log('🗑️ DELETE /api/email-campaigns/campaigns/[id] - Campaign ID:', campaignId);

    // First, get the campaign to verify it exists and get its details
    const { data: campaign, error: fetchError } = await supabase
      .from('email_campaigns')
      .select('id, name, status')
      .eq('id', campaignId)
      .single();

    if (fetchError || !campaign) {
      console.error('Campaign not found:', fetchError);
      return NextResponse.json({ 
        error: 'Campaign not found' 
      }, { status: 404 });
    }

    // Prevent deletion of sent campaigns for data integrity
    if (campaign.status === 'sent' || campaign.status === 'completed') {
      return NextResponse.json({ 
        error: 'Cannot delete sent campaigns. Archive them instead.' 
      }, { status: 400 });
    }

    console.log(`🗑️ Deleting campaign: "${campaign.name}" (Status: ${campaign.status})`);

    // Delete associated audience relationships first (foreign key constraints)
    const { error: audienceDeleteError } = await supabase
      .from('email_campaign_audiences')
      .delete()
      .eq('campaign_id', campaignId);

    if (audienceDeleteError) {
      console.error('Error deleting campaign audience relationships:', audienceDeleteError);
      // Continue with deletion anyway - this is not critical
    }

    // Delete the campaign
    const { error: deleteError } = await supabase
      .from('email_campaigns')
      .delete()
      .eq('id', campaignId);

    if (deleteError) {
      console.error('Error deleting campaign:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete campaign',
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log('✅ Campaign deleted successfully:', campaignId);

    return NextResponse.json({ 
      message: 'Campaign deleted successfully',
      deletedCampaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status
      }
    });

  } catch (error) {
    console.error('Delete campaign API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 