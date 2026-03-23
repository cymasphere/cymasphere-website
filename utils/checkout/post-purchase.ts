/**
 * @fileoverview Server-only post-checkout helpers: invite by email and refresh pro status.
 * Used by Stripe API routes and POST /api/checkout/after-success — not exposed as client-callable actions.
 * Guest magic-link fallback emails are intentionally not sent for existing accounts (invite or self-registration).
 *
 * @module utils/checkout/post-purchase
 */

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { updateUserProStatus } from "@/utils/subscriptions/check-subscription";

/**
 * @brief Refreshes subscription state for the profile row matching the Stripe customer id.
 * @param customerId - Stripe customer id
 * @returns Success flag, user id, subscription label, expiration, or error
 */
export async function refreshSubscriptionByCustomerId(
  customerId: string,
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("customer_id", customerId)
      .single();

    if (!profile?.id) {
      return {
        success: false,
        error: "User not found for this customer ID",
      };
    }

    console.log(
      `[Checkout Refresh] Updating pro status for user ${profile.id} (customer: ${customerId})`,
    );
    const result = await updateUserProStatus(profile.id);

    console.log(
      `[Checkout Refresh] Subscription updated: ${result.subscription} (${result.source})`,
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
 * @brief Invites or finds user by email, updates name fields, then syncs pro status from Stripe/iOS/NFR.
 * @param customerEmail - Normalized checkout email
 * @param firstName - Optional first name for profile / invite metadata
 * @param lastName - Optional last name
 * @returns Result with userId and subscription snapshot
 * @note Does not send a separate magic-link email: new addresses get Supabase's invite only; existing accounts
 *       already have registration or a prior invite and should use normal sign-in / password reset.
 */
export async function inviteUserByEmailAndRefreshProStatus(
  customerEmail: string,
  firstName?: string,
  lastName?: string,
): Promise<{
  success: boolean;
  userId?: string;
  subscription?: string;
  expiration?: string | null;
  error?: string;
  warning?: string;
}> {
  if (!customerEmail?.trim()) {
    return { success: false, error: "Missing customer email" };
  }
  const normalized = customerEmail.toLowerCase().trim();

  try {
    const supabase = await createSupabaseServiceRole();

    let userId: string | null = null;
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalized)
      .maybeSingle();

    if (existingProfile?.id) {
      userId = existingProfile.id;
      console.log(
        `[Checkout Invite] User already exists with email ${normalized}, userId: ${userId}`,
      );
    } else {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com";
        const redirectTo = `${baseUrl}/reset-password`;

        const resolvedFirstName =
          firstName?.trim() || normalized.split("@")[0] || "";

        const resolvedLastName = lastName?.trim() || "";

        const fullName =
          [resolvedFirstName, resolvedLastName].filter(Boolean).join(" ") ||
          normalized.split("@")[0];

        const { data: inviteData, error: inviteError } =
          await supabase.auth.admin.inviteUserByEmail(normalized, {
            data: {
              invited_by: "checkout",
              first_name: resolvedFirstName,
              last_name: resolvedLastName,
              name: fullName,
            },
            redirectTo: redirectTo,
          });

        if (inviteError) {
          if (
            inviteError.message?.includes("already registered") ||
            inviteError.message?.includes("already exists") ||
            inviteError.message?.includes("User already registered")
          ) {
            console.log(
              `[Checkout Invite] User already exists in auth, finding profile for ${normalized}`,
            );
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const { data: profileAfterInvite } = await supabase
              .from("profiles")
              .select("id")
              .eq("email", normalized)
              .maybeSingle();

            if (profileAfterInvite?.id) {
              userId = profileAfterInvite.id;
            } else {
              const { data: authUsers } = await supabase.auth.admin.listUsers();
              const matchingUser = authUsers?.users.find(
                (u) => u.email?.toLowerCase().trim() === normalized,
              );

              if (matchingUser?.id) {
                userId = matchingUser.id;
              }
            }
          } else {
            console.error(
              "[Checkout Invite] Error inviting user:",
              inviteError,
            );
            return {
              success: false,
              error: `Failed to invite user: ${inviteError.message}`,
            };
          }
        } else if (inviteData?.user?.id) {
          userId = inviteData.user.id;
          console.log(
            `[Checkout Invite] Successfully invited user ${normalized}, userId: ${userId}`,
          );

          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (inviteError) {
        console.error(
          "[Checkout Invite] Unexpected error inviting user:",
          inviteError,
        );
        return {
          success: false,
          error: "Failed to invite user",
        };
      }
    }

    if (!userId) {
      const { data: finalProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", normalized)
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

    if (userId) {
      const resolvedFirst =
        firstName?.trim() || normalized.split("@")[0] || "";
      const resolvedLast = lastName?.trim() || "";
      const nameUpdate: Record<string, string> = {};
      if (resolvedFirst) nameUpdate.first_name = resolvedFirst;
      if (resolvedLast) nameUpdate.last_name = resolvedLast;
      if (Object.keys(nameUpdate).length > 0) {
        await supabase.from("profiles").update(nameUpdate).eq("id", userId);
      }
    }

    if (userId) {
      console.log(
        `[Checkout Invite] Refreshing pro status for user ${userId} (email: ${normalized})`,
      );
      const result = await updateUserProStatus(userId, {
        ensureTrialWelcomeEmail: true,
      });

      console.log(
        `[Checkout Invite] Pro status refreshed: ${result.subscription} (${result.source})`,
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
