/**
 * @fileoverview Stripe Connect Express onboarding for affiliates.
 *
 * Creates (or reuses) a Stripe Express connected account for the calling
 * affiliate, then returns a one-time onboarding Account Link URL. The
 * client redirects the user to that URL; Stripe collects KYC / banking
 * info and redirects back to `/api/affiliate/connect/return` which
 * finalises `connect_payouts_enabled`.
 *
 * Auth: only the affiliate themselves may call this. We do NOT allow
 * admins to onboard on behalf of an affiliate (Stripe requires the
 * account holder to complete onboarding personally).
 *
 * @module api/affiliate/connect/onboard
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createSupabaseServiceRole } from "@/utils/supabase/service";
import { getAffiliateStripeClient } from "@/utils/affiliates/stripe";

/**
 * @brief POST endpoint to start Stripe Connect onboarding.
 *
 * Responses:
 * - 200 OK: `{ url: string }` — redirect target for onboarding
 * - 401 Unauthorized
 * - 403 Forbidden (caller is not an affiliate)
 * - 500 Internal Server Error
 */
export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createSupabaseServiceRole();
  const { data: affiliate, error } = await service
    .from("affiliates")
    .select(
      "id, user_id, stripe_connect_account_id, status, connect_payouts_enabled",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    console.error("[connect/onboard] affiliate lookup failed:", error);
    return NextResponse.json(
      { error: "Lookup failed" },
      { status: 500 },
    );
  }
  if (!affiliate) {
    return NextResponse.json(
      { error: "You are not an affiliate." },
      { status: 403 },
    );
  }
  if (affiliate.status !== "active") {
    return NextResponse.json(
      { error: "Affiliate account is suspended." },
      { status: 403 },
    );
  }

  const stripe = getAffiliateStripeClient();

  let connectAccountId = affiliate.stripe_connect_account_id;
  if (!connectAccountId) {
    try {
      const account = await stripe.accounts.create({
        type: "express",
        email: user.email ?? undefined,
        capabilities: {
          transfers: { requested: true },
        },
        business_type: "individual",
        metadata: {
          affiliate_id: affiliate.id,
          kind: "affiliate",
        },
      });
      connectAccountId = account.id;

      const { error: updateErr } = await service
        .from("affiliates")
        .update({ stripe_connect_account_id: connectAccountId })
        .eq("id", affiliate.id);
      if (updateErr) {
        console.error(
          "[connect/onboard] failed to persist connect account id:",
          updateErr,
        );
      }
    } catch (err) {
      console.error("[connect/onboard] account.create failed:", err);
      return NextResponse.json(
        {
          error: "Failed to create Stripe Connect account",
          details: err instanceof Error ? err.message : "Unknown",
        },
        { status: 500 },
      );
    }
  }

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:3000";

  try {
    const link = await stripe.accountLinks.create({
      account: connectAccountId!,
      refresh_url: `${baseUrl}/affiliate?connect=refresh`,
      return_url: `${baseUrl}/api/affiliate/connect/return`,
      type: "account_onboarding",
    });
    return NextResponse.json({ url: link.url });
  } catch (err) {
    console.error("[connect/onboard] accountLinks.create failed:", err);
    return NextResponse.json(
      {
        error: "Failed to create onboarding link",
        details: err instanceof Error ? err.message : "Unknown",
      },
      { status: 500 },
    );
  }
}
