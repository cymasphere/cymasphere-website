/**
 * @fileoverview Next.js root proxy (replaces deprecated middleware convention)
 *
 * Responsibilities, in order:
 * 1. Capture `?ref=AFFILIATE_CODE` from any landing URL and store it in a
 *    long-lived `cymasphere_ref` cookie so the checkout route can auto-apply
 *    the matching Stripe Promotion Code.
 * 2. Refresh the Supabase auth session via `updateSession`.
 * 3. Add security headers to matching responses.
 *
 * Skips static assets, Next internals, and API routes (API reads the cookie directly).
 *
 * @module proxy
 */

import { type NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Cookie name used to remember the last-seen affiliate code for this
 * browser. Read by the Stripe checkout route to auto-apply the
 * corresponding promotion code.
 */
const REF_COOKIE = "cymasphere_ref";

/**
 * Affiliate cookie lifetime in seconds. Sixty days mirrors the standard
 * affiliate "last-click attribution" industry default.
 */
const REF_COOKIE_MAX_AGE = 60 * 60 * 24 * 60;

/**
 * Pattern for valid affiliate codes: 3-32 uppercase alphanumeric.
 * Anything else is ignored so we don't write garbage cookies.
 */
const CODE_PATTERN = /^[A-Z0-9]{3,32}$/;

/**
 * Security headers to add to every response
 */
const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains; preload",
  "Content-Security-Policy":
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https: wss:; worker-src 'self' blob:; frame-ancestors 'none'; frame-src 'self' https://js.stripe.com https://hooks.stripe.com; base-uri 'self'; form-action 'self'",
};

export async function proxy(request: NextRequest) {
  const refParam = request.nextUrl.searchParams.get("ref");

  let response = await updateSession(request);

  if (refParam) {
    const candidate = refParam.toUpperCase();
    if (CODE_PATTERN.test(candidate)) {
      response.cookies.set(REF_COOKIE, candidate, {
        maxAge: REF_COOKIE_MAX_AGE,
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      });
    }
  }

  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map)$).*)",
  ],
};
