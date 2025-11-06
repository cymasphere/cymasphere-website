"use server";

import { createClient } from '@/utils/supabase/server';

export interface GetAudiencesParams {
  limit?: number;
  offset?: number;
  mode?: 'light' | 'full';
  refreshCounts?: boolean;
}

export interface EmailAudience {
  id: string;
  name: string;
  description: string | null;
  subscriber_count: number;
  filters: any;
  created_at: string;
  updated_at: string;
}

export interface GetAudiencesResponse {
  audiences: EmailAudience[];
  total?: number;
}

/**
 * Get all email audiences (admin only)
 */
export async function getAudiences(
  params?: GetAudiencesParams
): Promise<GetAudiencesResponse> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      throw new Error('Admin access required');
    }

    const limit = params?.limit || 50;
    const offset = params?.offset || 0;
    const mode = params?.mode || 'full';
    const refreshCounts = params?.refreshCounts || false;

    // Get audiences (light or full)
    const { data: audiences, error } = await supabase
      .from('email_audiences')
      .select(mode === 'light' ? 'id,name,description,subscriber_count,created_at,updated_at,filters' : '*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audiences:', error);
      throw new Error('Failed to fetch audiences');
    }

    // Calculate/refresh counts if requested
    let audiencesWithCounts = audiences || [];
    
    if (mode === 'light' && refreshCounts && audiences && audiences.length > 0) {
      // Refresh counts for static audiences
      const staticIds = audiences
        .filter((a: any) => (a.filters && typeof a.filters === 'object' && (a.filters as any).audience_type === 'static'))
        .map((a: any) => a.id);
      
      if (staticIds.length > 0) {
        const { data: relations } = await supabase
          .from('email_audience_subscribers')
          .select('audience_id, subscriber_id')
          .in('audience_id', staticIds);
        
        const counts: Record<string, number> = {};
        (relations || []).forEach((r: any) => {
          if (!r.audience_id) return;
          counts[r.audience_id] = (counts[r.audience_id] || 0) + 1;
        });
        
        audiencesWithCounts = audiences.map((a: any) => ({
          ...a,
          subscriber_count: staticIds.includes(a.id) ? (counts[a.id] || 0) : a.subscriber_count
        }));
      }
    } else if (mode === 'full') {
      // Calculate counts for all audiences (dynamic calculation)
      audiencesWithCounts = await Promise.all(
        (audiences || []).map(async (audience) => {
          // Import the helper function (would need to be extracted to a shared utility)
          // For now, use a simplified version
          const count = audience.subscriber_count || 0;
          return {
            ...audience,
            subscriber_count: count
          };
        })
      );
    }

    return {
      audiences: audiencesWithCounts
    };
  } catch (error) {
    console.error('Error in getAudiences:', error);
    throw error;
  }
}

export interface CreateAudienceParams {
  name: string;
  description?: string | null;
  filters?: any;
}

export interface CreateAudienceResponse {
  audience: EmailAudience;
}

/**
 * Create a new email audience (admin only)
 */
export async function createAudience(
  params: CreateAudienceParams
): Promise<CreateAudienceResponse> {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      throw new Error('Admin access required');
    }

    const { name, description, filters } = params;

    if (!name) {
      throw new Error('Name is required');
    }

    // Helper function to calculate subscriber count (inline for now)
    const calculateSubscriberCount = async (filters: any): Promise<number> => {
      try {
        if (!filters || typeof filters !== 'object' || filters === null) {
          return 0;
        }

        const filtersObj = filters as any;
        if (filtersObj.audience_type === 'static') {
          return 0; // Static audiences start with 0
        }

        // For dynamic audiences, we need to calculate from filters
        // This is a simplified version - the full logic is in the API route
        // For now, return 0 and let it be calculated on-demand
        return 0;
      } catch (error) {
        console.error('Error calculating subscriber count:', error);
        return 0;
      }
    };

    // Calculate initial subscriber count
    let initialCount = 0;
    if (filters && typeof filters === 'object' && filters !== null) {
      const filtersObj = filters as any;
      if (filtersObj.audience_type === 'static') {
        initialCount = 0;
      } else {
        initialCount = await calculateSubscriberCount(filters);
      }
    } else {
      initialCount = await calculateSubscriberCount(filters || {});
    }

    // Create new audience
    const { data: audience, error } = await supabase
      .from('email_audiences')
      .insert({
        name,
        description: description || null,
        filters: filters || {},
        created_by: user.id,
        subscriber_count: initialCount,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating audience:', error);
      throw new Error('Failed to create audience');
    }

    return { audience };
  } catch (error) {
    console.error('Error in createAudience:', error);
    throw error;
  }
}

