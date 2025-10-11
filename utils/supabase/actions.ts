"use server";

import { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { Profile } from "@/utils/supabase/types";
import { findOrCreateCustomer } from "@/utils/stripe/actions";
import { customerPurchasedProFromSupabase } from "@/utils/stripe/supabase-stripe";

export async function signUpWithStripe(
  first_name: string,
  last_name: string,
  email: string,
  password: string
) {
  try {
    const supabase = await createClient();

    // Find or create a Stripe customer
    const customer_id = await findOrCreateCustomer(email);

    // Sign up the user with Supabase
    const authResponse = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          customer_id,
        },
      },
    });

    // Create subscriber for the new user if signup was successful
    if (authResponse.data.user && !authResponse.error) {
      try {
        const { error: subscriberError } = await supabase
          .from('subscribers')
          .insert({
            id: authResponse.data.user.id, // Use user ID as subscriber ID
            user_id: authResponse.data.user.id,
            email: authResponse.data.user.email || email, // Use fallback email
            source: 'signup',
            status: 'active',
            tags: ['free-user'],
            metadata: {
              first_name: first_name || '',
              last_name: last_name || '',
              subscription: 'none',
              auth_created_at: authResponse.data.user.created_at,
              profile_updated_at: new Date().toISOString()
            }
          });

        if (subscriberError) {
          console.error('Failed to create subscriber:', subscriberError);
          // Don't fail the signup if subscriber creation fails
        } else {
          console.log('Subscriber created successfully for user:', authResponse.data.user.id);
        }
      } catch (subscriberError) {
        console.error('Error creating subscriber:', subscriberError);
        // Don't fail the signup if subscriber creation fails
      }
    }

    return authResponse;
  } catch (error) {
    console.error("Error in signUp:", error);
    throw error;
  }
}

export async function fetchProfile(
  id: string
): Promise<{ profile: Profile | null; error: PostgrestError | null }> {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select()
    .eq("id", id)
    .single();

  return { profile, error };
}

export async function fetchIsAdmin(
  id: string
): Promise<{ is_admin: boolean; error: PostgrestError | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admins")
    .select()
    .eq("user", id)
    .single();

  console.log(`[fetchIsAdmin] Checking admin status for user ${id}:`, { data, error });

  // Handle case where no admin record exists (PGRST116 = no rows returned)
  if (error && error.code === 'PGRST116') {
    console.log(`[fetchIsAdmin] No admin record found for user ${id}`);
    return { is_admin: false, error: null };
  }

  // Handle other errors
  if (error) {
    console.log(`[fetchIsAdmin] Error checking admin status:`, error);
    return { is_admin: false, error };
  }

  const isAdmin = !!data;
  console.log(`[fetchIsAdmin] User ${id} is_admin:`, isAdmin);
  return { is_admin: isAdmin, error: null };
}

/**
 * Updates a user's subscription status by checking the Stripe tables in Supabase
 *
 * Logic:
 * - No need to check for rate limits since we're querying our own database
 * - Uses the stripe_tables schema to check subscription status
 * - Updates profile with appropriate status
 */
export async function updateStripe(
  email: string,
  profile: Profile
): Promise<{ success: boolean; profile?: Profile; error?: Error | unknown }> {
  try {
    let updatedProfile: Profile = { ...profile };
    // If no customer ID, user has no Stripe purchases
    if (!updatedProfile.customer_id) {
      updatedProfile.customer_id = await findOrCreateCustomer(email);
    }

    // Use the Supabase Stripe tables to check customer status
    const customerStatus = await customerPurchasedProFromSupabase(
      updatedProfile.customer_id
    );

    if (!customerStatus.success) {
      return { success: false, error: customerStatus.error };
    }

    updatedProfile.subscription = customerStatus.subscription;
    updatedProfile.subscription_expiration =
      customerStatus.subscription_expiration?.toISOString() || null;
    updatedProfile.trial_expiration =
      customerStatus.trial_end_date?.toISOString() || null;

    if (
      updatedProfile.customer_id != profile.customer_id ||
      updatedProfile.subscription != profile.subscription ||
      updatedProfile.subscription_expiration !=
        profile.subscription_expiration ||
      updatedProfile.trial_expiration != profile.trial_expiration
    ) {
      updatedProfile = await updateUserProfile(updatedProfile);
    }

    return { success: true, profile: updatedProfile };
  } catch (error) {
    return { success: false, error };
  }
}

// Helper function to update the user profile
async function updateUserProfile(profile: Profile): Promise<Profile> {
  const supabase = await createClient();
  const { data: user, error: user_error } = await supabase.auth.getUser();

  console.log("updating user", !!user);

  if (user_error) {
    console.log("Error getting user:", user_error);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(profile, { count: "exact" })
    .eq("id", profile.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
}

/**
 * Fetches the sessions for a user
 */
export async function fetchUserSessions(): Promise<{
  sessions: { ip: string; device_name: string; last_used: string }[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: user_error,
    } = await supabase.auth.getUser();

    if (user_error) {
      console.error("Error getting user:", user_error);
      return { sessions: [], error: "Failed to fetch user" };
    }

    if (user) {
      // row level security prevents selecting sessions for other users
      const { data, error } = await supabase
        .from("user_sessions")
        .select("ip, user_agent, refreshed_at, updated_at, created_at")
        .ilike("user_agent", "cymasphere:%");

      if (error) {
        console.error("Error in fetchUserSession:", error);
        return { sessions: [], error: "Failed to fetch user sessions" };
      }

      // Group sessions by user_agent and keep only the most recent session for each unique user agent
      const uniqueSessions = new Map();

      data.forEach((session) => {
        const userAgent = session.user_agent;
        if (userAgent) {
          const lastUsed =
            session.refreshed_at || session.updated_at || session.created_at;

          // If we haven't seen this user agent before, or if this session is more recent
          if (
            !uniqueSessions.has(userAgent) ||
            (lastUsed &&
              new Date(lastUsed) >
                new Date(uniqueSessions.get(userAgent).last_used))
          ) {
            uniqueSessions.set(userAgent, {
              ip: (session.ip as string) || "Unknown",
              device_name: userAgent.replace("cymasphere: ", ""),
              last_used: lastUsed || new Date().toISOString(),
            });
          }
        }
      });

      // Convert Map values to array
      const sessions = Array.from(uniqueSessions.values());

      return { sessions, error: null };
    }

    return { sessions: [], error: "User not found" };
  } catch (error) {
    console.error("Error in fetchUserSession:", error);
    return { sessions: [], error: "Failed to fetch user sessions" };
  }
}
