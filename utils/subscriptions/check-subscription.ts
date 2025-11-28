"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { customerPurchasedProFromSupabase } from "@/utils/stripe/supabase-stripe";
import { SubscriptionType } from "@/utils/supabase/types";

/**
 * Comprehensive subscription check that includes both Stripe and iOS subscriptions
 * Returns the highest priority subscription (lifetime > annual > monthly > none)
 */
export async function checkUserSubscription(
  userId: string
): Promise<{
  subscription: SubscriptionType;
  subscriptionExpiration: Date | null;
  source: "stripe" | "ios" | "none";
}> {
  const supabase = await createSupabaseServiceRole();

  // Get user's profile
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
    };
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
  let source: "stripe" | "ios" | "none";

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
  };
}

