/**
 * Client-side timezone tracking utility
 * Automatically collects and stores timezone data for subscribers
 */

import { createSupabaseBrowser } from './client';
import { getUserTimezone, getTimezoneInfo } from '../timezoneUtils';

/**
 * Update subscriber timezone data
 * This should be called when a user logs in or signs up
 */
export async function updateSubscriberTimezone(userId?: string) {
  try {
    const supabase = createSupabaseBrowser();
    
    // Get current user if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      currentUserId = user.id;
    }
    
    // Get timezone information
    const timezoneInfo = getTimezoneInfo();
    
    // Check if we have timezone data stored in sessionStorage (from signup)
    let storedTimezoneData = null;
    try {
      const stored = sessionStorage.getItem('user_timezone_data');
      if (stored) {
        storedTimezoneData = JSON.parse(stored);
        sessionStorage.removeItem('user_timezone_data'); // Clean up
      }
    } catch (error) {
      console.warn('Could not retrieve stored timezone data:', error);
    }
    
    // Prepare timezone metadata
    const timezoneMetadata = {
      timezone: timezoneInfo.timezone,
      offsetHours: timezoneInfo.offsetHours,
      offsetMinutes: timezoneInfo.offsetMinutes,
      abbreviation: timezoneInfo.abbreviation,
      isDST: timezoneInfo.isDST,
      lastUpdated: new Date().toISOString(),
      // Include signup timezone if available
      ...(storedTimezoneData && { signupTimezone: storedTimezoneData })
    };
    
    // Get current metadata first
    const { data: currentSubscriber } = await supabase
      .from('subscribers')
      .select('metadata')
      .eq('user_id', currentUserId)
      .single();
    
    // Merge timezone data with existing metadata
    const existingMetadata = (currentSubscriber?.metadata as any) || {};
    const updatedMetadata = {
      ...existingMetadata,
      timezone: timezoneMetadata
    };
    
    // Update subscriber metadata with timezone information
    const { error } = await supabase
      .from('subscribers')
      .update({
        metadata: updatedMetadata,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', currentUserId);
    
    if (error) {
      console.warn('Could not update subscriber timezone:', error);
    } else {
      console.log('✅ Subscriber timezone updated:', timezoneInfo.timezone);
    }
    
  } catch (error) {
    console.warn('Error updating subscriber timezone:', error);
  }
}

/**
 * Get subscriber timezone data
 */
export async function getSubscriberTimezone(userId?: string): Promise<string | null> {
  try {
    const supabase = createSupabaseBrowser();
    
    // Get current user if not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      currentUserId = user.id;
    }
    
    // Get subscriber data
    const { data: subscriber } = await supabase
      .from('subscribers')
      .select('metadata')
      .eq('user_id', currentUserId)
      .single();
    
    if (subscriber?.metadata && typeof subscriber.metadata === 'object') {
      const metadata = subscriber.metadata as any;
      return metadata.timezone?.timezone || null;
    }
    
    return null;
    
  } catch (error) {
    console.warn('Error getting subscriber timezone:', error);
    return null;
  }
}

/**
 * Initialize timezone tracking for the current session
 * Call this in your app's main layout or auth context
 */
export function initializeTimezoneTracking() {
  // Only run on client side
  if (typeof window === 'undefined') return;
  
  const supabase = createSupabaseBrowser();
  
  // Listen for auth state changes
  supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // Update timezone when user signs in
      await updateSubscriberTimezone(session.user.id);
    }
  });
  
  // Also update timezone for current user if already logged in
  supabase.auth.getUser().then(({ data: { user } }) => {
    if (user) {
      updateSubscriberTimezone(user.id);
    }
  });
}

/**
 * Check if timezone data needs updating (e.g., user traveled)
 */
export async function checkTimezoneUpdate(userId?: string): Promise<boolean> {
  try {
    const currentTimezone = getUserTimezone();
    const storedTimezone = await getSubscriberTimezone(userId);
    
    // If no stored timezone or it's different, update is needed
    return !storedTimezone || storedTimezone !== currentTimezone;
    
  } catch (error) {
    console.warn('Error checking timezone update:', error);
    return true; // Default to updating if we can't check
  }
} 