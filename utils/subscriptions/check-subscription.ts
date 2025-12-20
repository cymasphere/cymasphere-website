"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { customerPurchasedProFromSupabase } from "@/utils/stripe/supabase-stripe";
import { SubscriptionType } from "@/utils/supabase/types";
import { checkUserManagementPro } from "@/utils/supabase/user-management";

// Export types for backward compatibility
export type AuthorizationSource = "nfr" | "stripe" | "ios" | "none";

export interface AuthorizationResult {
  subscription: SubscriptionType;
  subscriptionExpiration: Date | null;
  source: AuthorizationSource;
  isAuthorized: boolean;
}

/**
 * ============================================================================
 * CENTRALIZED PRO STATUS UPDATE FUNCTION
 * ============================================================================
 *
 * This is the single source of truth for updating a user's pro purchase status.
 * All subscription status updates throughout the application should call this function.
 *
 * ## How the Pro Status System Works
 *
 * The system checks three sources of subscription data in priority order:
 *
 * ### 1. NFR (Not For Resale) Licenses (Highest Priority)
 * - Managed in the `user_management` table
 * - Email-based pro status tracking
 * - Grants lifetime access (permanent free license)
 * - Used for influencers, team members, partners, and special cases
 * - When detected, immediately sets subscription to "lifetime" and returns
 *
 * ### 2. iOS In-App Purchases
 * - Stored in the `ios_subscriptions` table
 * - Validated via Apple App Store receipts
 * - Supports monthly, annual, and lifetime subscriptions
 * - Only active, valid subscriptions with future expiration dates are considered
 *
 * ### 3. Stripe Subscriptions
 * - Synced from Stripe via webhooks to `stripe_tables.stripe_subscriptions`
 * - Supports monthly, annual, and lifetime subscriptions
 * - Includes trial period tracking
 * - Uses customer_id from the user's profile to query Stripe data
 *
 * ## Priority Resolution Logic
 *
 * When multiple subscription sources exist, the system uses this priority:
 * 1. Subscription type priority: lifetime > annual > monthly > none
 * 2. If same type from multiple sources, prefer the one with later expiration
 * 3. Safety net: If profile already has "lifetime", preserve it even if queries return "none"
 *    (prevents downgrading users during sync delays or metadata issues)
 *
 * ## Update Process
 *
 * 1. Fetches user profile using service role client (ensures full access)
 * 2. Checks NFR status first (if found, updates and returns immediately)
 * 3. Checks iOS subscriptions
 * 4. Checks Stripe subscriptions
 * 5. Resolves conflicts using priority logic
 * 6. Updates the profile table with final subscription status
 * 7. Returns the determined subscription type, expiration, and source
 *
 * ## When This Function is Called
 *
 * - Stripe webhook events (subscription created/updated/cancelled)
 * - User login (to refresh status on authentication)
 * - Purchase success page (to update status after checkout)
 * - Dashboard routes (periodic refresh)
 * - Admin actions (manual refresh from admin panel)
 * - NFR status changes (when admin grants/revokes NFR access)
 *
 * ## Usage
 *
 * ```typescript
 * const result = await updateUserProStatus(userId);
 * // result.subscription: "lifetime" | "annual" | "monthly" | "none"
 * // result.subscriptionExpiration: Date | null
 * // result.source: "nfr" | "stripe" | "ios" | "none"
 * ```
 *
 * @param userId - The user ID to update pro status for
 * @returns Object containing the determined subscription type, expiration date, and source
 */
