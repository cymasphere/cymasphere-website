/**
 * @fileoverview Stripe Connect onboarding return endpoint.
 *
 * Customers hit this URL after completing (or abandoning) Stripe's
 * hosted onboarding flow. We re-fetch the account, persist the
 * `payouts_enabled` / `charges_enabled` state on the affiliate row,
 * then redirect back to the affiliate dashboard.
 *
 * Stripe doesn't pass the account id back on the return URL — we look
 * it up from the authenticated user's affiliate row.
 *
 * @module api/affiliate/connect/return
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { getAffiliateStripeClient } from "@/utils/affiliates/stripe";

/**
 * @brief GET handler for the Stripe Connect return URL.
 *
 * Redirects to `/affiliate?connect=<state>` where state is one of:
 *  - `done` (payouts enabled)
 *  - `pending` (onboarding started but more info needed)
 *  - `error` (lookup/refresh failure)
 *  - `unauth` (no session)
 */
export async function GET(_request: NextRequest) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${baseUrl}/login?next=/affiliate`);
  }

  const service = await createSupabaseServiceRole();
  const { data: affiliate } = await service
    .from("affiliates")
    .select("id, stripe_connect_account_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!affiliate?.stripe_connect_account_id) {
    return NextResponse.redirect(`${baseUrl}/affiliate?connect=error`);
  }

  const stripe = getAffiliateStripeClient();
  try {
    const account = await stripe.accounts.retrieve(
      affiliate.stripe_connect_account_id,
    );
    const payoutsEnabled = Boolean(
      account.payouts_enabled && account.charges_enabled,
    );

    await service
      .from("affiliates")
      .update({
        connect_payouts_enabled: payoutsEnabled,
        connect_onboarded_at: payoutsEnabled
          ? new Date().toISOString()
          : null,
      })
      .eq("id", affiliate.id);

    return NextResponse.redirect(
      `${baseUrl}/affiliate?connect=${payoutsEnabled ? "done" : "pending"}`,
    );
  } catch (err) {
    console.error("[connect/return] account.retrieve failed:", err);
    return NextResponse.redirect(`${baseUrl}/affiliate?connect=error`);
  }
}
