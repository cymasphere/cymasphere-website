/**
 * @fileoverview Email verification and OTP confirmation API endpoint
 * 
 * This endpoint handles email verification and password recovery OTP confirmation.
 * Users are redirected here from email verification links. After verifying the OTP token,
 * users are redirected to the appropriate page based on the verification type
 * (email confirmation or password recovery).
 * 
 * @module api/auth/confirm
 */

"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * @brief GET endpoint to confirm email verification or password recovery OTP
 * 
 * Verifies an OTP token from email verification or password recovery links.
 * After successful verification, redirects the user to the appropriate page:
 * - Password recovery: /reset-password
 * - Email confirmation: /dashboard
 * 
 * Query parameters:
 * - token_hash: The OTP token hash from the email link (required)
 * - type: The type of OTP verification - "signup", "email", "recovery", "email_change", etc. (required)
 * 
 * Responses:
 * 
 * Redirects (302):
 * - Success (recovery type): Redirects to /reset-password
 * - Success (other types): Redirects to /dashboard
 * - Error: Redirects to /error
 * 
 * @param request Next.js request object containing query parameters
 * @returns Redirect response to appropriate page
 * @note Includes a 100ms delay after verification to ensure session is fully established
 * @note Prevents race conditions where client receives SIGNED_IN event before session is ready
 * 
 * @example
 * ```typescript
 * // GET /api/auth/confirm?token_hash=abc123&type=signup
 * // Redirects to: /dashboard
 * 
 * // GET /api/auth/confirm?token_hash=xyz789&type=recovery
 * // Redirects to: /reset-password
 * ```
 */
export async function GET(request: NextRequest) {
  // Extract query parameters from URL
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  // Verify OTP if both token_hash and type are provided
  if (token_hash && type) {
    const supabase = await createClient();

    // Verify the OTP token with Supabase
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    // If verification succeeded, redirect to appropriate page
    if (!error) {
      // Add a small delay to ensure the session is fully established
      // This prevents race conditions where the client gets SIGNED_IN event
      // before the session is completely ready in the database
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Redirect based on the type of OTP verification
      if (type === "recovery") {
        // Password recovery OTP - redirect to password reset page
        redirect("/reset-password");
      } else {
        // Email confirmation or other verification types - redirect to dashboard
        redirect("/dashboard");
      }
    }
  }

  // Redirect to error page if verification failed or parameters are missing
  redirect("/error");
}
