/**
 * @fileoverview Keeps Stripe Customer `email` aligned with Supabase Auth after email changes.
 *
 * Billing and webhooks rely on `profiles.customer_id`; this sync avoids drift between
 * Stripe’s stored `customer.email` and `profiles.email` for support and fallback lookups.
 *
 * @module utils/stripe/sync-customer-email
 */

import Stripe from "stripe";

import { createSupabaseServiceRole } from "@/utils/supabase/service";

/**
 * @brief Updates the Stripe Customer email to match the authenticated user’s new address.
 *
 * @param userId Supabase `auth.users` / `profiles.id` UUID.
 * @param newEmail Email address after the change (typically normalized to lowercase).
 * @returns Resolves when Stripe update completes or is skipped (no customer, missing key).
 * @note Does not throw on Stripe errors: email change in Auth must succeed regardless.
 * @note Server-only; requires `STRIPE_SECRET_KEY` and service role for profile lookup.
 *
 * @example
 * ```ts
 * await syncStripeCustomerEmailForUser(session.user.id, session.user.email);
 * ```
 */
export async function syncStripeCustomerEmailForUser(
  userId: string,
  newEmail: string,
): Promise<void> {
  const trimmed = newEmail.trim().toLowerCase();
  if (!trimmed) {
    return;
  }

  const secret = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secret) {
    console.warn(
      "[syncStripeCustomerEmailForUser] STRIPE_SECRET_KEY missing; skipping Stripe email sync",
    );
    return;
  }

  const supabase = await createSupabaseServiceRole();
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    console.error(
      "[syncStripeCustomerEmailForUser] Failed to load profile:",
      error.message,
    );
    return;
  }

  const customerId = profile?.customer_id?.trim();
  if (!customerId) {
    return;
  }

  const stripe = new Stripe(secret, {
    apiVersion: "2025-12-15.clover",
  });

  try {
    await stripe.customers.update(customerId, {
      email: trimmed,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(
      `[syncStripeCustomerEmailForUser] Stripe customers.update failed for ${customerId}:`,
      message,
    );
  }
}
