import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Detect if we're in a build/SSG context
const isBuildProcess = process.env.NODE_ENV === 'production' && 
                      (!process.env.VERCEL_ENV || process.env.NEXT_BUILD_SKIP_VALIDATION === 'true') && 
                      (typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'undefined' || process.env.NEXT_BUILD_SKIP_VALIDATION === 'true');

// Create a mock client with all methods that return empty data
const createMockClient = () => {
  return {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
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

// Create a Supabase client for server components - safe for build time
export function createSafeServerClient() {
  if (isBuildProcess) {
    console.log('Using mock Supabase client for build process');
    return createMockClient();
  }

  // Note: TypeScript issues with cookies() are suppressed temporarily
  // This is a known issue with the typing for cookies() in Next.js
  const cookieStore = cookies();
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    {
      cookies: {
        get(name) {
          // @ts-ignore - TypeScript doesn't recognize cookies() result correctly
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          // @ts-ignore - TypeScript doesn't recognize cookies() result correctly
          cookieStore.set(name, value, options);
        },
        remove(name, options) {
          // @ts-ignore - TypeScript doesn't recognize cookies() result correctly
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
}
