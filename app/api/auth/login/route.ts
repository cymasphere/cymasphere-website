/**
 * @fileoverview User authentication login API endpoint
 * 
 * This endpoint handles user login authentication using email and password.
 * It validates credentials, enforces device limits (max 3 devices for mobile app),
 * checks subscription status, and returns user profile with authentication tokens.
 * Supports both web browsers and Cymasphere mobile app user agents.
 * 
 * @module api/auth/login
 */

"use server";

import { NextResponse, type NextRequest } from "next/server";

import { Profile } from "@/utils/supabase/types";
import { createServerClient } from "@supabase/ssr";
import { Database } from "@/database.types";

/**
 * Extended profile interface that includes email address
 */
interface ProfileWithEmail extends Profile {
  email: string;
}

/**
 * Response type for login endpoint
 */
type LoginResponse = {
  user: ProfileWithEmail | null;
  access_token: string | null;
  refresh_token: string | null;
  expires_at: number | null;
  error: { code: string; message: string } | null;
};

/**
 * @brief Creates a successful login response
 * 
 * @param user User profile with email
 * @param access_token JWT access token for API authentication
 * @param refresh_token Token used to refresh the access token
 * @param expires_at Unix timestamp when the access token expires
 * @returns NextResponse with successful login data
 */
const ok = (
  user: ProfileWithEmail,
  access_token: string,
  refresh_token: string,
  expires_at: number | null
): NextResponse<LoginResponse> => {
  return NextResponse.json({
    user,
    access_token,
    refresh_token,
    expires_at,
    error: null,
  });
};

/**
 * @brief Creates an error login response
 * 
 * @param code Error code identifier
 * @param message Human-readable error message
 * @returns NextResponse with error information
 */
const err = (code: string, message: string): NextResponse<LoginResponse> => {
  return NextResponse.json({
    user: null,
    access_token: null,
    refresh_token: null,
    expires_at: null,
    error: { code, message },
  });
};

/**
 * @brief POST endpoint to authenticate user with email and password
 * 
 * Authenticates a user using email and password credentials. Validates user agent,
 * enforces maximum device limits for mobile app users (3 devices), checks subscription
 * status from multiple sources (NFR, Stripe, iOS), and returns user profile with
 * authentication tokens.
 * 
 * Request body (FormData):
 * - email: User's email address (required)
 * - password: User's password (required)
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
 * 200 OK - Invalid credentials:
 * ```json
 * {
 *   "user": null,
 *   "access_token": null,
 *   "refresh_token": null,
 *   "expires_at": null,
 *   "error": {
 *     "code": "invalid_credentials",
 *     "message": "email and password fields are required"
 *   }
 * }
 * ```
 * 
 * 200 OK - Maximum devices exceeded:
 * ```json
 * {
 *   "user": null,
 *   "access_token": null,
 *   "refresh_token": null,
 *   "expires_at": null,
 *   "error": {
 *     "code": "maximum_devices",
 *     "message": "Maximum number of devices already logged in"
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
 *     "message": "An unexpected error occured"
 *   }
 * }
 * ```
 * 
 * @param request Next.js request object containing FormData with email and password
 * @returns NextResponse with user profile, tokens, or error
 * @note Maximum 3 devices allowed for mobile app users (user agents starting with "cymasphere:")
 * @note Subscription status is checked from NFR, Stripe, and iOS sources
 * @note Client IP and user agent are forwarded to Supabase for security tracking
 * 
 * @example
 * ```typescript
 * // POST /api/auth/login
 * // FormData: { email: "user@example.com", password: "securepassword" }
 * // Returns: { user: {...}, access_token: "...", refresh_token: "...", expires_at: 1735689600, error: null }
 * ```
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LoginResponse>> {
  try {
    // Parse form data from request body
    const body = await request.formData();

    const email = body.get("email")?.toString();
    const password = body.get("password")?.toString();

    // Validate required fields
    if (!email || !password)
      return err(
        "invalid_credentials",
        "email and password fields are required"
      );

    // Extract client IP and device info from request headers for security tracking
    // Supports both direct IP and proxied requests (x-forwarded-for)
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip");
    const userAgent = request.headers.get("user-agent");

    // User agent is required for security validation
    // Allow both Cymasphere app and web browser user agents
    if (!userAgent) {
      return err("invalid_credentials", "Invalid credentials");
    }

    // Build headers object to forward to Supabase for security tracking
    const allHeaders: Record<string, string> = {};
    if (clientIp) {
      allHeaders["X-Forwarded-For"] = clientIp;
    }
    if (userAgent) {
      allHeaders["User-Agent"] = userAgent;
    }

    // Create Supabase server client with forwarded headers
    // Cookies are not used in this API route (stateless authentication)
    const supabase = createServerClient<Database>(
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

    // Attempt to sign in with provided credentials
    const {
      data: { user, session },
      error,
    } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Return error if authentication failed
    if (error) {
      return err(error.code as string, error.message);
    }

    // Proceed only if we have a valid session and user with email
    if (session && user && user.email) {
      // Check for maximum devices (mobile app only - user agents starting with "cymasphere:")
      // Web browsers are not subject to device limits
      const { data: userSessions, error: sessionsError } = await supabase
        .from("user_sessions")
        .select("*")
        .eq("user_id", user.id);

      if (sessionsError) {
        // Handle session fetch error silently - don't block login if we can't check devices
      } else {
        // Filter sessions to only count mobile app sessions (user agent starts with "cymasphere:")
        const cymasphereUserAgents =
          userSessions
            ?.filter(
              (session) =>
                session.user_agent &&
                session.user_agent.startsWith("cymasphere:")
            )
            .map((session) => session.user_agent) || [];

        // Get unique user agents to count unique devices
        // Same device with different sessions still counts as one device
        const uniqueUserAgents = [...new Set(cymasphereUserAgents)];
        const deviceCount = uniqueUserAgents.length;

        // Enforce maximum of 3 devices for mobile app users
        // If device count exceeds limit, sign out and return error
        if (deviceCount > 3) {
          await supabase.auth.signOut();
          return err(
            "maximum_devices",
            "Maximum number of devices already logged in"
          );
        }
      }

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
        // This ensures the user's subscription is up-to-date on login
        try {
          // Use centralized function that handles NFR, Stripe, and iOS subscription checks
          const { updateUserProStatus } = await import(
            "@/utils/subscriptions/check-subscription"
          );
          const subscriptionCheck = await updateUserProStatus(user.id);

          console.log(`[Login] Subscription check for ${user.email}:`, {
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
            `[Login] Returning profile with subscription: ${finalProfileWithSubscription.subscription}`
          );

          // Return success response with updated profile and tokens
          return ok(
            finalProfileWithSubscription,
            session.access_token,
            session.refresh_token,
            session.expires_at || null
          );
        } catch (error) {
          console.error("[Login] Error checking subscription:", error);
          // Continue with original profile if subscription check fails
          // Don't block login if subscription check has issues
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
    return err("unexpected_failure", "An unexpected error occured");
  } catch {
    // Catch any unexpected errors and return generic error
    return err("unexpected_failure", "An unexpected error occured");
  }
}
