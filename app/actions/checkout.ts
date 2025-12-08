"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { updateStripe } from "@/utils/supabase/actions";
import { fetchProfile } from "@/utils/supabase/actions";

/**
 * Server action to refresh user subscription status from Stripe by customer ID
 * This is called from checkout success page even if user isn't logged in
 * Matches the user profile by customer_id and updates their pro status from Stripe
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

    // Fetch full profile to update from Stripe
    const { profile: fullProfile, error: profileError } = await fetchProfile(
      profile.id
    );

    if (profileError || !fullProfile) {
      return {
        success: false,
        error: "Failed to fetch user profile",
      };
    }

    // Update subscription status from Stripe (same as AuthContext refreshUser)
    console.log(
      `[Checkout Refresh] Updating subscription from Stripe for user ${profile.id} (customer: ${customerId})`
    );
    const result = await updateStripe(fullProfile);

    if (!result.success || !result.profile) {
      return {
        success: false,
        error:
          result.error?.toString() || "Failed to update subscription status",
      };
    }

    console.log(
      `[Checkout Refresh] Subscription updated: ${result.profile.subscription}`
    );

    return {
      success: true,
      userId: profile.id,
      subscription: result.profile.subscription,
      expiration: result.profile.subscription_expiration || null,
    };
  } catch (error) {
    console.error("[Checkout Refresh] Error:", error);
    return {
      success: false,
      error: "Failed to refresh subscription status",
    };
  }
}
