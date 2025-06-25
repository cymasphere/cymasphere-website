import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// GET /api/email-campaigns/audiences/[id]/subscribers - Get subscribers for an audience
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 GET subscribers API started');
  
  try {
  const supabase = await createSupabaseServer();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 GET Auth check:', {
      hasUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      authError: authError?.message,
      hasCookies: !!request.headers.get('cookie'),
      cookieLength: request.headers.get('cookie')?.length || 0
    });
    
    if (authError || !user) {
      console.log('❌ GET Auth failed:', authError?.message);
      return NextResponse.json({ 
        error: 'Authentication required',
        debug: {
          authError: authError?.message,
          hasUser: !!user,
          hasCookies: !!request.headers.get('cookie')
        }
      }, { status: 401 });
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('*')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      console.log('❌ Admin check failed');
      return NextResponse.json({ 
        error: 'Admin access required' 
      }, { status: 403 });
    }

    console.log('✅ Auth and admin check passed');

    // Create service role client for admin operations (bypasses RLS)
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔑 Using service role key for admin operations');

    const { id } = await params;
    console.log('Getting subscribers for audience:', id);

    // Get audience to check if it's static
    const { data: audience } = await adminSupabase
      .from('email_audiences')
      .select('id, name, filters')
      .eq('id', id)
      .single();

    if (!audience) {
      console.log('❌ Audience not found');
      return NextResponse.json({ 
        error: 'Audience not found' 
      }, { status: 404 });
    }

    const filters = audience.filters as any || {};
    console.log('Audience type:', filters.audience_type);

    // For static audiences, get subscribers from the junction table
    if (filters.audience_type === 'static') {
      console.log('📋 Static audience - getting subscribers from junction table');
      
      // Get subscriber IDs from junction table
      const { data: relations, error: relationsError } = await adminSupabase
        .from('email_audience_subscribers')
        .select('subscriber_id')
        .eq('audience_id', id);

      console.log(`Found ${relations?.length || 0} subscriber relations`);
      console.log('Relations data:', relations);
      console.log('Relations error:', relationsError);

      if (!relations || relations.length === 0) {
        console.log('❌ No relations found, returning empty');
        return NextResponse.json({
          subscribers: [],
          pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
        });
      }

      // Get actual subscriber data
      const subscriberIds = relations.map((r: any) => r.subscriber_id).filter((id: any): id is string => Boolean(id));
      console.log('Subscriber IDs to fetch:', subscriberIds);
      
      const { data: subscribers, error: subscribersError } = await adminSupabase
        .from('subscribers')
        .select('id, email, status, created_at, metadata')
        .in('id', subscriberIds);

      console.log(`Retrieved ${subscribers?.length || 0} subscriber details`);
      console.log('Subscribers data:', subscribers);
      console.log('Subscribers error:', subscribersError);

      // Transform to expected format
      const formattedSubscribers = (subscribers || []).map((sub: any) => {
        const metadata = (sub.metadata as any) || {};
        return {
          id: sub.id,
          name: [metadata.first_name, metadata.last_name].filter(Boolean).join(' ') || 'Unknown User',
          email: sub.email,
          status: sub.status || 'active',
          subscribeDate: sub.created_at || new Date().toISOString(),
          lastActivity: sub.created_at || new Date().toISOString(),
          engagement: 'Medium',
          source: 'manual',
          tags: [],
          subscriptionType: metadata.subscription || 'unknown'
        };
      });

      console.log(`✅ Returning ${formattedSubscribers.length} subscribers`);

      return NextResponse.json({
        subscribers: formattedSubscribers,
        pagination: {
          page: 1,
          limit: 10,
          total: formattedSubscribers.length,
          totalPages: 1
        }
      });
    }

    // For dynamic audiences, return empty for now
    console.log('🔄 Dynamic audience - not implemented yet');
    return NextResponse.json({
      subscribers: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// POST /api/email-campaigns/audiences/[id]/subscribers - Add subscriber to static audience
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 POST add subscriber API started');
  
  try {
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

    // Create service role client for admin operations (bypasses RLS)
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔑 POST: Using service role key for admin operations');

    const { id } = await params;
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    console.log('Adding subscriber:', email, 'to audience:', id);

    // Check if audience is static
    const { data: audience } = await adminSupabase
      .from('email_audiences')
      .select('id, filters')
      .eq('id', id)
      .single();

    if (!audience) {
      return NextResponse.json({ 
        error: 'Audience not found' 
      }, { status: 404 });
    }

    const filters = audience.filters as any || {};
    if (filters.audience_type !== 'static') {
      return NextResponse.json({ 
        error: 'Can only add subscribers to static audiences' 
      }, { status: 400 });
    }

    // Find or create subscriber
    let { data: subscriber } = await adminSupabase
      .from('subscribers')
      .select('id')
      .eq('email', email)
      .single();

    if (!subscriber) {
      console.log('Creating new subscriber for:', email);
      const { data: newSubscriber, error: createError } = await adminSupabase
        .from('subscribers')
        .insert({
          id: crypto.randomUUID(),
          email: email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {}
        })
        .select('id')
        .single();

      if (createError) {
        console.error('Failed to create subscriber:', createError);
        return NextResponse.json({ 
          error: 'Failed to create subscriber' 
        }, { status: 500 });
      }

      subscriber = newSubscriber;
    }

    console.log('Using subscriber ID:', subscriber.id);

    // Check if already in audience
    const { data: existing } = await adminSupabase
      .from('email_audience_subscribers')
      .select('id')
      .eq('audience_id', id)
      .eq('subscriber_id', subscriber.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ 
        error: 'Subscriber already in audience' 
      }, { status: 409 });
    }

    // Add to audience
    const { error: addError } = await adminSupabase
      .from('email_audience_subscribers')
      .insert({
        audience_id: id,
        subscriber_id: subscriber.id,
        added_at: new Date().toISOString()
      });

    if (addError) {
      console.error('Failed to add to audience:', addError);
      return NextResponse.json({ 
        error: 'Failed to add subscriber to audience' 
      }, { status: 500 });
    }

    console.log('✅ Subscriber added successfully');

      return NextResponse.json({
      message: 'Subscriber added successfully' 
    }, { status: 201 });

  } catch (error) {
    console.error('❌ Add subscriber error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/email-campaigns/audiences/[id]/subscribers - Remove subscriber from static audience
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('🚀 DELETE subscriber API started');
  
  try {
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

    // Create service role client for admin operations (bypasses RLS)
    const { createClient } = require('@supabase/supabase-js');
    const adminSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    console.log('🔑 DELETE: Using service role key for admin operations');

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const subscriberId = searchParams.get('subscriberId');

    if (!subscriberId) {
      return NextResponse.json({ 
        error: 'subscriberId is required' 
      }, { status: 400 });
    }

    console.log('Removing subscriber:', subscriberId, 'from audience:', id);

    // Remove from audience
    const { error: removeError } = await adminSupabase
      .from('email_audience_subscribers')
      .delete()
      .eq('audience_id', id)
      .eq('subscriber_id', subscriberId);

    if (removeError) {
      console.error('Failed to remove subscriber:', removeError);
      return NextResponse.json({ 
        error: 'Failed to remove subscriber' 
      }, { status: 500 });
    }

    console.log('✅ Subscriber removed successfully');

    return NextResponse.json({
      message: 'Subscriber removed successfully'
    });

  } catch (error) {
    console.error('❌ Remove subscriber error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 
