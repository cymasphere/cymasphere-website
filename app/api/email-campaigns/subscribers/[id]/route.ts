import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  
  // Check if user is authenticated and is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('id')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const subscriberId = params.id;

    // Query the subscriber from the database
    const { data: subscriberData, error: subscriberError } = await supabase
      .from('subscribers')
      .select('*')
      .eq('id', subscriberId)
      .single();

    if (subscriberError || !subscriberData) {
      console.error('Failed to fetch subscriber:', subscriberError);
      return NextResponse.json({ error: 'Subscriber not found' }, { status: 404 });
    }

    // Get the user profile if user_id exists
    let profile = null;
    if (subscriberData.user_id) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, subscription, subscription_expiration')
        .eq('id', subscriberData.user_id)
        .single();
      profile = profileData;
    }

    const subscriber = {
      id: subscriberData.id,
      name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || subscriberData.email?.split('@')[0] || 'Unknown User',
      email: subscriberData.email || '',
      status: subscriberData.status || 'active',
      subscribeDate: subscriberData.subscribe_date,
      lastActivity: subscriberData.updated_at || subscriberData.subscribe_date,
      location: 'Unknown',
      tags: subscriberData.tags || [],
      engagement: 'Medium', // Will be calculated when we have tracking data
      totalOpens: 0, // Will be calculated when we have email_opens table
      totalClicks: 0, // Will be calculated when we have email_clicks table
      subscriptionType: profile?.subscription || 'none',
      userId: subscriberData.user_id
    };

    // Add additional details for the individual page
    const subscriberWithDetails = {
      ...subscriber,
      joinedDate: subscriber.subscribeDate,
      emailOptIn: subscriber.status === 'active',
      smsOptIn: false,
      timezone: "UTC",
      language: "en",
      source: "backfill",
      notes: "",
      customFields: {},
      engagementHistory: [],
      emailHistory: [],
      audiences: []
    };

    return NextResponse.json({ subscriber: subscriberWithDetails });

  } catch (error) {
    console.error('Unexpected error in subscriber detail API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createSupabaseServer();
  
  // Check if user is authenticated and is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('id')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const subscriberId = params.id;
    const body = await request.json();

    // Update the subscriber in the database
    const { data: updatedSubscriber, error: updateError } = await supabase
      .from('subscribers')
      .update({
        email: body.email,
        status: body.status,
        tags: body.tags,
        metadata: body.metadata || {},
        preferences: body.preferences || {}
      })
      .eq('id', subscriberId)
      .select()
      .single();

    if (updateError) {
      console.error('Failed to update subscriber:', updateError);
      return NextResponse.json({ error: 'Failed to update subscriber' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Subscriber updated successfully',
      subscriber: updatedSubscriber
    });

  } catch (error) {
    console.error('Unexpected error in subscriber update API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 