export async function updateUserProStatus(userId: string): Promise<{
  subscription: SubscriptionType;
  subscriptionExpiration: Date | null;
  source: "stripe" | "ios" | "nfr" | "none";
}> {
  const supabase = await createSupabaseServiceRole();

  // Get user's profile and email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      "customer_id, email, subscription, subscription_expiration, subscription_source, trial_expiration, first_name, last_name"
    )
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return {
      subscription: "none",
      subscriptionExpiration: null,
      source: "none",
    };
  }

  // CHECK NFR STATUS FIRST (highest priority)
  // NFR licenses are free elite access licenses managed in user_management table
  // When NFR is detected, update subscription field so app recognizes access
  // NFR grants lifetime access (free permanent license)
  if (profile.email) {
    const nfrCheck = await checkUserManagementPro(profile.email);
    console.log(`[updateUserProStatus] NFR check for ${profile.email}:`, {
      hasPro: nfrCheck.hasPro,
      error: nfrCheck.error,
    });

    if (!nfrCheck.error && nfrCheck.hasPro) {
      console.log(
        `[updateUserProStatus] NFR access granted for ${profile.email}`
      );

      // Check if this is a new NFR grant (subscription_source wasn't already "nfr")
      const isNewNfrGrant = profile.subscription_source !== "nfr";

      // NFR grants lifetime access - update subscription field so app recognizes it
      await supabase
        .from("profiles")
        .update({
          subscription: "lifetime",
          subscription_expiration: null,
          subscription_source: "nfr",
        })
        .eq("id", userId);

      // Send welcome email for new NFR grants
      if (isNewNfrGrant) {
        try {
          const { generateWelcomeEmailHtml, generateWelcomeEmailText } =
            await import("@/utils/email-campaigns/welcome-email");
          const { sendEmail } = await import("@/utils/email");

          const customerName =
            profile.first_name && profile.last_name
              ? `${profile.first_name} ${profile.last_name}`
              : undefined;

          const welcomeEmailHtml = generateWelcomeEmailHtml({
            customerName,
            customerEmail: profile.email,
            purchaseType: "elite",
            planName: "elite",
          });

          const welcomeEmailText = generateWelcomeEmailText({
            customerName,
            customerEmail: profile.email,
            purchaseType: "elite",
            planName: "elite",
          });

          const emailResult = await sendEmail({
            to: profile.email,
            subject: "Welcome to Cymasphere - Elite Access",
            html: welcomeEmailHtml,
            text: welcomeEmailText,
            from: "Cymasphere <support@cymasphere.com>",
          });

          if (emailResult.success) {
            console.log(
              `✅ Sent welcome email for elite access to ${profile.email} (Message ID: ${emailResult.messageId})`
            );
          } else {
            console.error(
              `❌ Failed to send welcome email for elite access:`,
              emailResult.error
            );
          }
        } catch (emailError) {
          console.error(
            "❌ Failed to send welcome email for elite access:",
            emailError
          );
          // Don't throw - email failure shouldn't break subscription check
        }
      }

      return {
        subscription: "lifetime",
        subscriptionExpiration: null,
        source: "nfr",
      };
    }
    // If NFR check returns false, continue to check iOS/Stripe below
  }

  // Clean up expired test receipts
  // Test receipts are only valid for 6 hours from validation, after that they should be deleted
  const now = new Date();

  const { error: cleanupError } = await supabase
    .from("ios_subscriptions")
    .delete()
    .eq("user_id", userId)
    .eq("validation_status", "test")
    .lt("expires_date", now.toISOString());

  if (cleanupError) {
    console.log(
      `[updateUserProStatus] Error cleaning up expired test receipts:`,
      cleanupError
    );
  } else {
    console.log(
      `[updateUserProStatus] Cleaned up expired test receipts for user ${userId}`
    );
  }

  // Check iOS subscriptions (include both valid and test receipts that aren't expired)
  const { data: iosSubscriptions, error: iosError } = await supabase
    .from("ios_subscriptions")
    .select("subscription_type, expires_date, validation_status")
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("validation_status", ["valid", "test"])
    .gt("expires_date", new Date().toISOString())
    .order("expires_date", { ascending: false });

  let iosSubscription: SubscriptionType = "none";
  let iosExpiration: Date | null = null;

  if (!iosError && iosSubscriptions && iosSubscriptions.length > 0) {
    // Get the subscription with the longest expiry (highest priority)
    const activeIOS = iosSubscriptions[0];
    iosSubscription = activeIOS.subscription_type as SubscriptionType;
    iosExpiration = new Date(activeIOS.expires_date);
  }

  // Check Stripe subscriptions
  let stripeSubscription: SubscriptionType = "none";
  let stripeExpiration: Date | null = null;
  let stripeTrialExpiration: Date | null = null;

  if (profile.customer_id) {
    const stripeResult = await customerPurchasedProFromSupabase(
      profile.customer_id
    );
    console.log(`[updateUserProStatus] Stripe result for ${profile.email}:`, {
      success: stripeResult.success,
      subscription: stripeResult.subscription,
      error: stripeResult.error ? String(stripeResult.error) : null,
    });

    if (stripeResult.success && stripeResult.subscription !== "none") {
      stripeSubscription = stripeResult.subscription;
      stripeExpiration = stripeResult.subscription_expiration || null;
      stripeTrialExpiration = stripeResult.trial_end_date || null;
    } else if (profile.subscription === "lifetime") {
      // CRITICAL: If profile already has "lifetime" (set by webhook) but Stripe query didn't find it,
      // preserve the lifetime status. This prevents downgrading users when stripe_tables schema
      // hasn't synced yet or metadata is missing. Only downgrade if Stripe explicitly says they don't have it.
      // If stripeResult.success is false, it means there was an error querying, so we should preserve lifetime.
      // If stripeResult.subscription is "none" but profile has "lifetime", preserve it as a safety measure.
      console.log(
        `[updateUserProStatus] ⚠️ PRESERVING lifetime subscription for user ${userId} (${profile.email}) - Stripe query returned ${stripeResult.subscription} but profile has lifetime`
      );
      stripeSubscription = "lifetime";
      stripeExpiration = null;
    }
  } else if (profile.subscription === "lifetime") {
    // If user has lifetime but no customer_id, preserve it (might be NFR or manual grant)
    console.log(
      `[updateUserProStatus] Preserving lifetime for user ${userId} (${profile.email}) - no customer_id but profile has lifetime`
    );
    stripeSubscription = "lifetime";
    stripeExpiration = null;
  }

  // Determine final subscription (priority: lifetime > annual > monthly > none)
  const subscriptionPriority: Record<SubscriptionType, number> = {
    none: 0,
    monthly: 1,
    annual: 2,
    lifetime: 3,
  };

  const iosPriority = subscriptionPriority[iosSubscription];
  const stripePriority = subscriptionPriority[stripeSubscription];

  let finalSubscription: SubscriptionType;
  let finalExpiration: Date | null;
  let source: "nfr" | "stripe" | "ios" | "none";

  if (iosPriority > stripePriority) {
    finalSubscription = iosSubscription;
    finalExpiration = iosExpiration;
    source = "ios";
  } else if (stripePriority > iosPriority) {
    finalSubscription = stripeSubscription;
    finalExpiration = stripeExpiration;
    source = "stripe";
  } else if (iosPriority > 0) {
    // Same priority, prefer the one with later expiration
    if (iosExpiration && stripeExpiration) {
      if (iosExpiration > stripeExpiration) {
        finalSubscription = iosSubscription;
        finalExpiration = iosExpiration;
        source = "ios";
      } else {
        finalSubscription = stripeSubscription;
        finalExpiration = stripeExpiration;
        source = "stripe";
      }
    } else if (iosExpiration) {
      finalSubscription = iosSubscription;
      finalExpiration = iosExpiration;
      source = "ios";
    } else {
      finalSubscription = stripeSubscription;
      finalExpiration = stripeExpiration;
      source = "stripe";
    }
  } else {
    // CRITICAL: Before setting to "none", check if profile already has "lifetime"
    // This is a final safety net to prevent downgrading lifetime users
    if (profile.subscription === "lifetime") {
      console.log(
        `[updateUserProStatus] Final safety check: Preserving lifetime for user ${userId} - profile has lifetime but all queries returned none`
      );
      finalSubscription = "lifetime";
      finalExpiration = null;
      source = "stripe"; // Assume Stripe source if we're preserving it
    } else {
      finalSubscription = "none";
      finalExpiration = null;
      source = "none";
    }
  }

  // Determine trial expiration based on source
  let finalTrialExpiration: Date | null = null;
  if (source === "stripe" && stripeTrialExpiration) {
    finalTrialExpiration = stripeTrialExpiration;
  }
  // For iOS and NFR, no trial expiration (they're either active subscriptions or lifetime)

  // Store previous subscription state for comparison
  const previousSubscription = profile.subscription;

  // Check if subscription type changed
  const subscriptionTypeChanged = previousSubscription !== finalSubscription;

  // Determine if we should send an email
  // Send email if subscription type changed (e.g., monthly → annual, annual → lifetime, etc.)
  // Note: NFR already returned early above, so source can't be "nfr" here
  const shouldSendEmail = subscriptionTypeChanged && profile.email;

  // Update profile with final subscription status (NFR already updated above and returned early)
  await supabase
    .from("profiles")
    .update({
      subscription: finalSubscription,
      subscription_expiration: finalExpiration?.toISOString() || null,
      trial_expiration: finalTrialExpiration?.toISOString() || null,
      subscription_source: source,
    })
    .eq("id", userId);

  // Send email for subscription changes (type changes, trial status changes, new activations)
  // NFR emails are already handled above
  if (shouldSendEmail && profile.email) {
    try {
      const { generateWelcomeEmailHtml, generateWelcomeEmailText } =
        await import("@/utils/email-campaigns/welcome-email");
      const { sendEmail } = await import("@/utils/email");

      const customerName =
        profile.first_name && profile.last_name
          ? `${profile.first_name} ${profile.last_name}`
          : undefined;

      // Determine if this is an active trial (trial expiration is in the future)
      const isTrial =
        finalTrialExpiration !== null && finalTrialExpiration > new Date();
      const trialEndDate = finalTrialExpiration?.toISOString();

      // Calculate trial days if it's a trial
      let trialDays: number | undefined;
      if (isTrial && finalTrialExpiration) {
        const now = new Date();
        const daysRemaining = Math.ceil(
          (finalTrialExpiration.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        trialDays = Math.max(0, daysRemaining);
      }

      let purchaseType: "subscription" | "lifetime";
      let subscriptionType: "monthly" | "annual" | undefined;
      let planName: string;
      let subject: string;

      // Determine if this is a new activation (from none to something)
      const isNewActivation =
        previousSubscription === "none" && finalSubscription !== "none";

      if (finalSubscription === "lifetime") {
        purchaseType = "lifetime";
        planName = "lifetime_149";
        if (isNewActivation) {
          subject = "Welcome to Cymasphere - Lifetime License";
        } else if (
          previousSubscription === "monthly" ||
          previousSubscription === "annual"
        ) {
          subject =
            "Your Cymasphere Subscription Has Been Upgraded - Lifetime License";
        } else {
          subject = "Your Cymasphere Subscription - Lifetime License";
        }
      } else if (finalSubscription === "monthly") {
        purchaseType = "subscription";
        subscriptionType = "monthly";
        planName = "monthly_6";
        if (isNewActivation) {
          subject = isTrial
            ? "Welcome to Cymasphere - Free Trial Started"
            : "Welcome to Cymasphere - Monthly Subscription";
        } else if (previousSubscription === "annual") {
          subject =
            "Your Cymasphere Subscription Has Been Updated - Monthly Plan";
        } else {
          subject = isTrial
            ? "Your Cymasphere Subscription - Free Trial Started"
            : "Your Cymasphere Subscription - Monthly Plan";
        }
      } else if (finalSubscription === "annual") {
        purchaseType = "subscription";
        subscriptionType = "annual";
        planName = "annual_59";
        if (isNewActivation) {
          subject = isTrial
            ? "Welcome to Cymasphere - Free Trial Started"
            : "Welcome to Cymasphere - Annual Subscription";
        } else if (previousSubscription === "monthly") {
          subject =
            "Your Cymasphere Subscription Has Been Upgraded - Annual Plan";
        } else {
          subject = isTrial
            ? "Your Cymasphere Subscription - Free Trial Started"
            : "Your Cymasphere Subscription - Annual Plan";
        }
      } else {
        // Shouldn't happen, but skip email if subscription type is unknown
        return {
          subscription: finalSubscription,
          subscriptionExpiration: finalExpiration,
          source,
        };
      }

      const welcomeEmailHtml = generateWelcomeEmailHtml({
        customerName,
        customerEmail: profile.email,
        purchaseType,
        subscriptionType,
        planName,
        isTrial,
        trialEndDate,
        trialDays,
      });

      const welcomeEmailText = generateWelcomeEmailText({
        customerName,
        customerEmail: profile.email,
        purchaseType,
        subscriptionType,
        planName,
        isTrial,
        trialEndDate,
        trialDays,
      });

      const emailResult = await sendEmail({
        to: profile.email,
        subject,
        html: welcomeEmailHtml,
        text: welcomeEmailText,
        from: "Cymasphere <support@cymasphere.com>",
      });

      if (emailResult.success) {
        console.log(
          `✅ Sent email for subscription change (${previousSubscription} → ${finalSubscription}) - ${finalSubscription} ${
            isTrial ? "trial" : "subscription"
          } to ${profile.email} (Message ID: ${emailResult.messageId})`
        );
      } else {
        console.error(
          `❌ Failed to send email for subscription change (${previousSubscription} → ${finalSubscription}):`,
          emailResult.error
        );
      }
    } catch (emailError) {
      console.error(
        `❌ Failed to send email for subscription change (${previousSubscription} → ${finalSubscription}):`,
        emailError
      );
      // Don't throw - email failure shouldn't break subscription check
    }
  }

  return {
    subscription: finalSubscription,
    subscriptionExpiration: finalExpiration,
    source,
  };
}

/**
 * ============================================================================
 * DEBUGGING/UTILITY FUNCTION
 * ============================================================================
 *
 * Get all active subscriptions for a user (for debugging/display purposes).
 * This function provides detailed breakdown of all subscription sources.
 *
 * **Note**: For actual authorization checks, use `updateUserProStatus()` instead.
 * This function is primarily for debugging and displaying subscription details.
 *
 * @param userId - User ID to get subscriptions for
 * @param email - User's email address (for NFR check)
 * @returns Detailed breakdown of all subscription sources and final authorization
 */
export async function getAllUserSubscriptions(
  userId: string,
  email: string
): Promise<{
  nfr: { hasPro: boolean; notes: string | null } | null;
  stripe: { subscription: SubscriptionType; expiresDate: Date | null } | null;
  ios: { subscription: SubscriptionType; expiresDate: Date | null } | null;
  final: AuthorizationResult;
}> {
  const supabase = await createSupabaseServiceRole();

  // Check NFR
  const nfrCheck = await checkUserManagementPro(email);
  const nfr =
    !nfrCheck.error && nfrCheck.hasPro
      ? { hasPro: true, notes: nfrCheck.notes }
      : null;

  // Check Stripe
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", userId)
    .single();

  let stripe: {
    subscription: SubscriptionType;
    expiresDate: Date | null;
  } | null = null;
  if (profile?.customer_id) {
    const stripeResult = await customerPurchasedProFromSupabase(
      profile.customer_id
    );
    if (stripeResult.success && stripeResult.subscription !== "none") {
      stripe = {
        subscription: stripeResult.subscription,
        expiresDate: stripeResult.subscription_expiration || null,
      };
    }
  }

  // Check iOS (include both valid and test receipts)
  const { data: iosSubscriptions } = await supabase
    .from("ios_subscriptions")
    .select("subscription_type, expires_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .in("validation_status", ["valid", "test"])
    .gt("expires_date", new Date().toISOString())
    .order("expires_date", { ascending: false })
    .limit(1);

  let ios: { subscription: SubscriptionType; expiresDate: Date | null } | null =
    null;
  if (iosSubscriptions && iosSubscriptions.length > 0) {
    ios = {
      subscription: iosSubscriptions[0].subscription_type as SubscriptionType,
      expiresDate: new Date(iosSubscriptions[0].expires_date),
    };
  }

  // Get final authorization using centralized function
  const result = await updateUserProStatus(userId);
  const final: AuthorizationResult = {
    subscription: result.subscription,
    subscriptionExpiration: result.subscriptionExpiration,
    source: result.source,
    isAuthorized: result.subscription !== "none",
  };

  return {
    nfr,
    stripe,
    ios,
    final,
  };
}
