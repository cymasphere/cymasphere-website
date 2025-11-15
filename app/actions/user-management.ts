"use server";

import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import {
  getAllUsersForCRM,
  getUsersForCRMCount,
  getAdditionalUserData,
} from "@/utils/stripe/admin-analytics";
import { fetchProfile } from "@/utils/supabase/actions";

export interface UserManagementRecord {
  user_email: string;
  pro: boolean;
  notes: string | null;
}

// Helper to check if user is admin
async function checkAdmin(supabase: ReturnType<typeof createClient>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return false;
  }

  const { data: adminCheck, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("user", user.id)
    .single();

  return adminError?.code !== "PGRST116" && !!adminCheck;
}

/**
 * Get all user_management records (admin only)
 */
export async function getUserManagementRecords(): Promise<{
  data: UserManagementRecord[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { data: null, error: "Unauthorized" };
    }

    const { data, error } = await supabase
      .from("user_management")
      .select("*")
      .order("user_email", { ascending: true });

    if (error) {
      console.error("Error fetching user_management records:", error);
      return { data: null, error: "Failed to fetch records" };
    }

    return { data: data as UserManagementRecord[], error: null };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      data: null,
      error: "Internal server error",
    };
  }
}

/**
 * Create new user_management record (admin only)
 */
export async function createUserManagementRecord(
  user_email: string,
  pro: boolean,
  notes?: string | null
): Promise<{
  data: UserManagementRecord | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { data: null, error: "Unauthorized" };
    }

    // Validate email format
    if (!user_email || typeof user_email !== "string") {
      return { data: null, error: "Valid email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return { data: null, error: "Invalid email format" };
    }

    // Validate pro is boolean
    if (typeof pro !== "boolean") {
      return { data: null, error: "pro must be a boolean" };
    }

    const { data, error } = await supabase
      .from("user_management")
      .insert([
        {
          user_email,
          pro,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (error) {
      // Handle duplicate email (primary key constraint)
      if (error.code === "23505") {
        return {
          data: null,
          error: "User with this email already exists",
        };
      }

      console.error("Error creating user_management record:", error);
      return { data: null, error: "Failed to create record" };
    }

    return { data: data as UserManagementRecord, error: null };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      data: null,
      error: "Internal server error",
    };
  }
}

/**
 * Update existing user_management record (admin only)
 */
export async function updateUserManagementRecord(
  user_email: string,
  updates: {
    pro?: boolean;
    notes?: string | null;
  }
): Promise<{
  data: UserManagementRecord | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { data: null, error: "Unauthorized" };
    }

    if (!user_email || typeof user_email !== "string") {
      return { data: null, error: "Valid email is required" };
    }

    // Build update object
    const updateData: { pro?: boolean; notes?: string | null } = {};

    if (typeof updates.pro === "boolean") {
      updateData.pro = updates.pro;
    }

    if (updates.notes !== undefined) {
      updateData.notes = updates.notes || null;
    }

    if (Object.keys(updateData).length === 0) {
      return { data: null, error: "No fields to update" };
    }

    const { data, error } = await supabase
      .from("user_management")
      .update(updateData)
      .eq("user_email", user_email)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return { data: null, error: "Record not found" };
      }

      console.error("Error updating user_management record:", error);
      return { data: null, error: "Failed to update record" };
    }

    return { data: data as UserManagementRecord, error: null };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      data: null,
      error: "Internal server error",
    };
  }
}

/**
 * Create user_management record and send Supabase invite (admin only)
 */
export async function createUserManagementWithInvite(
  user_email: string,
  pro: boolean,
  notes?: string | null,
  first_name?: string | null,
  last_name?: string | null
): Promise<{
  data: UserManagementRecord | null;
  warning?: string;
  inviteError?: string;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { data: null, error: "Unauthorized" };
    }

    // Validate email format
    if (!user_email || typeof user_email !== "string") {
      return { data: null, error: "Valid email is required" };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(user_email)) {
      return { data: null, error: "Invalid email format" };
    }

    // Validate pro is boolean
    if (typeof pro !== "boolean") {
      return { data: null, error: "pro must be a boolean" };
    }

    // Step 1: Create user_management record first
    const { data: userManagementData, error: insertError } = await supabase
      .from("user_management")
      .insert([
        {
          user_email,
          pro,
          notes: notes || null,
        },
      ])
      .select()
      .single();

    if (insertError) {
      // Handle duplicate email (primary key constraint)
      if (insertError.code === "23505") {
        return {
          data: null,
          error: "User with this email already exists",
        };
      }

      console.error("Error creating user_management record:", insertError);
      return { data: null, error: "Failed to create user_management record" };
    }

    // Step 2: Send Supabase invite using service role client
    try {
      const serviceSupabase = await createSupabaseServiceRole();

      // Construct the redirect URL to reset password page
      const baseUrl = "https://cymasphere.com";
      const redirectTo = `${baseUrl}/reset-password`;

      // Build user metadata with name if provided
      const userMetadata: {
        invited_by: string;
        first_name?: string;
        last_name?: string;
      } = {
        invited_by: "admin",
      };

      if (first_name) {
        userMetadata.first_name = first_name;
      }

      if (last_name) {
        userMetadata.last_name = last_name;
      }

      const { data: inviteData, error: inviteError } =
        await serviceSupabase.auth.admin.inviteUserByEmail(user_email, {
          data: userMetadata,
          redirectTo: redirectTo,
        });

      if (inviteError) {
        console.error("Error sending invite:", inviteError);
        // Note: We still return success for the user_management creation
        // but include a warning about the invite
        return {
          data: userManagementData as UserManagementRecord,
          warning: "User_management record created, but invite failed",
          inviteError: inviteError.message,
          error: null,
        };
      }

      return {
        data: userManagementData as UserManagementRecord,
        error: null,
      };
    } catch (inviteError) {
      console.error("Unexpected error sending invite:", inviteError);
      // Still return success for user_management creation
      return {
        data: userManagementData as UserManagementRecord,
        warning: "User_management record created, but invite failed",
        error: null,
      };
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      data: null,
      error: "Internal server error",
    };
  }
}

