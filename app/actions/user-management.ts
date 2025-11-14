"use server";

import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

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
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'https://www.cymasphere.com';
      const redirectTo = `${baseUrl}/reset-password`;

      // Build user metadata with name if provided
      const userMetadata: { invited_by: string; first_name?: string; last_name?: string } = {
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
export async function deleteUserManagementRecord(
  user_email: string
): Promise<{
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

