"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { customerPurchasedProFromSupabase } from "@/utils/stripe/supabase-stripe";
import { checkUserManagementPro } from "@/utils/supabase/user-management";
import { SubscriptionType } from "@/utils/supabase/types";

export type AuthorizationSource = "nfr" | "stripe" | "ios" | "none";

export interface AuthorizationResult {
  subscription: SubscriptionType;
  subscriptionExpiration: Date | null;
  source: AuthorizationSource;
  isAuthorized: boolean;
}

/**
 * Comprehensive authorization check that checks all three sources:
 * 1. NFR (Not For Resale) via user_management table
 * 2. Stripe subscriptions via stripe_tables
 * 3. iOS subscriptions via ios_subscriptions table
 * 
 * Priority order: NFR (lifetime) > iOS/Stripe (by subscription type and expiration)
 * 
 * @param userId User ID from auth.users
 * @param email User's email address
 * @returns Authorization result with subscription type and source
 */
export async function checkUnifiedAuthorization(
  userId: string,
  email: string
): Promise<AuthorizationResult> {
  const supabase = await createSupabaseServiceRole();

  // Priority 1: Check NFR (user_management table)
  // If user has NFR, they have lifetime access regardless of other subscriptions
  const nfrCheck = await checkUserManagementPro(email);
  
  if (!nfrCheck.error && nfrCheck.hasPro) {
    // User has NFR - this is lifetime access and takes highest priority
    return {
      subscription: "lifetime",
      subscriptionExpiration: null,
      source: "nfr",
      isAuthorized: true,
    };
  }

  // Priority 2 & 3: Check iOS and Stripe subscriptions
  // Get user's profile for customer_id
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", userId)
    .single();

  if (profileError || !profile) {
    return {
      subscription: "none",
      subscriptionExpiration: null,
      source: "none",
      isAuthorized: false,
    };
  }

  // Check iOS subscriptions
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
  let source: AuthorizationSource;

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
    finalSubscription = "none";
    finalExpiration = null;
    source = "none";
  }

  // Update profile with final subscription status
  await supabase
    .from("profiles")
    .update({
      subscription: finalSubscription,
      subscription_expiration: finalExpiration?.toISOString() || null,
    })
    .eq("id", userId);

  return {
    subscription: finalSubscription,
    subscriptionExpiration: finalExpiration,
    source,
    isAuthorized: finalSubscription !== "none",
  };
}

/**
 * Get all active subscriptions for a user (for debugging/display purposes)
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
  const nfr = !nfrCheck.error && nfrCheck.hasPro
    ? { hasPro: true, notes: nfrCheck.notes }
    : null;

  // Check Stripe
  const { data: profile } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", userId)
    .single();

  let stripe: { subscription: SubscriptionType; expiresDate: Date | null } | null = null;
  if (profile?.customer_id) {
    const stripeResult = await customerPurchasedProFromSupabase(profile.customer_id);
    if (stripeResult.success && stripeResult.subscription !== "none") {
      stripe = {
        subscription: stripeResult.subscription,
        expiresDate: stripeResult.subscription_expiration || null,
      };
    }
  }

  // Check iOS
  const { data: iosSubscriptions } = await supabase
    .from("ios_subscriptions")
    .select("subscription_type, expires_date")
    .eq("user_id", userId)
    .eq("is_active", true)
    .eq("validation_status", "valid")
    .gt("expires_date", new Date().toISOString())
    .order("expires_date", { ascending: false })
    .limit(1);

  let ios: { subscription: SubscriptionType; expiresDate: Date | null } | null = null;
  if (iosSubscriptions && iosSubscriptions.length > 0) {
    ios = {
      subscription: iosSubscriptions[0].subscription_type as SubscriptionType,
      expiresDate: new Date(iosSubscriptions[0].expires_date),
    };
  }

  // Get final authorization
  const final = await checkUnifiedAuthorization(userId, email);

  return {
    nfr,
    stripe,
    ios,
    final,
  };
}

