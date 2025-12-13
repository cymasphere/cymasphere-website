"use server";

import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { updateUserProStatus } from "@/utils/subscriptions/check-subscription";

/**
 * Server action to refresh user subscription status by customer ID
 * This is called from checkout success page even if user isn't logged in
 * Matches the user profile by customer_id and updates their pro status using the centralized function
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
