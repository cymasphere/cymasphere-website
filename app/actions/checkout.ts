/**
 * @fileoverview Checkout-related server actions
 * 
 * This file contains server actions for handling post-checkout operations,
 * including refreshing subscription status and inviting users after purchase.
 * These actions are called from the checkout success page and work even when
 * users are not logged in.
 * 
 * @module actions/checkout
 */

"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { updateUserProStatus } from "@/utils/subscriptions/check-subscription";
import { getCheckoutSessionResult } from "@/utils/stripe/actions";

/**
 * @brief Server action to refresh user subscription status by Stripe customer ID
 * 
 * Finds the user profile by Stripe customer_id and updates their pro status
 * using the centralized subscription checking function. This is called from
 * the checkout success page even if the user isn't logged in, allowing
 * subscription status to be updated immediately after purchase.
 * 
 * @param customerId Stripe customer ID to look up user by
 * @returns Promise with success status, user ID, subscription details, or error
 * @note Uses service role client to access profiles table
 * @note Calls centralized updateUserProStatus function for consistency
 * @note Can be called without user authentication
 * 
 * @example
 * ```typescript
 * const result = await refreshSubscriptionByCustomerId("cus_abc123");
 * // Returns: { success: true, userId: "...", subscription: "annual", expiration: "..." }
 * ```
 */
export async function refreshSubscriptionByCustomerId(
  customerId: string
): Promise<{
  success: boolean;
  userId?: string;
  subscription?: string;
  expiration?: string | null;
  error?: string;
}> {
  try {
    if (!customerId) {
      return {
        success: false,
        error: "Missing customer_id parameter",
      };
    }

    const supabase = await createSupabaseServiceRole();

    // Find user profile by customer_id
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("customer_id", customerId)
      .single();

    if (!profile || !profile.id) {
      return {
        success: false,
        error: "User not found for this customer ID",
      };
    }

    // Update subscription status using centralized function
    console.log(
      `[Checkout Refresh] Updating pro status for user ${profile.id} (customer: ${customerId})`
    );
    const result = await updateUserProStatus(profile.id);

    console.log(
      `[Checkout Refresh] Subscription updated: ${result.subscription} (${result.source})`
    );

    return {
      success: true,
      userId: profile.id,
      subscription: result.subscription,
      expiration: result.subscriptionExpiration?.toISOString() || null,
    };
  } catch (error) {
    console.error("[Checkout Refresh] Error:", error);
    return {
      success: false,
      error: "Failed to refresh subscription status",
    };
  }
}

/**
 * @brief Server action to invite user by email from checkout session and refresh pro status
 * 
 * Retrieves the customer email from a Stripe checkout session, invites the user
 * to create an account (if they don't already exist), and then refreshes their
 * subscription status. This is called from the checkout success page when the
 * user is not logged in, allowing them to receive account access after purchase.
 * 
 * Handles multiple scenarios:
 * - User already exists in profiles table
 * - User exists in auth but not in profiles
 * - User needs to be invited via Supabase Auth
 * - Profile creation timing issues (waits for triggers)
 * 
 * @param sessionId Stripe checkout session ID to retrieve customer email from
 * @returns Promise with success status, user ID, subscription details, or error
 * @note Uses service role client for admin operations
 * @note Handles race conditions with profile creation triggers
 * @note Extracts first name from email address for user metadata
 * @note Sets redirectTo URL for password reset after invite
 * 
 * @example
 * ```typescript
 * const result = await inviteUserAndRefreshProStatus("cs_test_abc123");
 * // Returns: { success: true, userId: "...", subscription: "annual", expiration: "..." }
 * ```
 */
