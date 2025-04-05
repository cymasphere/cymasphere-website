"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Detect if we're in a build/SSG context
const isBuildProcess = process.env.NODE_ENV === 'production' && 
                      !process.env.VERCEL_ENV && 
                      typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'undefined';

// Create a mock client with all methods that return empty data
const createMockClient = () => {
  return {
    auth: {
      signInWithPassword: async () => ({ 
        data: { user: null, session: null }, 
        error: { code: "not_available", message: "Authentication not available during build" } 
      }),
      // Add other auth methods as needed
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    }),
    // Add other Supabase methods as needed
  };
};

export async function createClient() {
  // Return mock client during build
  if (isBuildProcess) {
    console.log("Build process detected, returning mock Supabase client");
    return createMockClient();
  }

  const cookieStore = await cookies();

  return createServerClient(
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
 * Create a Supabase server client that safely handles missing environment variables 
 * during build time to prevent build errors
 */
export async function createSafeServerClient() {
  // Return mock client during build
  if (isBuildProcess) {
    console.log("Build process detected, returning mock Supabase client");
    return createMockClient();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Return null if environment variables are missing (during runtime)
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  try {
    return createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return [];
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookiesToSet) {},
        },
      }
    );
  } catch (error) {
    console.error("Error creating Supabase client:", error);
    return null;
  }
}
