/**
 * @fileoverview Pre-checks whether a guest email may start checkout without logging in.
 *
 * @module api/checkout/guest-email-eligibility
 *
 * ## POST /
 *
 * **Request body:** `{ "email": string }` — must be a syntactically valid address.
 *
 * **Responses:**
 * - `200` `{ "allowed": true, "loggedIn": true }` — caller has a session (skip guest gating).
 * - `200` `{ "allowed": true, "loggedIn": false }` — no profile for this email; guest checkout may proceed.
 * - `403` `{ "allowed": false, "error": "ACCOUNT_EXISTS_REQUIRE_LOGIN", "message": string }` — profile exists; user must log in and use Billing.
 * - `400` `{ "allowed": false, "error": "INVALID_EMAIL", "message": string }` — missing or invalid email.
 * - `429` `{ "allowed": false, "error": "RATE_LIMIT", "message": string }` — too many requests from this IP.
 * - `500` `{ "allowed": false, "error": "SERVER_ERROR", "message": string }` — unexpected failure.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { guestCheckoutEmailRequiresLogin } from "@/utils/checkout/guest-checkout-account-guard";
import {
  ACCOUNT_EXISTS_REQUIRE_LOGIN,
  ACCOUNT_EXISTS_REQUIRE_LOGIN_MESSAGE,
} from "@/utils/checkout/guest-checkout-constants";
import { checkRateLimit, getClientIp } from "@/utils/rate-limit";

/**
 * @brief POST `{ email: string }` — if not logged in and a profile exists for the email, `allowed` is false.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIp = getClientIp(request);
    if (!checkRateLimit(clientIp, 20, 60)) {
      return NextResponse.json(
        { allowed: false, error: "RATE_LIMIT", message: "Too many requests." },
        { status: 429 },
      );
    }

    const body: unknown = await request.json();
    const email =
      typeof body === "object" &&
      body !== null &&
      "email" in body &&
      typeof (body as { email: unknown }).email === "string"
        ? (body as { email: string }).email
        : "";
    const trimmed = email.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return NextResponse.json(
        { allowed: false, error: "INVALID_EMAIL", message: "Enter a valid email." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user?.id) {
      return NextResponse.json({ allowed: true, loggedIn: true });
    }

    const requiresLogin = await guestCheckoutEmailRequiresLogin(trimmed, user?.id);
    if (requiresLogin) {
      return NextResponse.json(
        {
          allowed: false,
          error: ACCOUNT_EXISTS_REQUIRE_LOGIN,
          message: ACCOUNT_EXISTS_REQUIRE_LOGIN_MESSAGE,
        },
        { status: 403 },
      );
    }

    return NextResponse.json({ allowed: true, loggedIn: false });
  } catch (e) {
    console.error("[guest-email-eligibility]", e);
    return NextResponse.json(
      { allowed: false, error: "SERVER_ERROR", message: "Something went wrong." },
      { status: 500 },
    );
  }
}
