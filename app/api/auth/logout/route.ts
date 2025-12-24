/**
 * @fileoverview User logout API endpoint
 * 
 * This endpoint handles user logout by invalidating the current session.
 * Supports different logout scopes: local (current device), global (all devices),
 * or others (all other devices except current). The session must be set before
 * logout can be performed.
 * 
 * @module api/auth/logout
 */

"use server";

import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Response type for logout endpoint
 */
type LogoutResponse = {
  success: boolean;
  error: { code: string; message: string } | null;
};

/**
 * @brief Creates a successful logout response
 * 
 * @returns NextResponse with success status
 */
const ok = (): NextResponse<LogoutResponse> => {
  return NextResponse.json({
    success: true,
    error: null,
  });
};

/**
 * @brief Creates an error logout response
 * 
 * @param code Error code identifier
 * @param message Human-readable error message
 * @returns NextResponse with error information
 */
const err = (code: string, message: string): NextResponse<LogoutResponse> => {
  return NextResponse.json({
    success: false,
    error: { code, message },
  });
};

/**
 * Supabase server client instance for authentication operations
 * Cookies are not used in this API route (stateless authentication)
 */
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
  }
);

/**
 * @brief POST endpoint to logout a user session
 * 
 * Invalidates the user's authentication session. The session must be set first
 * using the provided access and refresh tokens. Supports different logout scopes
 * to control which devices are logged out.
 * 
 * Request body (FormData):
 * - access_token: JWT access token for the session to logout (required)
 * - refresh_token: Refresh token for the session (required)
 * - scope: Logout scope - "local" (default), "global" (all devices), or "others" (all other devices) (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "error": null
 * }
 * ```
 * 
 * 200 OK - Missing tokens:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "invalid_token",
 *     "message": "access_token and refresh_token are required"
 *   }
 * }
 * ```
 * 
 * 200 OK - Session set error:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "invalid_grant",
 *     "message": "Invalid refresh token"
 *   }
 * }
 * ```
 * 
 * 200 OK - Logout error:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "invalid_session",
 *     "message": "Session not found"
 *   }
 * }
 * ```
 * 
 * 200 OK - Unexpected error:
 * ```json
 * {
 *   "success": false,
 *   "error": {
 *     "code": "unexpected_failure",
 *     "message": "An unexpected error occurred"
 *   }
 * }
 * ```
 * 
 * @param request Next.js request object containing FormData with tokens and scope
 * @returns NextResponse with success status or error
 * @note Session must be set before logout can be performed
 * @note "local" scope logs out only the current device, "global" logs out all devices, "others" logs out all other devices
 * 
 * @example
 * ```typescript
 * // POST /api/auth/logout
 * // FormData: { access_token: "...", refresh_token: "...", scope: "local" }
 * // Returns: { success: true, error: null }
 * ```
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<LogoutResponse>> {
  try {
    // Parse form data from request body
    const body = await request.formData();
    const access_token = body.get("access_token")?.toString();
    const refresh_token = body.get("refresh_token")?.toString();
    // Default to "local" scope if not specified (logout only current device)
    const scope = (body.get("scope")?.toString() || "local") as
      | "global"
      | "local"
      | "others";

    // Validate required tokens
    if (!access_token || !refresh_token)
      return err(
        "invalid_token",
        "access_token and refresh_token are required"
      );

    // Set the session in Supabase first
    // This is required before we can perform logout operations
    const { error: setSessionError } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    // Return error if session could not be set (invalid tokens)
    if (setSessionError) {
      return err(setSessionError.code as string, setSessionError.message);
    }

    // Sign out with the specified scope
    // - "local": Logout only the current device/session
    // - "global": Logout all devices/sessions for this user
    // - "others": Logout all other devices except the current one
    const { error } = await supabase.auth.signOut({ scope });

    // Return error if logout failed
    if (error) {
      return err(error.code as string, error.message);
    }

    // Return success response
    return ok();
  } catch {
    // Catch any unexpected errors and return generic error
    return err("unexpected_failure", "An unexpected error occurred");
  }
}