export async function inviteUserAndRefreshProStatus(
  sessionId: string
): Promise<{
  success: boolean;
  userId?: string;
  subscription?: string;
  expiration?: string | null;
  error?: string;
  warning?: string;
}> {
  try {
    if (!sessionId) {
      return {
        success: false,
        error: "Missing session_id parameter",
      };
    }

    // Get checkout session details to retrieve customer email
    const sessionResult = await getCheckoutSessionResult(sessionId);

    if (!sessionResult.success || !sessionResult.customerEmail) {
      return {
        success: false,
        error: "Could not retrieve email from checkout session",
      };
    }

    const customerEmail = sessionResult.customerEmail.toLowerCase().trim();
    const supabase = await createSupabaseServiceRole();

    // First, check if user already exists by querying profiles table
    let userId: string | null = null;
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", customerEmail)
      .maybeSingle();

    if (existingProfile?.id) {
      userId = existingProfile.id;
      console.log(
        `[Checkout Invite] User already exists with email ${customerEmail}, userId: ${userId}`
      );
    } else {
      // User doesn't exist, check auth.users to see if they were already invited
      // We'll try to invite and handle the error if user already exists
      try {
        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com";
        const redirectTo = `${baseUrl}/reset-password`;

        // Extract first part of email (before @) to use as first_name
        const emailParts = customerEmail.split("@");
        const firstName = emailParts[0] || "";

        const { data: inviteData, error: inviteError } =
          await supabase.auth.admin.inviteUserByEmail(customerEmail, {
            data: {
              invited_by: "checkout",
              first_name: firstName,
            },
            redirectTo: redirectTo,
          });

        if (inviteError) {
          // If user already exists, try to find them
          if (
            inviteError.message?.includes("already registered") ||
            inviteError.message?.includes("already exists") ||
            inviteError.message?.includes("User already registered")
          ) {
            console.log(
              `[Checkout Invite] User already exists in auth, finding profile for ${customerEmail}`
            );
            // User was already invited/exists, find their profile
            // Wait a moment for profile to be created if it was just created
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const { data: profileAfterInvite } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", customerEmail)
              .maybeSingle();

            if (profileAfterInvite?.id) {
              userId = profileAfterInvite.id;
            } else {
              // Try to get from auth and create profile if needed
              const { data: authUsers } = await supabase.auth.admin.listUsers();
              const matchingUser = authUsers?.users.find(
                (u) => u.email?.toLowerCase().trim() === customerEmail
              );

              if (matchingUser?.id) {
                userId = matchingUser.id;
                // Profile might not exist yet, but we can still refresh pro status
                // The updateUserProStatus function will handle missing profile
              }
            }
          } else {
            console.error("[Checkout Invite] Error inviting user:", inviteError);
            return {
              success: false,
              error: `Failed to invite user: ${inviteError.message}`,
            };
          }
        } else if (inviteData?.user?.id) {
          // Invite successful, user was created
          userId = inviteData.user.id;
          console.log(
            `[Checkout Invite] Successfully invited user ${customerEmail}, userId: ${userId}`
          );

          // Wait a moment for profile to be created by trigger
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (inviteError) {
        console.error("[Checkout Invite] Unexpected error inviting user:", inviteError);
        return {
          success: false,
          error: "Failed to invite user",
        };
      }
    }

    // If we still don't have a userId, try one more time to find the profile
    if (!userId) {
      const { data: finalProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", customerEmail)
        .maybeSingle();

      if (finalProfile?.id) {
        userId = finalProfile.id;
      } else {
        return {
          success: false,
          error: "Could not find or create user profile",
        };
      }
    }

    // Now refresh pro status for the user
    if (userId) {
      console.log(
        `[Checkout Invite] Refreshing pro status for user ${userId} (email: ${customerEmail})`
      );
      const result = await updateUserProStatus(userId);

      console.log(
        `[Checkout Invite] Pro status refreshed: ${result.subscription} (${result.source})`
      );

      return {
        success: true,
        userId: userId,
        subscription: result.subscription,
        expiration: result.subscriptionExpiration?.toISOString() || null,
      };
    }

    return {
      success: false,
      error: "Could not determine user ID",
    };
  } catch (error) {
    console.error("[Checkout Invite] Error:", error);
    return {
      success: false,
      error: "Failed to invite user and refresh pro status",
    };
  }
}
