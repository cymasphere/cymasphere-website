/**
 * @fileoverview Supabase service role client creation utility
 * 
 * This file provides a function to create a Supabase client with service role
 * privileges. This client bypasses Row Level Security (RLS) and should only
 * be used for server-side admin operations that require elevated permissions.
 * 
 * @module utils/supabase/service
 */

"use server";

import { Database } from "@/database.types";
import { createClient } from "@supabase/supabase-js";

/**
 * @brief Creates a Supabase client with service role privileges
 * 
 * Creates a Supabase client using the service role key, which bypasses
 * Row Level Security (RLS) policies. This should ONLY be used for:
 * - Admin operations requiring elevated permissions
 * - Accessing private schemas (e.g., stripe_tables)
 * - Operations that need to bypass RLS for legitimate reasons
 * 
 * ⚠️ SECURITY WARNING: This client bypasses all RLS policies. Use with
 * extreme caution and only in server-side code. Never expose this client
 * to the client-side.
 * 
 * @returns Promise resolving to a Supabase client with service role privileges
 * @note Uses NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
 * @note Bypasses all Row Level Security policies
 * @note Should only be used server-side for admin operations
 * 
 * @example
 * ```typescript
 * const supabase = await createSupabaseServiceRole();
 * // Can access any table regardless of RLS policies
 * const { data } = await supabase.from("private_table").select("*");
 * ```
 */
export async function createSupabaseServiceRole() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
