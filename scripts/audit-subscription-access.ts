/**
 * @fileoverview Read-only audit: subscription profile state vs Stripe mirror.
 * @module scripts/audit-subscription-access
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import {
  classifyRecurringPlanFromSubscriptionItem,
  isActiveSubscriptionStatus,
  type StripeSubscriptionItemShape,
} from "../utils/stripe/classify-recurring-plan";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const currentMonthly = process.env.STRIPE_PRICE_ID_MONTHLY?.trim() ?? "";
const currentAnnual = process.env.STRIPE_PRICE_ID_ANNUAL?.trim() ?? "";
const currentLifetime = process.env.STRIPE_PRICE_ID_LIFETIME?.trim() ?? "";

type MirrorSub = {
  id: string;
  customer: string;
  attrs: {
    status?: string;
    items?: { data?: StripeSubscriptionItemShape[] };
  } | null;
};

function classifyCustomerFromMirror(
  subs: MirrorSub[],
): "monthly" | "annual" | null {
  for (const row of subs) {
    if (!isActiveSubscriptionStatus(row.attrs?.status)) continue;
    for (const item of row.attrs?.items?.data ?? []) {
      const plan = classifyRecurringPlanFromSubscriptionItem(item);
      if (plan) return plan;
    }
  }
  return null;
}

async function main(): Promise<void> {
  const { data: subs, error: subsError } = await supabase
    .schema("stripe_tables")
    .from("stripe_subscriptions")
    .select("id, customer, attrs");

  if (subsError) throw subsError;

  const subsByCustomer = new Map<string, MirrorSub[]>();
  for (const row of subs ?? []) {
    const list = subsByCustomer.get(row.customer) ?? [];
    list.push(row as MirrorSub);
    subsByCustomer.set(row.customer, list);
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, subscription, subscription_source, customer_id");

  if (profilesError) throw profilesError;

  const profileByCustomer = new Map(
    (profiles ?? [])
      .filter((p) => p.customer_id)
      .map((p) => [p.customer_id as string, p]),
  );

  const priceStats = new Map<
    string,
    { interval: string; status: string; count: number }
  >();

  let activeMirrorSubs = 0;
  let classifiedMonthly = 0;
  let classifiedAnnual = 0;
  let unclassifiedActive = 0;

  for (const row of subs ?? []) {
    const status = (row.attrs as MirrorSub["attrs"])?.status ?? "unknown";
    if (!isActiveSubscriptionStatus(status)) continue;
    activeMirrorSubs += 1;

    for (const item of (row.attrs as MirrorSub["attrs"])?.items?.data ?? []) {
      const priceId = item.price?.id ?? "unknown";
      const interval =
        item.price?.recurring?.interval ?? item.plan?.interval ?? "unknown";
      const key = `${priceId}|${interval}|${status}`;
      const prev = priceStats.get(key);
      priceStats.set(key, {
        interval,
        status,
        count: (prev?.count ?? 0) + 1,
      });

      const plan = classifyRecurringPlanFromSubscriptionItem(item);
      if (plan === "monthly") classifiedMonthly += 1;
      else if (plan === "annual") classifiedAnnual += 1;
      else unclassifiedActive += 1;
    }
  }

  const falseGrants: Array<{ email: string; subscription: string }> = [];
  const missedSync: Array<{ email: string; expected: string }> = [];
  const lifetimeProfiles = (profiles ?? []).filter(
    (p) => p.subscription === "lifetime",
  ).length;

  for (const [customerId, customerSubs] of subsByCustomer) {
    const expected = classifyCustomerFromMirror(customerSubs);
    if (!expected) continue;
    const profile = profileByCustomer.get(customerId);
    if (!profile) continue;
    if (profile.subscription === "none") {
      missedSync.push({
        email: profile.email ?? profile.id,
        expected,
      });
    }
  }

  for (const profile of profiles ?? []) {
    if (
      (profile.subscription === "monthly" || profile.subscription === "annual") &&
      profile.customer_id
    ) {
      const customerSubs = subsByCustomer.get(profile.customer_id) ?? [];
      const expected = classifyCustomerFromMirror(customerSubs);
      if (!expected) {
        falseGrants.push({
          email: profile.email ?? profile.id,
          subscription: profile.subscription,
        });
      }
    }
  }

  console.log("\n=== Subscription access audit ===\n");
  console.log("Env price IDs:");
  console.log(`  monthly:   ${currentMonthly}`);
  console.log(`  annual:    ${currentAnnual}`);
  console.log(`  lifetime:  ${currentLifetime}`);
  console.log("\nProfile distribution:");
  const dist = new Map<string, number>();
  for (const p of profiles ?? []) {
    dist.set(p.subscription, (dist.get(p.subscription) ?? 0) + 1);
  }
  for (const [sub, n] of [...dist.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${sub}: ${n}`);
  }
  console.log(`\nLifetime profiles: ${lifetimeProfiles}`);
  console.log(`Active mirror subscription rows: ${activeMirrorSubs}`);
  console.log(`Classified active items: monthly=${classifiedMonthly}, annual=${classifiedAnnual}`);
  console.log(`Unclassified active items (would NOT grant access): ${unclassifiedActive}`);

  console.log("\nActive recurring price IDs in Stripe mirror:");
  for (const [key, v] of [...priceStats.entries()].sort(
    (a, b) => b[1].count - a[1].count,
  )) {
    const [priceId] = key.split("|");
    const tag =
      priceId === currentMonthly
        ? " [CURRENT MONTHLY]"
        : priceId === currentAnnual
          ? " [CURRENT ANNUAL]"
          : priceId === currentLifetime
            ? " [LIFETIME - should not be recurring sub]"
            : " [LEGACY/OTHER]";
    console.log(`  ${priceId} interval=${v.interval} status=${v.status} n=${v.count}${tag}`);
  }

  console.log(`\nMissed sync (active Stripe sub, profile still none): ${missedSync.length}`);
  if (missedSync.length > 0) {
    for (const m of missedSync.slice(0, 10)) {
      console.log(`  - ${m.email} should be ${m.expected}`);
    }
  }

  console.log(`\nFalse grants (profile monthly/annual, no active classified Stripe sub): ${falseGrants.length}`);
  if (falseGrants.length > 0) {
    for (const f of falseGrants.slice(0, 15)) {
      console.log(`  - ${f.email} profile=${f.subscription}`);
    }
  }

  console.log("\n=== Verdict ===");
  if (missedSync.length === 0 && falseGrants.length === 0 && unclassifiedActive === 0) {
    console.log("PASS: All active mirror subs classify; no false grants or missed sync.");
  } else {
    console.log("REVIEW: See counts above.");
  }

  const { data: lifetimeProfilesDetail } = await supabase
    .from("profiles")
    .select("subscription_source")
    .eq("subscription", "lifetime");
  const lifetimeSources = new Map<string, number>();
  for (const p of lifetimeProfilesDetail ?? []) {
    const src = p.subscription_source ?? "unknown";
    lifetimeSources.set(src, (lifetimeSources.get(src) ?? 0) + 1);
  }
  console.log("\nLifetime profile sources:", Object.fromEntries(lifetimeSources));
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
