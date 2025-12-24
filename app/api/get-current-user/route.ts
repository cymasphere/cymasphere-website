/**
 * @fileoverview Current authenticated user retrieval API endpoint
 * 
 * This endpoint returns information about the currently authenticated
 * user including profile data and admin status. Used for client-side
 * authentication state management and user profile display.
 * 
 * @module api/get-current-user
 */

import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * @brief GET endpoint to retrieve current authenticated user
 * 
 * Fetches the authenticated user's information including:
 * - User ID and email from Supabase Auth
 * - Complete profile data from profiles table
 * - Admin status and admin record (if applicable)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "user": {
 *     "id": "user-uuid",
 *     "email": "user@example.com",
 *     "profile": {
 *       "id": "user-uuid",
 *       "email": "user@example.com",
 *       "pro": true,
 *       "subscription": "annual",
 *       ...
 *     },
 *     "isAdmin": false,
 *     "adminRecord": null
 *   }
 * }
 * ```
 * 
 * 401 Unauthorized - Not authenticated:
 * ```json
 * {
 *   "error": "Not authenticated"
 * }
 * ```
 * 
 * @returns NextResponse with user data or authentication error
 * @note Requires valid Supabase authentication session
 * @note Handles case where admin record doesn't exist (PGRST116 error)
 * @note Returns null for adminRecord if user is not admin
 * 
 * @example
 * ```typescript
 * // GET /api/get-current-user
 * // Returns: { user: { id: "...", email: "...", profile: {...}, isAdmin: false } }
 * ```
 */
export async function GET() {
  const supabase = await createClient();

  // Get the authenticated user using proper authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "Not authenticated",
      },
      { status: 401 }
    );
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Check if user is admin
  const { data: adminCheck, error: adminError } = await supabase
    .from("admins")
    .select("*")
    .eq("user", user.id)
    .single();

  // Handle case where no admin record exists (PGRST116 = no rows returned)
  const isAdmin = adminError && adminError.code === 'PGRST116' ? false : !!adminCheck;

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      profile,
      isAdmin,
      adminRecord: adminCheck,
    },
  });
}
