/**
 * @fileoverview One-time backfill: run `updateUserProStatus` for profiles stuck at
 * `subscription: none` while Stripe still has an active recurring subscription
 * (e.g. grandfathered price IDs after a price change).
 * @module scripts/sync-grandfathered-subscriptions
 *
 * @example
 * npx tsx scripts/sync-grandfathered-subscriptions.ts
 * @note Always passes skipEmail: true — backfills must never send welcome or subscription-change emails.
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const targetEmail = process.argv[2]?.trim().toLowerCase();

/**
 * @brief Finds profiles that likely need a subscription resync from Stripe.
 * @returns Profile rows with id, email, subscription, and customer_id.
 */
async function findCandidateProfiles(): Promise<
  Array<{
    id: string;
    email: string | null;
    subscription: string;
    customer_id: string | null;
  }>
> {
  if (targetEmail) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, subscription, customer_id")
      .ilike("email", targetEmail);

    if (error) {
      throw error;
    }
    return data ?? [];
  }

  const { data: subs, error: subsError } = await supabase
    .schema("stripe_tables")
    .from("stripe_subscriptions")
    .select("customer, attrs");

  if (subsError) {
    throw subsError;
  }

  const activeCustomerIds = new Set<string>();

  for (const row of subs ?? []) {
    const attrs = row.attrs as {
      status?: string;
      items?: {
        data?: Array<{
          price?: { recurring?: { interval?: string } };
          plan?: { interval?: string };
        }>;
      };
    } | null;

    if (
      attrs?.status !== "active" &&
      attrs?.status !== "trialing" &&
      attrs?.status !== "past_due"
    ) {
      continue;
    }

    const hasRecurring = (attrs?.items?.data ?? []).some((item) => {
      const interval =
        item.price?.recurring?.interval ?? item.plan?.interval;
      return interval === "month" || interval === "year";
    });

    if (hasRecurring && typeof row.customer === "string") {
      activeCustomerIds.add(row.customer);
    }
  }

  if (activeCustomerIds.size === 0) {
    return [];
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, subscription, customer_id")
    .eq("subscription", "none")
    .in("customer_id", Array.from(activeCustomerIds));

  if (profilesError) {
    throw profilesError;
  }

  return profiles ?? [];
}

async function main(): Promise<void> {
  const { updateUserProStatus } = await import(
    "@/utils/subscriptions/check-subscription"
  );

  console.log("\nSyncing grandfathered Stripe subscriptions to profiles...\n");

  const candidates = await findCandidateProfiles();

  if (candidates.length === 0) {
    console.log("No profiles need syncing.");
    return;
  }

  console.log(`Found ${candidates.length} profile(s) to sync.\n`);

  let updated = 0;
  let failed = 0;

  for (const profile of candidates) {
    try {
      const before = profile.subscription;
      const result = await updateUserProStatus(profile.id, { skipEmail: true });
      const after = result.subscription;
      if (after !== before) {
        updated += 1;
        console.log(
          `✅ ${profile.email ?? profile.id}: ${before} → ${after} (${result.source})`,
        );
      } else {
        console.log(
          `ℹ️  ${profile.email ?? profile.id}: still ${after} (${result.source})`,
        );
      }
    } catch (error) {
      failed += 1;
      console.error(
        `❌ ${profile.email ?? profile.id}:`,
        error instanceof Error ? error.message : error,
      );
    }
  }

  console.log(
    `\nDone. Updated: ${updated}, unchanged: ${candidates.length - updated - failed}, failed: ${failed}\n`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
