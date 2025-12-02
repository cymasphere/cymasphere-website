"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { customerPurchasedProFromSupabase } from "@/utils/stripe/supabase-stripe";
import { SubscriptionType } from "@/utils/supabase/types";
import { checkUserManagementPro } from "@/utils/supabase/user-management";

/**
 * Comprehensive subscription check that includes NFR, Stripe, and iOS subscriptions
 * Returns the highest priority subscription (lifetime > annual > monthly > none)
 */
export async function checkUserSubscription(
  userId: string
): Promise<{
  subscription: SubscriptionType;
  subscriptionExpiration: Date | null;
  source: "stripe" | "ios" | "nfr" | "none";
}> {
  const supabase = await createSupabaseServiceRole();

  // Get user's profile and email
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("customer_id, email, subscription, subscription_expiration")
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
    console.log(`[checkUserSubscription] NFR check for ${profile.email}:`, { hasPro: nfrCheck.hasPro, error: nfrCheck.error });
    
    if (!nfrCheck.error && nfrCheck.hasPro) {
      console.log(`[checkUserSubscription] NFR access granted for ${profile.email}`);
      
      // NFR grants lifetime access - update subscription field so app recognizes it
      await supabase
        .from("profiles")
        .update({
          subscription: "lifetime",
          subscription_expiration: null,
          subscription_source: "nfr",
        })
        .eq("id", userId);
      
      return {
        subscription: "lifetime",
        subscriptionExpiration: null,
        source: "nfr",
      };
    }
    // If NFR check returns false, continue to check iOS/Stripe below
  }

  // Check iOS subscriptions first
  const { data: iosSubscriptions, error: iosError } = await supabase
    .from("ios_subscriptions")
    .select("subscription_type, expires_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("validation_status", "valid")
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

  if (profile.customer_id) {
    const stripeResult = await customerPurchasedProFromSupabase(profile.customer_id);
    if (stripeResult.success && stripeResult.subscription !== "none") {
      stripeSubscription = stripeResult.subscription;
      stripeExpiration = stripeResult.subscription_expiration || null;
    } else if (profile.subscription === "lifetime") {
      // CRITICAL: If profile already has "lifetime" (set by webhook) but Stripe query didn't find it,
      // preserve the lifetime status. This prevents downgrading users when stripe_tables schema
      // hasn't synced yet or metadata is missing. Only downgrade if Stripe explicitly says they don't have it.
      // If stripeResult.success is false, it means there was an error querying, so we should preserve lifetime.
      // If stripeResult.subscription is "none" but profile has "lifetime", preserve it as a safety measure.
      if (!stripeResult.success || stripeResult.subscription === "none") {
        console.log(`[checkUserSubscription] Preserving lifetime subscription for user ${userId} - Stripe query didn't find it but profile has it`);
        stripeSubscription = "lifetime";
        stripeExpiration = null;
      }
    }
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
      console.log(`[checkUserSubscription] Final safety check: Preserving lifetime for user ${userId} - profile has lifetime but all queries returned none`);
      finalSubscription = "lifetime";
      finalExpiration = null;
      source = "stripe"; // Assume Stripe source if we're preserving it
    } else {
      finalSubscription = "none";
      finalExpiration = null;
      source = "none";
    }
  }

  // Update profile with final subscription status (NFR already updated above and returned early)
  await supabase
    .from("profiles")
    .update({
      subscription: finalSubscription,
      subscription_expiration: finalExpiration?.toISOString() || null,
      subscription_source: source,
    })
    .eq("id", userId);

  return {
    subscription: finalSubscription,
    subscriptionExpiration: finalExpiration,
    source,
  };
}


