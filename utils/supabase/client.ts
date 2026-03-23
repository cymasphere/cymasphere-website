/**
 * @fileoverview Supabase client-side client creation utility
 *
 * Mirrors `@supabase/ssr` cookie-backed browser storage, but disables automatic
 * URL session detection. `createBrowserClient` forces `flowType: "pkce"` and
 * `detectSessionInUrl: true`, which makes implicit invite/recovery links
 * (`#access_token=…`) fail GoTrue’s flow check, clear the session, and prevent
 * the reset-password page from establishing a session from the hash.
 *
 * @module utils/supabase/client
 * @note Invite/recovery hashes are applied explicitly on `/reset-password` via `setSession`.
 * @note PKCE `?code=` links still work via `exchangeCodeForSession` (flowType remains `pkce`).
 */

"use client";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createStorageFromOptions } from "@supabase/ssr/dist/module/cookies";
import { VERSION } from "@supabase/ssr/dist/module/version";
import { Database } from "@/database.types";

/** @brief True when running in a browser (matches `@supabase/ssr` `isBrowser`). */
function isBrowser(): boolean {
  return typeof window !== "undefined";
}

let cachedBrowserClient: SupabaseClient<Database> | undefined;

/**
 * @brief Creates a Supabase client for client-side (browser) operations
 *
 * @returns Supabase client instance for browser use
 * @note Uses NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 */
export const createClient = (): SupabaseClient<Database> => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  /** Match `@supabase/ssr` default: singleton in the browser when `isSingleton` is not opted out. */
  const shouldUseSingleton = isBrowser();

  if (shouldUseSingleton && cachedBrowserClient) {
    return cachedBrowserClient;
  }

  const { storage } = createStorageFromOptions(
    { cookieEncoding: "base64url" },
    false,
  );

  const client = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: {
        "X-Client-Info": `supabase-ssr/${VERSION} createBrowserClient`,
      },
    },
    auth: {
      flowType: "pkce",
      autoRefreshToken: isBrowser(),
      detectSessionInUrl: false,
      persistSession: true,
      storage,
    },
  });

  if (shouldUseSingleton) {
    cachedBrowserClient = client;
  }

  return client;
};
