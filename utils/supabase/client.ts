"use client";

import { createBrowserClient } from "@supabase/ssr";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

// Create a client-side supabase client for browser usage
export const createClient = (): SupabaseClient<Database> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
};

// Keep the old function for backward compatibility
export function createSupabaseBrowser(): SupabaseClient<Database> {
  return createClient();
}
