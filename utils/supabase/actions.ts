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
import { getRegistrationDisplayName } from "@/utils/registration-display-name";
import { findOrCreateCustomer } from "@/utils/stripe/actions";
import {
  ensureRevokeCymasphereDeviceFunction,
  getSupabaseDbPassword,
  revokeCymasphereDeviceSessionsDirect,
} from "@/utils/supabase/device-session-db";
import {
  extractCymasphereDeviceHost,
  formatCymasphereDeviceName,
} from "@/utils/supabase/cymasphere-device";

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

    const registrationDisplayName = getRegistrationDisplayName({
      email,
      firstName: first_name,
      lastName: last_name,
    });

    // Sign up the user with Supabase
    const authResponse = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          last_name,
          customer_id,
          name: registrationDisplayName,
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
              name: registrationDisplayName,
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

/** Cymasphere app session row returned to the dashboard settings UI. */
export type CymasphereDeviceSession = {
  ip: string;
  device_name: string;
  last_used: string;
  user_agent: string;
};

/**
 * @brief Fetches active Cymasphere app sessions for the authenticated user.
 * @description Only returns sessions whose user agent starts with `cymasphere:`.
 * Sessions are grouped by user agent so each physical app install appears once.
 * @returns Cymasphere app sessions and an error message when the fetch fails.
 */
export async function fetchUserSessions(): Promise<{
  sessions: CymasphereDeviceSession[];
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

      // Group sessions by stable device host so OS updates do not appear as new devices.
      const uniqueSessions = new Map<string, CymasphereDeviceSession>();

      data.forEach((session) => {
        const userAgent = session.user_agent;
        if (userAgent) {
          const deviceHost = extractCymasphereDeviceHost(userAgent);
          const lastUsed =
            session.refreshed_at || session.updated_at || session.created_at;

          if (
            !uniqueSessions.has(deviceHost) ||
            (lastUsed &&
              new Date(lastUsed) >
                new Date(uniqueSessions.get(deviceHost)!.last_used))
          ) {
            uniqueSessions.set(deviceHost, {
              ip: (session.ip as string) || "Unknown",
              device_name: formatCymasphereDeviceName(userAgent),
              last_used: lastUsed || new Date().toISOString(),
              user_agent: userAgent,
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

/**
 * @brief Revokes all auth sessions for one Cymasphere app device.
 * @description Deletes every `auth.sessions` row for the current user that matches
 * the provided Cymasphere user agent. Web browser sessions are never affected.
 * @param userAgent Full Cymasphere user agent string (must start with `cymasphere:`).
 * @returns Number of revoked sessions, or an error message when revocation fails.
 * @note Requires the `revoke_cymasphere_device_sessions` database function.
 */
export async function revokeCymasphereDeviceSession(userAgent: string): Promise<{
  revoked_count: number;
  error: string | null;
}> {
  try {
    if (!userAgent.startsWith("cymasphere:")) {
      return { revoked_count: 0, error: "Invalid Cymasphere device session" };
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return { revoked_count: 0, error: "Failed to fetch user" };
    }

    const targetDeviceHost = extractCymasphereDeviceHost(userAgent);

    const { data: ownedSessions, error: ownershipError } = await supabase
      .from("user_sessions")
      .select("user_agent")
      .ilike("user_agent", "cymasphere:%");

    if (ownershipError) {
      console.error("Error verifying Cymasphere device ownership:", ownershipError);
      return { revoked_count: 0, error: "Failed to verify device session" };
    }

    const ownsDevice = ownedSessions?.some(
      (session) =>
        session.user_agent &&
        extractCymasphereDeviceHost(session.user_agent) === targetDeviceHost,
    );

    if (!ownsDevice) {
      return { revoked_count: 0, error: "Device session not found" };
    }

    let { data, error } = await supabase.rpc(
      "revoke_cymasphere_device_sessions",
      { p_user_agent: userAgent },
    );

    if (error?.code === "PGRST202" && getSupabaseDbPassword()) {
      try {
        await ensureRevokeCymasphereDeviceFunction();
        ({ data, error } = await supabase.rpc(
          "revoke_cymasphere_device_sessions",
          { p_user_agent: userAgent },
        ));
      } catch (migrationError) {
        console.error("Error applying revoke-device migration:", migrationError);
      }
    }

    if (error?.code === "PGRST202" && getSupabaseDbPassword()) {
      try {
        const revokedCount = await revokeCymasphereDeviceSessionsDirect(
          user.id,
          userAgent,
        );
        return { revoked_count: revokedCount, error: null };
      } catch (directSqlError) {
        console.error("Error revoking Cymasphere device via SQL:", directSqlError);
        return {
          revoked_count: 0,
          error: "Device logout is not configured yet. Apply the revoke-device migration.",
        };
      }
    }

    if (error) {
      console.error("Error revoking Cymasphere device session:", error);
      return {
        revoked_count: 0,
        error:
          error.code === "PGRST202"
            ? "Device logout is not configured yet. Apply the revoke-device migration."
            : "Failed to revoke device session",
      };
    }

    const revokedCount = data ?? 0;
    if (revokedCount === 0) {
      return {
        revoked_count: 0,
        error: "No active sessions were found for that device.",
      };
    }

    return { revoked_count: revokedCount, error: null };
  } catch (error) {
    console.error("Error in revokeCymasphereDeviceSession:", error);
    return { revoked_count: 0, error: "Failed to revoke device session" };
  }
}
