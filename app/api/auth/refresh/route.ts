/**
 * @fileoverview Session refresh API endpoint
 * 
 * This endpoint refreshes an expired or expiring authentication session by
 * validating the refresh token and issuing new access and refresh tokens.
 * Also updates the user's subscription status from all sources (NFR, Stripe, iOS)
 * before returning the refreshed session data.
 * 
 * @module api/auth/refresh
 */

"use server";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { Profile } from "@/utils/supabase/types";

/**
 * Extended profile interface that includes email address
 */
interface ProfileWithEmail extends Profile {
  email: string;
}

/**
 * Response type for refresh endpoint
 */
type UserResponse = {
  user: ProfileWithEmail | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  error: { code: string; message: string } | null;
};

/**
 * @brief Creates a successful refresh response
 * 
 * @param user User profile with email
 * @param access_token New JWT access token for API authentication
 * @param refresh_token New refresh token for future refreshes
 * @param expires_at Unix timestamp when the access token expires
 * @returns NextResponse with refreshed session data
 */
const ok = (
  user: ProfileWithEmail,
  access_token: string,
  refresh_token: string,
  expires_at: number | null
): NextResponse<UserResponse> => {
  return NextResponse.json({
    user,
    access_token,
    refresh_token,
    expires_at,
    error: null,
  });
};

/**
 * @brief Creates an error refresh response
 * 
 * @param code Error code identifier
 * @param message Human-readable error message
 * @returns NextResponse with error information
 */
const err = (code: string, message: string): NextResponse<UserResponse> => {
  return NextResponse.json({
    user: null,
    access_token: null,
    refresh_token: null,
    expires_at: null,
    error: { code, message },
  });
};

