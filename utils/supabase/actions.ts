/**
 * @fileoverview Supabase server actions for authentication and profile management
 * 
 * This file contains server actions for user authentication, profile fetching,
 * and admin checks. Includes integration with Stripe for customer creation
 * during signup and subscriber creation for email campaigns.
 * 
 * @module utils/supabase/actions
 */

"use server";

import { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { Profile } from "@/utils/supabase/types";
import { findOrCreateCustomer } from "@/utils/stripe/actions";

/**
 * @brief Server action to sign up a user with Stripe customer creation
 * 
 * Creates a new user account with Supabase Auth and automatically:
 * - Creates or finds a Stripe customer for the user
 * - Creates a subscriber record for email campaigns
 * - Links the user profile with Stripe customer ID
 * 
 * @param first_name User's first name
 * @param last_name User's last name
 * @param email User's email address
 * @param password User's password
 * @returns Promise with Supabase auth response
 * @note Creates Stripe customer before user signup
 * @note Creates subscriber record after successful signup
 * @note Does not fail signup if subscriber creation fails
 * 
 * @example
 * ```typescript
 * const result = await signUpWithStripe("John", "Doe", "john@example.com", "password123");
 * // Returns: { data: { user: {...}, session: {...} }, error: null }
 * ```
 */
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
          .from("subscribers")
          .insert({
            id: authResponse.data.user.id, // Use user ID as subscriber ID
            user_id: authResponse.data.user.id,
            email: authResponse.data.user.email || email, // Use fallback email
            source: "signup",
            status: "active",
            tags: ["free-user"],
            metadata: {
              first_name: first_name || "",
              last_name: last_name || "",
              subscription: "none",
              auth_created_at: authResponse.data.user.created_at,
              profile_updated_at: new Date().toISOString(),
            },
          });

        if (subscriberError) {
          console.error("Failed to create subscriber:", subscriberError);
          // Don't fail the signup if subscriber creation fails
        } else {
          console.log(
            "Subscriber created successfully for user:",
            authResponse.data.user.id
          );
        }
      } catch (subscriberError) {
        console.error("Error creating subscriber:", subscriberError);
        // Don't fail the signup if subscriber creation fails
      }
    }

    return authResponse;
  } catch (error) {
    console.error("Error in signUp:", error);
    throw error;
  }
}

/**
 * @brief Server action to fetch user profile by ID
 * 
 * Retrieves a user's profile from the profiles table by user ID.
 * 
 * @param id User ID to fetch profile for
 * @returns Promise with profile data or error
 * 
 * @example
 * ```typescript
 * const { profile, error } = await fetchProfile("user-uuid");
 * // Returns: { profile: {...}, error: null }
 * ```
 */
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

/**
 * @brief Server action to check if a user is an admin
 * 
 * Checks if a user has an entry in the admins table.
 * 
 * @param id User ID to check admin status for
 * @returns Promise with admin status boolean and error
 * 
 * @example
 * ```typescript
 * const { is_admin, error } = await fetchIsAdmin("user-uuid");
 * // Returns: { is_admin: true, error: null }
 * ```
 */
export async function fetchIsAdmin(
  id: string
): Promise<{ is_admin: boolean; error: PostgrestError | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("admins")
    .select()
    .eq("user", id)
    .maybeSingle();

  // Handle errors (other than "no rows found" which maybeSingle handles gracefully)
  if (error) {
    console.log(
      `[fetchIsAdmin] Error checking admin status for user ${id}:`,
      error
    );
    return { is_admin: false, error };
  }

  const isAdmin = !!data;
  console.log(`[fetchIsAdmin] User ${id} is_admin:`, isAdmin);
  return { is_admin: isAdmin, error: null };
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
