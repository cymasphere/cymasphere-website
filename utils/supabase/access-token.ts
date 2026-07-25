/**
 * @fileoverview Supabase client scoped to a Bearer access token.
 *
 * Used by API routes when the caller (e.g. Cymasphere desktop app) passes a JWT
 * instead of a cookie session. Not a Server Action — do not add "use server".
 *
 * @module utils/supabase/access-token
 */

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/database.types";

/**
 * @brief Supabase client scoped to a Bearer access token (native app / API callers).
 *
 * Required for RLS inserts when the request has no cookie session — auth.uid() must
 * match the JWT passed from the Cymasphere desktop app.
 */
export function createClientWithAccessToken(
  accessToken: string
): SupabaseClient<Database> {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    }
  );
}
