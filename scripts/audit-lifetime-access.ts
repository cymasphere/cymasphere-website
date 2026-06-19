/**
 * @fileoverview Audit legacy lifetime purchases vs profile subscription state.
 * @module scripts/audit-lifetime-access
 */

import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const currentLifetime = process.env.STRIPE_PRICE_ID_LIFETIME?.trim() ?? "";
const legacyLifetimeRaw = process.env.LIFETIME_PRICE_ID_2?.trim() ?? "";
const legacyLifetimeIds = new Set(
  [
    ...legacyLifetimeRaw.split(",").map((s) => s.trim()).filter(Boolean),
    ...(process.env.STRIPE_LEGACY_PRICE_IDS_LIFETIME?.split(",")
      .map((s) => s.trim())
      .filter(Boolean) ?? []),
  ],
);

type PiAttrs = {
  metadata?: { purchase_type?: string };
  status?: string;
  dispute?: unknown;
  refunded?: boolean;
};

function isKnownLifetimePrice(priceId: string | undefined): boolean {
  if (!priceId) return false;
  if (priceId === currentLifetime) return true;
  return legacyLifetimeIds.has(priceId);
}

function isLifetimePaymentIntent(attrs: PiAttrs | null | undefined): boolean {
  if (!attrs) return false;
  return (
    attrs.metadata?.purchase_type === "lifetime" &&
    attrs.status === "succeeded" &&
    !attrs.dispute &&
    !attrs.refunded
  );
}

async function main(): Promise<void> {
  const sb = createClient(supabaseUrl!, supabaseServiceKey!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: pis, error: piError } = await sb
    .schema("stripe_tables")
    .from("stripe_payment_intents")
    .select("id, customer, amount, attrs")
    .limit(10000);

  if (piError) throw piError;

  const lifetimeByCustomer = new Map<
    string,
    { via: "metadata" | "price"; priceId?: string; piId: string }
  >();
  const priceIdCounts = new Map<string, number>();

  for (const row of pis ?? []) {
    const attrs = row.attrs as PiAttrs & {
      metadata?: { purchase_type?: string; price_id?: string };
    };
    const customer = row.customer as string | null;
    if (!customer) continue;

    if (isLifetimePaymentIntent(attrs)) {
      const metaPrice = attrs.metadata?.price_id;
      if (metaPrice) {
        priceIdCounts.set(metaPrice, (priceIdCounts.get(metaPrice) ?? 0) + 1);
      }
      if (!lifetimeByCustomer.has(customer)) {
        lifetimeByCustomer.set(customer, {
          via: "metadata",
          priceId: metaPrice,
          piId: row.id as string,
        });
      }
      continue;
    }

    const metaPrice = attrs?.metadata?.price_id;
    if (metaPrice && isKnownLifetimePrice(metaPrice) && attrs?.status === "succeeded") {
      priceIdCounts.set(metaPrice, (priceIdCounts.get(metaPrice) ?? 0) + 1);
      if (!lifetimeByCustomer.has(customer)) {
        lifetimeByCustomer.set(customer, {
          via: "price",
          priceId: metaPrice,
          piId: row.id as string,
        });
      }
    }
  }

  const { data: profiles, error: profileError } = await sb
    .from("profiles")
    .select("id, email, subscription, subscription_source, customer_id");

  if (profileError) throw profileError;

  const profileByCustomer = new Map(
    (profiles ?? [])
      .filter((p) => p.customer_id)
      .map((p) => [p.customer_id as string, p]),
  );

  const missedLifetime: Array<{ email: string; priceId?: string; via: string }> =
    [];
  const downgraded: Array<{ email: string; subscription: string }> = [];

  for (const [customerId, evidence] of lifetimeByCustomer) {
    const profile = profileByCustomer.get(customerId);
    if (!profile) continue;
    if (profile.subscription !== "lifetime") {
      missedLifetime.push({
        email: profile.email ?? profile.id,
        priceId: evidence.priceId,
        via: evidence.via,
      });
    }
  }

  for (const profile of profiles ?? []) {
    if (
      profile.subscription === "lifetime" &&
      profile.subscription_source === "stripe" &&
      profile.customer_id &&
      !lifetimeByCustomer.has(profile.customer_id)
    ) {
      downgraded.push({
        email: profile.email ?? profile.id,
        subscription: profile.subscription,
      });
    }
  }

  console.log("\n=== Lifetime access audit ===\n");
  console.log(`Current STRIPE_PRICE_ID_LIFETIME: ${currentLifetime}`);
  console.log(
    `LIFETIME_PRICE_ID_2 / legacy list: ${
      legacyLifetimeIds.size > 0
        ? [...legacyLifetimeIds].join(", ")
        : "(not set)"
    }`,
  );
  console.log(`\nLifetime payment intents by metadata price_id:`);
  for (const [id, n] of [...priceIdCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  )) {
    const tag =
      id === currentLifetime
        ? " [CURRENT]"
        : legacyLifetimeIds.has(id)
          ? " [LEGACY ENV]"
          : " [LEGACY - NOT IN ENV]";
    console.log(`  ${id}: ${n}${tag}`);
  }

  console.log(`\nCustomers with lifetime evidence in mirror: ${lifetimeByCustomer.size}`);
  console.log(
    `Lifetime profiles (stripe source): ${
      (profiles ?? []).filter(
        (p) =>
          p.subscription === "lifetime" && p.subscription_source === "stripe",
      ).length
    }`,
  );
  console.log(`\nMissed lifetime (evidence but profile not lifetime): ${missedLifetime.length}`);
  for (const m of missedLifetime.slice(0, 20)) {
    console.log(`  - ${m.email} via=${m.via} price=${m.priceId ?? "n/a"}`);
  }

  console.log(
    `\nStripe lifetime profiles without PI metadata evidence: ${downgraded.length}`,
  );
  for (const d of downgraded.slice(0, 10)) {
    console.log(`  - ${d.email} (may be invoice-only or NFR-adjacent)`);
  }

  console.log("\n=== Verdict ===");
  if (missedLifetime.length === 0) {
    console.log("PASS: All metadata-tagged lifetime purchasers have lifetime profiles.");
  } else {
    console.log("ACTION NEEDED: Some lifetime purchasers lack lifetime profiles.");
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
