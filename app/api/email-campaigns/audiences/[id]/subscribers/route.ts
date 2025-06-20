import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// GET /api/email-campaigns/audiences/[id]/subscribers - Get subscribers for an audience
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';

    // Await params as required by Next.js
    const { id } = await params;

    // First verify the audience exists and get its filters
    const { data: audience, error: audienceError } = await supabase
      .from('email_audiences')
      .select('id, name, filters')
      .eq('id', id)
      .single();

    if (audienceError || !audience) {
      return NextResponse.json({ 
        error: 'Audience not found' 
      }, { status: 404 });
    }

    // Get audience filters to apply dynamically
    let filters = audience.filters as any || {};
    
    // Convert new structured format to simple format for backward compatibility
    if (filters.rules && Array.isArray(filters.rules)) {
      const simpleFilters: any = {};
      filters.rules.forEach((rule: any) => {
        if (rule.field && rule.value) {
          simpleFilters[rule.field] = rule.value;
        }
      });
      filters = simpleFilters;
    }
    
    console.log('Applying filters:', filters);

    // Since we have complex filtering needs, let's work directly with profiles table
    // Build the base query on profiles table with all filters applied at database level
    let profilesQuery = supabase
      .from('profiles')
      .select('id, first_name, last_name, subscription, updated_at');

    // Apply subscription filter
    if (filters.subscription) {
      if (typeof filters.subscription === 'object' && filters.subscription.operator === 'in') {
        profilesQuery = profilesQuery.in('subscription', filters.subscription.value);
      } else {
        profilesQuery = profilesQuery.eq('subscription', filters.subscription);
      }
    }

    // Apply search on names
    if (search) {
      profilesQuery = profilesQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    // Apply date-based filters
    if (filters.signup_date && filters.signup_date.operator === 'within') {
      const daysAgo = parseInt(filters.signup_date.value.replace('_days', ''));
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      profilesQuery = profilesQuery.gte('updated_at', dateThreshold.toISOString());
    }

    if (filters.last_email_open && filters.last_email_open.operator === 'older_than') {
      const daysAgo = parseInt(filters.last_email_open.value.replace('_days', ''));
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      profilesQuery = profilesQuery.lte('updated_at', dateThreshold.toISOString());
    }

    // First get the total count with the same filters
    let countQuery = supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true });

    // Apply the same filters to count query
    if (filters.subscription) {
      if (typeof filters.subscription === 'object' && filters.subscription.operator === 'in') {
        countQuery = countQuery.in('subscription', filters.subscription.value);
      } else {
        countQuery = countQuery.eq('subscription', filters.subscription);
      }
    }

    if (search) {
      countQuery = countQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (filters.signup_date && filters.signup_date.operator === 'within') {
      const daysAgo = parseInt(filters.signup_date.value.replace('_days', ''));
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      countQuery = countQuery.gte('updated_at', dateThreshold.toISOString());
    }

    if (filters.last_email_open && filters.last_email_open.operator === 'older_than') {
      const daysAgo = parseInt(filters.last_email_open.value.replace('_days', ''));
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      countQuery = countQuery.lte('updated_at', dateThreshold.toISOString());
    }

    // Get the total count
    const { count: totalFilteredCount, error: countError } = await countQuery;

    if (countError) {
      console.error('Count query error:', countError);
      return NextResponse.json({ 
        error: 'Failed to count subscribers' 
      }, { status: 500 });
    }

    console.log(`Total filtered profiles: ${totalFilteredCount}`);

    // Now get the paginated results with the same filters
    const { data: profilesData, error: profilesError } = await profilesQuery
      .range((page - 1) * limit, page * limit - 1)
      .order('updated_at', { ascending: false });

    if (profilesError) {
      console.error('Profiles query error:', profilesError);
      return NextResponse.json({ 
        error: 'Failed to fetch profiles' 
      }, { status: 500 });
    }

    console.log(`Retrieved ${profilesData?.length || 0} profiles for page ${page}`);

    // Transform profiles into subscriber format
    const subscribers = (profilesData || []).map(profile => ({
      id: profile.id,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown User',
      email: `${profile.first_name?.toLowerCase() || 'user'}@example.com`, // Generate placeholder email
      status: 'active' as const,
      subscribeDate: profile.updated_at || new Date().toISOString(),
      lastActivity: profile.updated_at || new Date().toISOString(),
      engagement: 'Medium' as const,
      source: 'filter' as const,
      tags: [],
      subscriptionType: profile.subscription || 'none',
      addedToAudience: profile.updated_at || new Date().toISOString()
    }));

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total: totalFilteredCount || 0,
        totalPages: Math.ceil((totalFilteredCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Get audience subscribers API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 