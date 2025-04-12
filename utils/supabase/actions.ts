"use server";

import { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "@/utils/supabase/server";
import { Profile } from "@/utils/supabase/types";
import { findOrCreateCustomer } from "@/utils/stripe/actions";
import { customerPurchasedProFromSupabase } from "@/utils/stripe/supabase-stripe";

export async function signUpWithStripe(
  name: string,
  email: string,
  password: string
) {
  try {
    const supabase = await createClient();

    // Find or create a Stripe customer
    const customer_id = await findOrCreateCustomer(email);

    // Sign up the user with Supabase
    const authResponse = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          customer_id,
        },
      },
    });

    return authResponse;
  } catch (error) {
    console.error("Error in signUp:", error);
    throw error;
  }
}

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
 * Updates a user's subscription status by checking the Stripe tables in Supabase
 *
 * Logic:
 * - No need to check for rate limits since we're querying our own database
 * - Uses the stripe_tables schema to check subscription status
 * - Updates profile with appropriate status
 */
export async function updateStripe(
  email: string,
  profile: Profile
): Promise<{ success: boolean; profile?: Profile; error?: Error | unknown }> {
  try {
    let updatedProfile: Profile = { ...profile };
    // If no customer ID, user has no Stripe purchases
    if (!updatedProfile.customer_id) {
      updatedProfile.customer_id = await findOrCreateCustomer(email);
    }

    // Use the Supabase Stripe tables to check customer status
    const customerStatus = await customerPurchasedProFromSupabase(
      updatedProfile.customer_id
    );

    if (!customerStatus.success) {
      return { success: false, error: customerStatus.error };
    }

    updatedProfile.subscription = customerStatus.subscription;
    updatedProfile.subscription_expiration =
      customerStatus.subscription_expiration?.toISOString() || null;
    updatedProfile.trial_expiration =
      customerStatus.trial_end_date?.toISOString() || null;

    if (
      updatedProfile.customer_id != profile.customer_id ||
      updatedProfile.subscription != profile.subscription ||
      updatedProfile.subscription_expiration !=
        profile.subscription_expiration ||
      updatedProfile.trial_expiration != profile.trial_expiration
    ) {
      updatedProfile = await updateUserProfile(updatedProfile);
    }

    return { success: true, profile: updatedProfile };
  } catch (error) {
    return { success: false, error };
  }
}

// Helper function to update the user profile
async function updateUserProfile(profile: Profile): Promise<Profile> {
  const supabase = await createClient();
  const { data: user, error: user_error } = await supabase.auth.getUser();

  console.log("updating user", !!user);

  if (user_error) {
    console.log("Error getting user:", user_error);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update(profile, { count: "exact" })
    .eq("id", profile.id)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
}
