"use server";

import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";

export interface UserManagementRecord {
  user_email: string;
  pro: boolean;
  notes: string | null;
}

/**
 * Check if a user has pro status via user_management table
 */
export async function checkUserManagementPro(
  email: string
): Promise<{ hasPro: boolean; notes: string | null; error: Error | null }> {
  try {
    // Use service role to bypass RLS for user_management table
    const supabase = await createSupabaseServiceRole();
    
    const { data, error } = await supabase
      .from("user_management")
      .select("pro, notes")
      .ilike("user_email", email) // Case-insensitive match
      .single();

    if (error) {
      // If no rows found, that's okay - user just doesn't have a record
      if (error.code === "PGRST116") {
        return { hasPro: false, notes: null, error: null };
      }
      return { hasPro: false, notes: null, error: error as Error };
    }

    return {
      hasPro: data?.pro ?? false,
      notes: data?.notes ?? null,
      error: null,
    };
  } catch (error) {
    return {
      hasPro: false,
      notes: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

/**
 * Get all user_management records (admin only)
 */
export async function getAllUserManagementRecords(): Promise<{
  data: UserManagementRecord[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from("user_management")
      .select("*")
      .order("user_email", { ascending: true });

    if (error) {
      return {
        data: null,
        error: error as Error,
      };
    }

    return {
      data: data as UserManagementRecord[],
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

