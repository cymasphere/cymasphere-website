import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Check if user is authenticated
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin - REQUIRED for email campaigns access
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('id')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    // Get query parameters
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || 'all';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // First, let's check if the email campaigns tables exist by trying to query subscribers
    // If that fails, we'll show users from auth.users to demonstrate the mismatch
    
    let subscribersData: any[] = [];
    let usersData: any[] = [];
    let totalSubscribers = 0;
    let totalUsers = 0;

    // Build the query with filters
    let query = supabase.from('subscribers').select('*', { count: 'exact' });
    
    // Apply status filter at database level
    if (status !== 'all') {
      query = query.eq('status', status as any);
    }

    // Apply search filter at database level (email only for now)
    if (search) {
      query = query.ilike('email', `%${search}%`);
    }

    // Get total count with filters applied
    const { data: countData, error: countError, count: filteredCount } = await query.range(0, 0);
    const totalFiltered = filteredCount || 0;

    // Get actual subscribers data with pagination and filters
    const { data: subscribersRawData, error: subscribersListError } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order('subscribe_date', { ascending: false });

    if (subscribersListError) {
      console.error('Failed to fetch subscribers:', subscribersListError);
    } else if (subscribersRawData) {
      // Get user profiles for the subscribers
      const userIds = subscribersRawData.map(sub => sub.user_id).filter((id): id is string => Boolean(id));
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, subscription, subscription_expiration')
        .in('id', userIds);

      // Create a map of user profiles for quick lookup
      const profilesMap = new Map(profilesData?.map(p => [p.id, p]) || []);

      subscribersData = subscribersRawData.map((sub: any) => {
        const profile = profilesMap.get(sub.user_id);
        return {
          id: sub.id,
          name: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || sub.email?.split('@')[0] || 'Unknown User',
          email: sub.email || '',
          status: sub.status || 'active',
          subscribeDate: sub.subscribe_date,
          lastActivity: sub.updated_at || sub.subscribe_date,
          location: 'Unknown',
          tags: sub.tags || [],
          engagement: 'Medium', // Will be calculated later when we have tracking data
          totalOpens: 0, // Will be calculated when we have email_opens table
          totalClicks: 0, // Will be calculated when we have email_clicks table
          subscriptionType: profile?.subscription || 'none',
          userId: sub.user_id
        };
      });
    }

    // Get total users and subscribers count for comparison
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
      .range(0, 0);
    
    const { count: subscribersCount } = await supabase
      .from('subscribers')
      .select('id', { count: 'exact' })
      .range(0, 0);
    
    totalUsers = usersCount || 0;
    totalSubscribers = subscribersCount || 0;

    // Stats will be calculated properly when we have more data

    return NextResponse.json({
      subscribers: subscribersData,
      pagination: {
        page,
        limit,
        total: totalFiltered,
        totalPages: Math.ceil(totalFiltered / limit)
      },
      stats: {
        total: totalSubscribers,
        active: totalSubscribers, // Will be calculated properly later
        highEngagement: 0,
        growthRate: '0%'
      },
      debug: {
        message: totalSubscribers === 0 ? 
          `MISMATCH DETECTED: Found ${totalUsers} users but ${totalSubscribers} subscribers. The email campaigns system should create a subscriber for each user.` :
          `Good: Found ${totalUsers} users and ${totalSubscribers} subscribers.`,
        totalUsers,
        totalSubscribers,
        subscribersTableExists: totalSubscribers > 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in subscribers API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = await createSupabaseServer();
  
  // Check if user is authenticated and is admin
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user is admin - REQUIRED for email campaigns access
  const { data: adminCheck } = await supabase
    .from('admins')
    .select('id')
    .eq('user', user.id)
    .single();

  if (!adminCheck) {
    return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { email, tags, metadata } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Create subscriber in the database
    const subscriberId = crypto.randomUUID();
    const { data: newSubscriber, error: createError } = await supabase
      .from('subscribers')
      .insert({
        id: subscriberId,
        email,
        status: 'active',
        source: 'manual',
        tags: tags || [],
        metadata: metadata || {}
      })
      .select()
      .single();

    if (createError) {
      console.error('Failed to create subscriber:', createError);
      return NextResponse.json({ error: 'Failed to create subscriber' }, { status: 500 });
    }

    return NextResponse.json({ subscriber: newSubscriber }, { status: 201 });

  } catch (error) {
    console.error('Unexpected error in subscribers POST:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 