/**
 * Delete user_management record (admin only)
 */
export async function deleteUserManagementRecord(user_email: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { success: false, error: "Unauthorized" };
    }

    if (!user_email || typeof user_email !== "string") {
      return { success: false, error: "Valid email is required" };
    }

    const { error } = await supabase
      .from("user_management")
      .delete()
      .eq("user_email", user_email);

    if (error) {
      if (error.code === "PGRST116") {
        return { success: false, error: "Record not found" };
      }

      console.error("Error deleting user_management record:", error);
      return { success: false, error: "Failed to delete record" };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Unexpected error:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

/**
 * Get all users for CRM with admin check (admin only)
 * Wrapper around getAllUsersForCRM that adds admin authorization
 */
export async function getAllUsersForCRMAdmin(
  page: number = 1,
  limit: number = 50,
  searchTerm?: string,
  subscriptionFilter?: string,
  sortField?: string,
  sortDirection?: "asc" | "desc"
): Promise<{
  users: Array<{
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    subscription: string;
    customerId?: string;
    subscriptionExpiration?: string;
    trialExpiration?: string;
    createdAt: string;
    lastActive?: string;
    totalSpent: number;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { users: [], error: "Unauthorized" };
    }

    const result = await getAllUsersForCRM(
      page,
      limit,
      searchTerm,
      subscriptionFilter,
      sortField,
      sortDirection
    );

    return { users: result.users };
  } catch (error) {
    console.error("Error in getAllUsersForCRMAdmin:", error);
    return {
      users: [],
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

/**
 * Get user count for CRM with admin check (admin only)
 * Wrapper around getUsersForCRMCount that adds admin authorization
 */
export async function getUsersForCRMCountAdmin(
  searchTerm?: string,
  subscriptionFilter?: string
): Promise<{
  count: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { count: 0, error: "Unauthorized" };
    }

    const count = await getUsersForCRMCount(searchTerm, subscriptionFilter);
    return { count };
  } catch (error) {
    console.error("Error in getUsersForCRMCountAdmin:", error);
    return {
      count: 0,
      error:
        error instanceof Error ? error.message : "Failed to fetch user count",
    };
  }
}

/**
 * Update user profile from Stripe (admin only)
 * This is the same function used in AuthContext when users log in
 * @param userId The user ID to update
 * @returns Object indicating success and any errors
 */
export async function updateUserProfileFromStripe(userId: string): Promise<{
  success: boolean;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { success: false, error: "Unauthorized" };
    }

    if (!userId || typeof userId !== "string") {
      return { success: false, error: "Valid user ID is required" };
    }

    // Fetch the user's profile using the existing function
    const { profile, error: profileError } = await fetchProfile(userId);

    if (profileError || !profile) {
      return { success: false, error: "User profile not found" };
    }

    // Get user email from the profiles table (now synced from auth.users)
    const email = (profile as any).email;
    if (!email) {
      return { success: false, error: "User email not found in profile" };
    }

    // Import and call updateStripe (same function used in AuthContext)
    const { updateStripe } = await import("@/utils/supabase/actions");
    const { success, error: updateError } = await updateStripe(email, profile);

    if (!success) {
      return {
        success: false,
        error:
          updateError instanceof Error
            ? updateError.message
            : "Failed to update profile from Stripe",
      };
    }

    return { success: true, error: null };
  } catch (error) {
    console.error("Unexpected error updating user profile from Stripe:", error);
    return {
      success: false,
      error: "Internal server error",
    };
  }
}

/**
 * Get additional user data (lastActive, totalSpent) with admin check (admin only)
 * This is called separately after users are displayed to improve perceived performance
 */
export async function getAdditionalUserDataAdmin(userIds: string[]): Promise<{
  lastActive: Record<string, string>;
  totalSpent: Record<string, number>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    if (!(await checkAdmin(supabase))) {
      return { lastActive: {}, totalSpent: {}, error: "Unauthorized" };
    }

    const result = await getAdditionalUserData(userIds);
    return result;
  } catch (error) {
    console.error("Error in getAdditionalUserDataAdmin:", error);
    return {
      lastActive: {},
      totalSpent: {},
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch additional data",
    };
  }
}
