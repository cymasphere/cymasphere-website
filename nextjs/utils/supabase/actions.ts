"use server";

import { PostgrestError } from "@supabase/supabase-js";
import { createClient } from "./server";
import { Profile } from "./types";
import { customerPurchasedPro, findOrCreateCustomer } from "../stripe/actions";

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
 * Updates a user's subscription status by checking Stripe
 *
 * Logic:
 * - If user is pro, only check if last_stripe_api_check was more than a week ago
 * - If user is not pro, always check to ensure purchases are reflected
 * - Checks one-time purchase and two subscription products
 * - Updates profile with appropriate status
 */
export async function updateStripe(
  profile: Profile
): Promise<{ success: boolean; profile?: Profile; error?: Error | unknown }> {
  try {
    // Check if we need to query Stripe
    const shouldCheckStripe =
      !profile.is_pro ||
      !profile.last_stripe_api_check ||
      new Date(profile.last_stripe_api_check).getTime() <
        Date.now() - 7 * 24 * 60 * 60 * 1000;

    if (!shouldCheckStripe) {
      return { success: true, profile };
    }

    // If no customer ID, user has no Stripe purchases
    if (!profile.customer_id) {
      // Update profile to set is_pro and is_lifetime to false
      const updatedProfile = await updateUserProfile(profile.id, false, false);
      return { success: true, profile: updatedProfile };
    }

    // Use the stripe actions to check customer status
    const customerStatus = await customerPurchasedPro(profile.customer_id);

    if (!customerStatus.success) {
      return { success: false, error: customerStatus.error };
    }

    // Update the profile based on the customer status
    const updatedProfile = await updateUserProfile(
      profile.id,
      customerStatus.is_pro,
      customerStatus.is_lifetime
    );

    return { success: true, profile: updatedProfile };
  } catch (error) {
    console.error("Error updating Stripe status:", error);
    return { success: false, error };
  }
}

// Helper function to update the user profile
async function updateUserProfile(
  userId: string,
  is_pro: boolean,
  is_lifetime: boolean
): Promise<Profile> {
  const last_stripe_api_check = new Date().toISOString();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .update({ is_pro, is_lifetime, last_stripe_api_check })
    .eq("id", userId)
    .select()
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    throw error;
  }

  return data;
}
