"use client";

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

// Create a client-side supabase client for browser usage
export const createBrowserClient = (): SupabaseClient<Database> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  return createClient<Database>(supabaseUrl, supabaseAnonKey);
};
