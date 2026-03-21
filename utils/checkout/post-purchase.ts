/**
 * @fileoverview Server-only post-checkout helpers: invite by email and refresh pro status.
 * Used by Stripe API routes and POST /api/checkout/after-success — not exposed as client-callable actions.
 *
 * @module utils/checkout/post-purchase
 */

import type { Database } from "@/database.types";
import { sendEmail } from "@/utils/email";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import type { SupabaseClient } from "@supabase/supabase-js";
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
 * @brief Sends a one-time magic sign-in link for returning customers who did not receive Supabase’s invite email.
 * @param supabase - Service-role Supabase client
 * @param normalizedEmail - Lowercased, trimmed checkout email (must match auth user)
 * @param userId - Profile / auth user id for `subscription_emails_sent.user_id`
 * @returns Resolves when skipped, sent, or failed without throwing
 * @note Dedupes with `subscription_emails_sent` PK `(email, email_kind)` using a UTC date suffix so at most one
 *       sign-in email per address per calendar day.
 * @note If link generation fails after claiming the dedupe row, the row is removed so a later retry can succeed.
 */
async function sendCheckoutReturnSignInLinkEmail(
  supabase: SupabaseClient<Database>,
  normalizedEmail: string,
  userId: string,
): Promise<void> {
  const dayKey = new Date().toISOString().slice(0, 10);
  const emailKind = `checkout_return_sign_in_${dayKey}`;

  const { error: insertError } = await supabase
    .from("subscription_emails_sent")
    .insert({
      user_id: userId,
      email: normalizedEmail,
      email_kind: emailKind,
    });

  if (insertError?.code === "23505") {
    return;
  }
  if (insertError) {
    console.error(
      "[Checkout Sign-in Link] Dedupe insert failed:",
      insertError,
    );
    return;
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com";
  const redirectTo = `${baseUrl}/reset-password`;

  const { data: linkPayload, error: linkError } =
    await supabase.auth.admin.generateLink({
      type: "magiclink",
      email: normalizedEmail,
      options: { redirectTo },
    });

  const actionLink = linkPayload?.properties?.action_link ?? null;
  if (linkError || !actionLink) {
    const { error: deleteError } = await supabase
      .from("subscription_emails_sent")
      .delete()
      .eq("email", normalizedEmail)
      .eq("email_kind", emailKind);
    if (deleteError) {
      console.error(
        "[Checkout Sign-in Link] Failed to roll back dedupe after generateLink error:",
        deleteError,
      );
    }
    console.error("[Checkout Sign-in Link] generateLink failed:", linkError);
    return;
  }

  const subject = "Sign in to Cymasphere";
  const text = [
    "Thanks for subscribing — use the link below to sign in to your account:",
    "",
    actionLink,
    "",
    "This link expires soon. If you did not start checkout, you can ignore this email.",
  ].join("\n");

  const safeHref = actionLink
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;");
  const html = `<!DOCTYPE html>
<html><body style="font-family:system-ui,sans-serif;line-height:1.5;color:#111">
<p>Thanks for subscribing — use the button below to sign in to your account.</p>
<p><a href="${safeHref}" style="display:inline-block;padding:12px 20px;background:#4e7cff;color:#fff;text-decoration:none;border-radius:8px">Sign in to Cymasphere</a></p>
<p style="font-size:14px;color:#555">Or copy this link:<br/><span style="word-break:break-all">${safeHref}</span></p>
<p style="font-size:13px;color:#777">This link expires soon. If you did not start checkout, you can ignore this email.</p>
</body></html>`;

  try {
    await sendEmail({
      to: normalizedEmail,
      subject,
      text,
      html,
      source: "inviteUserByEmailAndRefreshProStatus",
      dedupeKey: emailKind,
    });
  } catch (sendErr) {
    console.error("[Checkout Sign-in Link] sendEmail failed:", sendErr);
  }
}

/**
 * @brief Invites or finds user by email, updates name fields, then syncs pro status from Stripe/iOS/NFR.
 * @param customerEmail - Normalized checkout email
 * @param firstName - Optional first name for profile / invite metadata
 * @param lastName - Optional last name
 * @returns Result with userId and subscription snapshot
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
    /** True when `inviteUserByEmail` ran for a new address and Supabase sent its invite email. */
    let checkoutSupabaseInviteEmailSent = false;
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
          checkoutSupabaseInviteEmailSent = true;
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

      if (!checkoutSupabaseInviteEmailSent) {
        await sendCheckoutReturnSignInLinkEmail(
          supabase,
          normalized,
          userId,
        );
      }

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
