import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/utils/supabase/server';

// Helper function to calculate subscriber count for an audience
async function calculateSubscriberCount(supabase: any, filters: any) {
  try {
    console.log('Calculating subscriber count for filters:', JSON.stringify(filters));
    
    // Handle different filter formats
    if (filters.rules && Array.isArray(filters.rules)) {
      // Handle old format with rules array
      const rule = filters.rules[0]; // For now, handle single rule
      if (rule && rule.field === 'subscription') {
        const { count } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('subscription', rule.value);
        console.log(`Count for subscription '${rule.value}': ${count}`);
        return count || 0;
      }
    }
    
    // Build query based on filters
    let profileQuery = supabase.from('profiles').select('*', { count: 'exact', head: true });
    let subscriberQuery = supabase.from('subscribers').select('*', { count: 'exact', head: true });
    
    let useProfiles = false;
    let useSubscribers = false;
    let needsJoin = false;
    
    // Process each filter
    for (const [field, value] of Object.entries(filters)) {
      if (field === 'subscription') {
        useProfiles = true;
        if (typeof value === 'string') {
          profileQuery = profileQuery.eq('subscription', value);
        } else if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === 'in') {
            profileQuery = profileQuery.in('subscription', filterValue.value);
          }
        }
      } else if (field === 'status') {
        useSubscribers = true;
        if (typeof value === 'string') {
          subscriberQuery = subscriberQuery.eq('status', value);
        }
      } else if (field === 'trial_expiration') {
        useProfiles = true;
        if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === 'gt') {
            profileQuery = profileQuery.gt('trial_expiration', filterValue.value);
          } else if (filterValue.operator === 'lt') {
            profileQuery = profileQuery.lt('trial_expiration', filterValue.value);
          }
        }
      } else if (field === 'created_at') {
        useSubscribers = true;
        if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === 'gte') {
            subscriberQuery = subscriberQuery.gte('created_at', filterValue.value);
          }
        }
      } else if (field === 'updated_at') {
        if (value && typeof value === 'object' && 'operator' in value) {
          const filterValue = value as { operator: string; start?: any; end?: any };
          if (filterValue.operator === 'between' && 'start' in filterValue && 'end' in filterValue) {
            // Could apply to either table, prefer subscribers
            useSubscribers = true;
            subscriberQuery = subscriberQuery
              .gte('updated_at', filterValue.start)
              .lte('updated_at', filterValue.end);
          }
        }
      } else if (field === 'tags') {
        useSubscribers = true;
        if (value && typeof value === 'object' && 'operator' in value && 'value' in value) {
          const filterValue = value as { operator: string; value: any };
          if (filterValue.operator === 'contains') {
            // For tags array contains, we need to check if any of the tags exist
            subscriberQuery = subscriberQuery.overlaps('tags', filterValue.value);
          }
        }
      }
    }
    
    // Determine which approach to use
    if (useProfiles && useSubscribers) {
      // Need to join - this is more complex, let's handle specific cases
      needsJoin = true;
    }
    
    if (needsJoin) {
      // For now, if we need both profiles and subscribers data, 
      // let's handle the most common case: subscription + status
      if (filters.subscription && filters.status) {
        // Get profiles with subscription first
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id')
          .eq('subscription', filters.subscription);
        
        if (!profilesData || profilesData.length === 0) {
          return 0;
        }
        
        const profileIds = profilesData.map((p: any) => p.id);
        
        // Then get subscribers with status and matching profile IDs
        const { count } = await supabase
          .from('subscribers')
          .select('*', { count: 'exact', head: true })
          .eq('status', filters.status)
          .in('user_id', profileIds);
        
        return count || 0;
      }
      
      // For other complex cases, return 0 for now
      console.log('Complex join filters not yet fully supported, returning 0');
      return 0;
    } else if (useProfiles) {
      // Query profiles table only
      const { count } = await profileQuery;
      console.log(`Profiles count: ${count}`);
      return count || 0;
    } else if (useSubscribers) {
      // Query subscribers table only
      const { count } = await subscriberQuery;
      console.log(`Subscribers count: ${count}`);
      return count || 0;
    }
    
    // Default: if no filters match known fields, return 0
    console.log('No matching filters found, returning 0');
    return 0;
    
  } catch (error) {
    console.error('Error in calculateSubscriberCount:', error);
    return 0;
  }
}

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

    // Calculate actual subscriber counts for each audience
    const audiencesWithCounts = await Promise.all(
      (audiences || []).map(async (audience) => {
        const actualCount = await calculateSubscriberCount(supabase, audience.filters || {});
        return {
          ...audience,
          subscriber_count: actualCount
        };
      })
    );

    // Get total count
    const { count, error: countError } = await supabase
      .from('email_audiences')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('Error getting audiences count:', countError);
    }

    return NextResponse.json({
      audiences: audiencesWithCounts || [],
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

    // Calculate initial subscriber count
    const initialCount = await calculateSubscriberCount(supabase, filters || {});

    // Create new audience
    const { data: audience, error } = await supabase
      .from('email_audiences')
      .insert({
        name,
        description: description || null,
        filters: filters || {},
        created_by: user.id,
        subscriber_count: initialCount
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