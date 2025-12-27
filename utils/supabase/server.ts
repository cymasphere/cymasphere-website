/**
 * @fileoverview Supabase server-side client creation utility
 * 
 * This file provides a function to create a Supabase client for server-side
 * operations in Next.js. Uses Supabase SSR (Server-Side Rendering) utilities
 * to handle cookie-based authentication sessions. The client respects Row
 * Level Security (RLS) policies based on the authenticated user.
 * 
 * @module utils/supabase/server
 */

"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

/**
 * @brief Creates a Supabase client for server-side operations
 * 
 * Creates a Supabase client configured for server-side use in Next.js.
 * Handles cookie-based authentication sessions and respects RLS policies.
 * Uses the anonymous key, so all queries are subject to Row Level Security.
 * Defaults to the 'public' schema for better TypeScript type inference.
 * 
 * @returns Promise resolving to a Supabase client instance scoped to the public schema
 * @note Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * @note Handles cookie management for authentication sessions
 * @note Silently handles cookie setting errors (expected in Server Components)
 * @note Works with middleware for session refresh
 * @note For stripe_tables schema access, use createStripeClient() instead
 * 
 * @example
 * ```typescript
 * const supabase = await createClient();
 * const { data } = await supabase.from("profiles").select("*");
 * ```
 */
export async function createClient(): Promise<SupabaseClient<Database, "public">> {
  const cookieStore = await cookies();

  return createServerClient<Database, "public">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

/**
 * @brief Creates a Supabase client scoped to the stripe_tables schema
 * 
 * Creates a Supabase client configured for server-side use, scoped specifically
 * to the 'stripe_tables' schema. This is used for accessing Stripe data
 * stored in the private stripe_tables schema.
 * 
 * @returns Promise resolving to a Supabase client instance scoped to the stripe_tables schema
 * @note Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * @note Handles cookie management for authentication sessions
 * @note Use this when you need to query tables in the stripe_tables schema
 * @note For most queries, use createClient() which defaults to the public schema
 * 
 * @example
 * ```typescript
 * const supabase = await createStripeClient();
 * const { data } = await supabase.from("stripe_subscriptions").select("*");
 * ```
 */
export async function createStripeClient(): Promise<SupabaseClient<Database, "stripe_tables">> {
  const cookieStore = await cookies();

  return createServerClient<Database, "stripe_tables">(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}
