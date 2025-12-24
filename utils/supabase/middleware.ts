/**
 * @fileoverview Supabase middleware for session management
 * 
 * This file provides middleware functionality for managing Supabase authentication
 * sessions in Next.js middleware. Refreshes user sessions automatically and
 * handles cookie management for authentication state.
 * 
 * @module utils/supabase/middleware
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * @brief Updates Supabase authentication session in middleware
 * 
 * Creates a Supabase client in middleware context and refreshes the user's
 * authentication session. This ensures sessions stay valid across requests
 * and handles automatic token refresh.
 * 
 * CRITICAL: Do not remove the `supabase.auth.getUser()` call. It is required
 * for session refresh. Removing it can cause users to be randomly logged out.
 * 
 * @param request Next.js request object
 * @returns NextResponse with updated cookies for session management
 * @note Must return the supabaseResponse object as-is to preserve cookies
 * @note Do not run code between createServerClient and getUser()
 * @note If creating a new response, must copy cookies from supabaseResponse
 * 
 * @example
 * ```typescript
 * // In middleware.ts
 * export async function middleware(request: NextRequest) {
 *   return await updateSession(request);
 * }
 * ```
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  // const {
  //   data: { user },
  // } =
  await supabase.auth.getUser();

  // if (
  //   !user &&
  //   !request.nextUrl.pathname.startsWith("/login") &&
  //   !request.nextUrl.pathname.startsWith("/auth")
  // ) {
  // no user, potentially respond by redirecting the user to the login page
  // const url = request.nextUrl.clone();
  // url.pathname = "/login";
  // return NextResponse.redirect(url);
  // }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse;
}