/**
 * @brief POST endpoint to refresh an authentication session
 * 
 * Refreshes an expired or expiring session by validating the refresh token and
 * issuing new access and refresh tokens. If setting the session fails, attempts
 * to refresh the session directly. Updates subscription status from all sources
 * (NFR, Stripe, iOS) before returning the refreshed session data.
 * 
 * Request body (FormData):
 * - access_token: Current JWT access token (required)
 * - refresh_token: Refresh token to validate and use for refresh (required)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "user": {
 *     "id": "uuid",
 *     "email": "user@example.com",
 *     "first_name": "John",
 *     "last_name": "Doe",
 *     "subscription": "monthly",
 *     "subscription_expiration": "2024-12-31T00:00:00.000Z",
 *     "subscription_source": "stripe"
 *   },
 *   "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
 *   "refresh_token": "v1.MQo7x8K9...",
 *   "expires_at": 1735689600,
 *   "error": null
 * }
 * ```
 * 
 * 200 OK - Missing tokens:
 * ```json
 * {
 *   "user": null,
 *   "access_token": null,
 *   "refresh_token": null,
 *   "expires_at": null,
 *   "error": {
 *     "code": "invalid_token",
 *     "message": "access_token and refresh_token are required"
 *   }
 * }
 * ```
 * 
 * 200 OK - Invalid refresh token:
 * ```json
 * {
 *   "user": null,
 *   "access_token": null,
 *   "refresh_token": null,
 *   "expires_at": null,
 *   "error": {
 *     "code": "invalid_grant",
 *     "message": "Invalid refresh token"
 *   }
 * }
 * ```
 * 
 * 200 OK - Profile fetch error:
 * ```json
 * {
 *   "user": null,
 *   "access_token": null,
 *   "refresh_token": null,
 *   "expires_at": null,
 *   "error": {
 *     "code": "PGRST116",
 *     "message": "The result contains 0 rows"
 *   }
 * }
 * ```
 * 
 * 200 OK - Unexpected error:
 * ```json
 * {
 *   "user": null,
 *   "access_token": null,
 *   "refresh_token": null,
 *   "expires_at": null,
 *   "error": {
 *     "code": "unexpected_failure",
 *     "message": "An unexpected error occurred"
 *   }
 * }
 * ```
 * 
 * @param request Next.js request object containing FormData with tokens
 * @returns NextResponse with refreshed user profile, tokens, or error
 * @note If setting session fails, attempts to refresh session directly
 * @note Subscription status is checked from NFR, Stripe, and iOS sources
 * 
 * @example
 * ```typescript
 * // POST /api/auth/refresh
 * // FormData: { access_token: "...", refresh_token: "..." }
 * // Returns: { user: {...}, access_token: "...", refresh_token: "...", expires_at: 1735689600, error: null }
 * ```
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<UserResponse>> {
  try {
    // Extract client IP and device info from request headers for session metadata
    // Supports both direct IP and proxied requests (x-forwarded-for)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    const allHeaders: Record<string, string> = {};
    if (clientIp) {
      allHeaders["X-Forwarded-For"] = clientIp;
    }
    if (userAgent) {
      allHeaders["User-Agent"] = userAgent;
    }

    // Create Supabase server client with forwarded headers so session has device metadata
    // Cookies are not used in this API route (stateless authentication)
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return [];
          },
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          setAll(_cookiesToSet) {},
        },
        global: {
          headers: allHeaders,
        },
      }
    );

    // Parse form data from request body
    const body = await request.formData();
    const access_token = body.get("access_token")?.toString();
    const refresh_token = body.get("refresh_token")?.toString();

    // Validate required tokens
    if (!access_token || !refresh_token)
      return err(
        "invalid_token",
        "access_token and refresh_token are required"
      );

    // Variables to hold session, user, and error state
    let session;
    let user;
    let error;

    // First, try to set the session in Supabase using provided tokens
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (setSessionError) {
      // If setting session failed (e.g., tokens expired), try to refresh directly
      // This handles the case where access token is expired but refresh token is still valid
      const refreshResult = await supabase.auth.refreshSession({
        refresh_token,
      });

      user = refreshResult.data.user;
      session = refreshResult.data.session;
      error = refreshResult.error;
    } else {
      // Session was set successfully, get current user and session
      const { data, error: getUserError } = await supabase.auth.getUser();
      user = data.user;

      // Get current session data
      const { data: sessionData } = await supabase.auth.getSession();
      session = sessionData.session;
      error = getUserError;
    }

    // Return error if we couldn't get user or session
    if (error) {
      return err(error.code as string, error.message);
    }

    // Proceed only if we have a valid session and user with email
    if (session && user && user.email) {
      // Fetch user profile from database
      const { data: profile, error: profile_error } = await supabase
        .from("profiles")
        .select()
        .eq("id", user.id)
        .single();

      if (profile_error) {
        return err(profile_error.code, profile_error.message);
      }

      if (profile) {
        // Check and update subscription status from all sources (NFR, Stripe, and iOS)
        // This ensures the user's subscription is up-to-date on session refresh
        try {
          // Use centralized function that handles NFR, Stripe, and iOS subscription checks
          const { updateUserProStatus } = await import(
            "@/utils/subscriptions/check-subscription"
          );
          const subscriptionCheck = await updateUserProStatus(user.id);

          console.log(`[Refresh] Subscription check for ${user.email}:`, {
            subscription: subscriptionCheck.subscription,
            source: subscriptionCheck.source,
            expiration: subscriptionCheck.subscriptionExpiration,
          });

          // Update profile with latest subscription information
          const finalProfileWithSubscription = {
            ...profile,
            subscription: subscriptionCheck.subscription,
            subscription_expiration:
              subscriptionCheck.subscriptionExpiration?.toISOString() || null,
            subscription_source: subscriptionCheck.source,
            email: user.email,
          };

          console.log(
            `[Refresh] Returning profile with subscription: ${finalProfileWithSubscription.subscription}`
          );

          // Return success response with updated profile and refreshed tokens
          return ok(
            finalProfileWithSubscription,
            session.access_token,
            session.refresh_token,
            session.expires_at || null
          );
        } catch (error) {
          console.error("[Refresh] Error checking subscription:", error);
          // Continue with original profile if subscription check fails
          // Don't block refresh if subscription check has issues
        }

        // Return success response with original profile if subscription check failed
        return ok(
          { ...profile, email: user.email },
          session.access_token,
          session.refresh_token,
          session.expires_at || null
        );
      }
    }

    // Return error if we don't have a valid user/session
    return err("unexpected_failure", "An unexpected error occurred");
  } catch (error) {
    // Log and return generic error for any unexpected exceptions
    console.error(error);
    return err("unexpected_failure", "An unexpected error occurred");
  }
}
