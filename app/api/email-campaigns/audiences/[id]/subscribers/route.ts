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
    const filters = audience.filters as any || {};
    console.log('Applying filters:', filters);

    // Build dynamic query based on audience filters
    // Since there's no FK relationship, we'll fetch subscribers and profiles separately
    let subscribersQuery = supabase
      .from('subscribers')
      .select('id, email, status, subscribe_date, updated_at, tags, user_id');

    // Apply basic filters to subscribers query first
    if (filters.status) {
      subscribersQuery = subscribersQuery.eq('status', filters.status);
    }

    // Apply date-based filters
    if (filters.signup_date && filters.signup_date.operator === 'within') {
      const daysAgo = parseInt(filters.signup_date.value.replace('_days', ''));
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
      subscribersQuery = subscribersQuery.gte('subscribe_date', dateThreshold.toISOString());
    }

    // Apply email opt-in filter
    if (filters.email_opt_in !== undefined) {
      // For now, assume all subscribers in the table have opted in
      // This could be enhanced with an actual opt_in column later
    }

    // Apply search filter on email only (we'll search names after joining with profiles)
    if (search) {
      subscribersQuery = subscribersQuery.ilike('email', `%${search}%`);
    }

    // Check if subscribers table has data, if not, use profiles table directly
    const { count: subscribersCount } = await supabase
      .from('subscribers')
      .select('*', { count: 'exact', head: true });

    console.log('Subscribers count in database:', subscribersCount);

    // If subscribers table is empty, create subscribers from profiles table dynamically
    if (!subscribersCount || subscribersCount === 0) {
      console.log('Subscribers table is empty, using profiles table directly');
      
      // Query profiles directly and create virtual subscribers
      let profilesQuery = supabase
        .from('profiles')
        .select('id, first_name, last_name, subscription, updated_at');

      // Apply subscription filter directly to profiles
      if (filters.subscription) {
        if (filters.subscription.operator === 'in') {
          profilesQuery = profilesQuery.in('subscription', filters.subscription.value);
        } else {
          profilesQuery = profilesQuery.eq('subscription', filters.subscription);
        }
      }

      // Apply search on names only (no email or created_at)
      if (search) {
        profilesQuery = profilesQuery.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      // Get paginated results (order by updated_at since no created_at)
      const { data: profilesData, error: profilesError, count: totalProfilesCount } = await profilesQuery
        .range((page - 1) * limit, page * limit - 1)
        .order('updated_at', { ascending: false, nullsFirst: false });

      if (profilesError) {
        console.error('Profiles query error:', profilesError);
        return NextResponse.json({ 
          error: 'Failed to fetch user profiles' 
        }, { status: 500 });
      }

      // Transform profiles into subscriber format
      const virtualSubscribers = (profilesData || []).filter(profile => {
        // Apply complex filters
        if (filters.tags && Array.isArray(filters.tags)) {
          // Mock: assume some users have tags
          return Math.random() > 0.8; // 20% have required tags
        }

        if (filters.trial_status) {
          if (filters.trial_status === 'active' && profile.subscription !== 'none') return false;
          if (filters.trial_status === 'expired' && profile.subscription !== 'none') return false;
        }

        if (filters.email_opens || filters.email_clicks) {
          return Math.random() > 0.4; // 60% are "engaged"
        }

        if (filters.device_type === 'mobile') {
          return Math.random() > 0.6; // 40% are mobile users
        }

        if (filters.last_email_open?.operator === 'older_than') {
          const activityDate = profile.updated_at;
          if (!activityDate) return true; // Consider as "old" if no update date
          const daysSinceUpdate = Math.floor((new Date().getTime() - new Date(activityDate).getTime()) / (1000 * 60 * 60 * 24));
          const threshold = parseInt(filters.last_email_open.value.replace('_days', ''));
          return daysSinceUpdate >= threshold;
        }

        return true;
      }).map(profile => ({
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown User',
        email: `${profile.first_name || 'user'}@example.com`, // Generate a placeholder email
        status: 'active',
        subscribeDate: profile.updated_at || new Date().toISOString(),
        lastActivity: profile.updated_at || new Date().toISOString(),
        engagement: 'Medium',
        source: 'filter' as const,
        tags: [],
        subscriptionType: profile.subscription || 'none',
        addedToAudience: profile.updated_at || new Date().toISOString()
      }));

      return NextResponse.json({
        subscribers: virtualSubscribers,
        pagination: {
          page,
          limit,
          total: totalProfilesCount || 0,
          totalPages: Math.ceil((totalProfilesCount || 0) / limit)
        }
      });
    }

    // Original subscribers table logic (if it has data)
    const { data: subscribersData, error: subscribersError } = await subscribersQuery
      .range((page - 1) * limit, page * limit - 1)
      .order('subscribe_date', { ascending: false });

    if (subscribersError) {
      console.error('Subscribers query error:', subscribersError);
      return NextResponse.json({ 
        error: 'Failed to fetch subscribers' 
      }, { status: 500 });
    }

    if (!subscribersData || subscribersData.length === 0) {
      return NextResponse.json({
        subscribers: [],
        pagination: {
          page,
          limit,
          total: 0,
          totalPages: 0
        }
      });
    }

    // Get user IDs from subscribers and batch the profiles query
    const userIds = subscribersData
      .map(sub => sub.user_id)
      .filter((id): id is string => Boolean(id));

    // Fetch profiles in batches to avoid URL too large error
    let profiles: any[] = [];
    const batchSize = 50; // Safe batch size for URL length
    if (userIds.length > 0) {
      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);
        const { data: batchProfiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, subscription')
          .in('id', batch);

        if (profilesError) {
          console.error('Profiles query error for batch:', profilesError);
        } else {
          profiles.push(...(batchProfiles || []));
        }
      }
    }

    // Create a map for quick profile lookup
    const profilesMap = new Map<string, any>();
    profiles.forEach(profile => {
      profilesMap.set(profile.id, profile);
    });

    // Apply all filters in memory
    let filteredSubscribers = subscribersData.filter(sub => {
      const profile = profilesMap.get(sub.user_id || '');
      
      // Apply subscription filter - handle both simple and complex formats
      if (filters.subscription) {
        if (typeof filters.subscription === 'string') {
          // Simple format: {"subscription": "none"}
          if (profile?.subscription !== filters.subscription) {
            return false;
          }
        } else if (filters.subscription.operator === 'in') {
          // Complex format: {"subscription": {"operator": "in", "value": ["annual", "lifetime"]}}
          if (!filters.subscription.value.includes(profile?.subscription || 'none')) {
            return false;
          }
        } else if (filters.subscription.operator) {
          // Complex format with other operators
          if (profile?.subscription !== filters.subscription.value) {
            return false;
          }
        }
      }

      // Apply status filter - simple format only
      if (filters.status && sub.status !== filters.status) {
        return false;
      }

      // Apply email opt-in filter
      if (filters.email_opt_in !== undefined) {
        // All subscribers in the table are considered opted in
        if (!filters.email_opt_in) {
          return false;
        }
      }

      // Apply tags filter - handle both array and object formats
      if (filters.tags) {
        const subscriberTags = sub.tags || [];
        if (Array.isArray(filters.tags)) {
          // Simple array format: {"tags": ["beta", "early_access"]}
          const hasRequiredTags = filters.tags.some((tag: string) => subscriberTags.includes(tag));
          if (!hasRequiredTags) {
            return false;
          }
        }
      }

      // Apply interests filter - currently mock implementation
      if (filters.interests && Array.isArray(filters.interests)) {
        // Mock: randomly assign interests for demo purposes
        const mockHasInterests = Math.random() > 0.3; // 70% have matching interests
        if (!mockHasInterests) {
          return false;
        }
      }

              // Apply signup_date filter - handle object format
        if (filters.signup_date) {
          if (typeof filters.signup_date === 'object' && filters.signup_date.operator === 'within') {
            const daysAgo = parseInt(filters.signup_date.value.replace('_days', ''));
            const dateThreshold = new Date();
            dateThreshold.setDate(dateThreshold.getDate() - daysAgo);
            const subscribeDate = new Date(sub.subscribe_date || new Date().toISOString());
            if (subscribeDate < dateThreshold) {
              return false;
            }
          }
        }

              // Apply engagement filters - mock implementation
        if (filters.email_opens || filters.email_clicks) {
          // Mock: assign engagement based on user activity
          const activityDate = sub.updated_at || sub.subscribe_date || new Date().toISOString();
          const lastActivity = new Date(activityDate);
          const daysSinceActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          
          // Consider users with recent activity as "engaged"
          const isEngaged = daysSinceActivity < 30;
          
          if (filters.email_opens?.operator === 'greater_than' && !isEngaged) {
            return false;
          }
          
          if (filters.email_clicks?.operator === 'greater_than' && !isEngaged) {
            return false;
          }
        }

      // Apply trial status filters - handle string format
      if (filters.trial_status) {
        // For demo: treat some free users as trial users
        if (filters.trial_status === 'active') {
          // Mock: only some free users are in "trial"
          const isMockTrialUser = profile?.subscription === 'none' && Math.random() > 0.8;
          if (!isMockTrialUser) {
            return false;
          }
        }
        if (filters.trial_status === 'expired') {
          // Mock: some free users had "expired trials"
          const isMockExpiredTrial = profile?.subscription === 'none' && Math.random() > 0.7;
          if (!isMockExpiredTrial) {
            return false;
          }
        }
      }

      // Apply trial_expiration filter - handle object format
      if (filters.trial_expiration) {
        if (filters.trial_expiration.operator === 'future') {
          // Mock: some users have future trial expiration
          const hasFutureTrial = Math.random() > 0.9; // 10% have active trials
          if (!hasFutureTrial) {
            return false;
          }
        }
        if (filters.trial_expiration.operator === 'past') {
          // Mock: some users had trials that expired
          const hadPastTrial = Math.random() > 0.8; // 20% had past trials
          if (!hadPastTrial) {
            return false;
          }
        }
      }

      // Apply device type filters - mock implementation
      if (filters.device_type) {
        if (filters.device_type === 'mobile') {
          // Mock: randomly assign mobile users
          const isMobileUser = Math.random() > 0.6; // 40% are mobile users
          if (!isMobileUser) {
            return false;
          }
        }
      }

      // Apply mobile usage filter - mock implementation
      if (filters.mobile_usage?.operator === 'greater_than') {
        // Mock: some users have high mobile usage
        const hasHighMobileUsage = Math.random() > 0.5; // 50% have high mobile usage
        if (!hasHighMobileUsage) {
          return false;
        }
      }

              // Apply last email open filters - handle object format
        if (filters.last_email_open?.operator === 'older_than') {
          const threshold = parseInt(filters.last_email_open.value.replace('_days', ''));
          const activityDate = sub.updated_at || sub.subscribe_date || new Date().toISOString();
          const lastActivity = new Date(activityDate);
          const daysSinceActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceActivity < threshold) {
            return false;
          }
        }

        // Apply last login filters - handle object format with between operator
        if (filters.last_login?.operator === 'between') {
          const startDays = parseInt(filters.last_login.start.replace('_days', ''));
          const endDays = parseInt(filters.last_login.end.replace('_days', ''));
          const activityDate = sub.updated_at || sub.subscribe_date || new Date().toISOString();
          const lastActivity = new Date(activityDate);
          const daysSinceActivity = Math.floor((new Date().getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysSinceActivity < startDays || daysSinceActivity > endDays) {
            return false;
          }
        }

      // Apply feature usage filters - mock implementation
      if (filters.feature_usage?.advanced_features?.operator === 'greater_than') {
        // Mock: some users are power users
        const isPowerUser = Math.random() > 0.85; // 15% are power users
        if (!isPowerUser) {
          return false;
        }
      }

      // Apply engagement level filters - mock implementation
      if (filters.engagement_level === 'high') {
        // Mock: assign high engagement based on subscription and activity
        const isHighEngagement = profile?.subscription !== 'none' || Math.random() > 0.7;
        if (!isHighEngagement) {
          return false;
        }
      }

      // Apply previous engagement filters - mock implementation
      if (filters.previous_engagement === 'high') {
        // Mock: some users had high previous engagement
        const hadHighEngagement = Math.random() > 0.6; // 40% had high engagement
        if (!hadHighEngagement) {
          return false;
        }
      }

      return true;
    });

    // Apply name search filter if specified and we have profiles
    if (search && profiles.length > 0) {
      const searchLower = search.toLowerCase();
      filteredSubscribers = filteredSubscribers.filter(sub => {
        if (!sub.user_id) return sub.email.toLowerCase().includes(searchLower);
        const profile = profilesMap.get(sub.user_id);
        const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ').toLowerCase();
        return sub.email.toLowerCase().includes(searchLower) || 
               fullName.includes(searchLower);
      });
    }

    // Apply pagination to filtered results
    const totalCount = filteredSubscribers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    filteredSubscribers = filteredSubscribers.slice(startIndex, endIndex);

    // Transform the data to match the expected format
    const subscribers = filteredSubscribers.map((subscriber: any) => {
      const profile = profilesMap.get(subscriber.user_id);
      
      return {
        id: subscriber.id,
        name: profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') : 
              subscriber.email?.split('@')[0] || 'Unknown User',
        email: subscriber.email || '',
        status: subscriber.status || 'active',
        subscribeDate: subscriber.subscribe_date,
        lastActivity: subscriber.updated_at || subscriber.subscribe_date,
        engagement: 'Medium', // Will be calculated when we have tracking data
        source: 'filter' as const,
        tags: subscriber.tags || [],
        subscriptionType: profile?.subscription || 'none',
        addedToAudience: subscriber.subscribe_date // For dynamic audiences, use subscribe date
      };
    });

    return NextResponse.json({
      subscribers,
      pagination: {
        page,
        limit,
        total: totalCount || 0,
        totalPages: Math.ceil((totalCount || 0) / limit)
      }
    });

  } catch (error) {
    console.error('Get audience subscribers API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
} 