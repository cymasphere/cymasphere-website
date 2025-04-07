import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { Database } from "@/database.types";
import { isBuildTime } from "../build-time-skip";

// Create a mock client with all methods that return empty data
const createMockClient = () => {
  console.log('Using mock Supabase client for build process');
  
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      verifyOtp: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
    },
    from: () => ({ 
      select: () => ({ 
        eq: () => ({ single: () => Promise.resolve({ data: null, error: null }) }),
        order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }),
        match: () => Promise.resolve({ data: [], error: null }),
        is: () => Promise.resolve({ data: [], error: null }),
        in: () => Promise.resolve({ data: [], error: null }),
        limit: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null }),
      }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => ({ 
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
      }),
      delete: () => ({ 
        eq: () => Promise.resolve({ data: null, error: null }),
        match: () => Promise.resolve({ data: null, error: null }),
      }),
    }),
  };
};

export async function createClient() {
  // Check if we're in a build process
  if (isBuildTime || process.env.NODE_ENV === 'test' || process.env.NEXT_PHASE === 'phase-production-build') {
    console.log('Supabase: Using mock client during build/test process');
    return createMockClient();
  }

  // Check for required environment variables
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials - ensure environment variables are set correctly');
    return createMockClient(); // Return mock client as fallback
  }
  
  try {
    // Create a Supabase client with cookie handling
    return createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          // @ts-ignore - Next.js 14/15 cookies() typing issue
          async get(name) {
            try {
              const cookieStore = await cookies();
              return cookieStore.get(name)?.value;
            } catch (e) {
              console.warn('Error accessing cookies:', e);
              return undefined;
            }
          },
          // @ts-ignore - Next.js 14/15 cookies() typing issue
          async set(name, value, options) {
            try {
              const cookieStore = await cookies();
              cookieStore.set({ name, value, ...options });
            } catch (e) {
              console.warn('Error setting cookie:', e);
            }
          },
          // @ts-ignore - Next.js 14/15 cookies() typing issue
          async remove(name, options) {
            try {
              const cookieStore = await cookies();
              cookieStore.set({ name, value: "", ...options });
            } catch (e) {
              console.warn('Error removing cookie:', e);
            }
          },
        },
      }
    );
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    return createMockClient(); // Return mock client on error
  }
}

// For backwards compatibility with existing code
export const createSafeServerClient = createClient;
