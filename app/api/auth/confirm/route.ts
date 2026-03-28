/**
 * @fileoverview Email verification and OTP confirmation API endpoint
 *
 * Handles email verification, password recovery OTP confirmation, and email-change
 * confirmation (Supabase `email_change` / related OTP types). Users arrive here from
 * links in auth emails; after `verifyOtp` succeeds they are redirected by type.
 *
 * @module api/auth/confirm
 */

"use server";

import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest } from "next/server";

import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

/**
 * @brief GET endpoint to confirm email verification, password recovery, or email-change OTPs.
 *
 * Verifies an OTP token from Supabase auth emails (`verifyOtp`). After success, redirects:
 * - `recovery` → `/reset-password`
 * - `signup`, `email`, `email_change`, and other non-recovery types → `/dashboard`
 *
 * @param request Next.js request object; must include `token_hash` and `type` query params.
 * @returns Never returns JSON; redirects on success or failure.
 *
 * Query parameters:
 * - `token_hash`: OTP token hash from the email link (required).
 * - `type`: `EmailOtpType` (e.g. `signup`, `email`, `recovery`, `email_change`) (required).
 *
 * Responses (redirects):
 * - 302 `recovery` success → `/reset-password`
 * - 302 other success → `/dashboard` (including after confirming a new email address)
 * - 302 missing/invalid token or verification error → `/error`
 *
 * @note 100ms delay after verification so the session is established before the client runs.
 * @note Prevents race conditions where the client receives SIGNED_IN before session is ready.
 *
 * @example
 * ```text
 * GET /api/auth/confirm?token_hash=abc123&type=signup
 * → 302 /dashboard
 *
 * GET /api/auth/confirm?token_hash=xyz789&type=recovery
 * → 302 /reset-password
 *
 * GET /api/auth/confirm?token_hash=def456&type=email_change
 * → 302 /dashboard
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
