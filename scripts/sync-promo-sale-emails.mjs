/**
 * @fileoverview Syncs promo sale email HTML into draft campaigns and wires
 * All Subscribers include + Lifetime Users exclude audiences.
 * @module scripts/sync-promo-sale-emails
 * @example
 * ```bash
 * node scripts/sync-promo-sale-emails.mjs
 * ```
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

/** Load .env.local KEY=VALUE pairs without sourcing multiline junk. */
function loadEnvLocal() {
  const envPath = resolve(root, ".env.local");
  const text = readFileSync(envPath, "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    if (!line || line.trim().startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    env[key] = val;
  }
  return env;
}

const env = loadEnvLocal();
const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

const ALL_SUBSCRIBERS = "713c5ad9-f284-4fe1-a32f-f172412e9171";
const LIFETIME_USERS = "b85cfec8-df7f-40dc-98f7-803b7bacc6bb";

async function main() {
  // Fix Lifetime Users audience filters (subscription = lifetime)
  const lifetimeFilters = {
    audience_type: "dynamic",
    rules: [
      {
        id: "1",
        field: "status",
        operator: "equals",
        value: "active",
        timeframe: "all_time",
      },
      {
        id: "2",
        field: "subscription",
        operator: "equals",
        value: "lifetime",
        timeframe: "all_time",
      },
    ],
  };

  const { error: audErr } = await supabase
    .from("email_audiences")
    .update({
      filters: lifetimeFilters,
      description:
        "Active subscribers with profiles.subscription = lifetime (exclude from Lifetime promo sales)",
    })
    .eq("id", LIFETIME_USERS);

  if (audErr) throw audErr;
  console.log("✓ Fixed Lifetime Users audience filters");

  // Build emails via tsx/bun
  const { spawnSync } = await import("child_process");
  const builder = `
import { PROMO_SALE_EMAIL_SPECS, buildPromoSaleEmail } from './utils/email-campaigns/promo-sale-email.ts';
const out = PROMO_SALE_EMAIL_SPECS.map((spec) => {
  const { html, text } = buildPromoSaleEmail(spec);
  return {
    campaignId: spec.campaignId,
    promoName: spec.promoName,
    subject: spec.subject,
    preheader: spec.preheader,
    html,
    text,
  };
});
process.stdout.write(JSON.stringify(out));
`;

  let built;
  const bun = spawnSync("bun", ["-e", builder], {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  if (bun.status === 0 && bun.stdout) {
    built = JSON.parse(bun.stdout);
  } else {
    const npx = spawnSync(
      "npx",
      ["tsx", "-e", builder],
      {
        cwd: root,
        encoding: "utf8",
        maxBuffer: 50 * 1024 * 1024,
      },
    );
    if (npx.status !== 0) {
      console.error(bun.stderr || npx.stderr);
      throw new Error("Failed to build promo emails (need bun or tsx)");
    }
    built = JSON.parse(npx.stdout);
  }

  console.log(`✓ Built ${built.length} promo emails`);

  for (const item of built) {
    const { error: upErr } = await supabase
      .from("email_campaigns")
      .update({
        subject: item.subject,
        preheader: item.preheader,
        html_content: item.html,
        text_content: item.text,
        sender_name: "Cymasphere",
        sender_email: "support@cymasphere.com",
        reply_to_email: "support@cymasphere.com",
        description: `Promo sale email for ${item.promoName}. Includes All Subscribers; EXCLUDES Lifetime Users.`,
        status: "draft",
      })
      .eq("id", item.campaignId);

    if (upErr) {
      console.error("Update failed", item.promoName, upErr);
      throw upErr;
    }

    // Reset audience links
    await supabase
      .from("email_campaign_audiences")
      .delete()
      .eq("campaign_id", item.campaignId);

    const { error: linkErr } = await supabase
      .from("email_campaign_audiences")
      .insert([
        {
          campaign_id: item.campaignId,
          audience_id: ALL_SUBSCRIBERS,
          is_excluded: false,
        },
        {
          campaign_id: item.campaignId,
          audience_id: LIFETIME_USERS,
          is_excluded: true,
        },
      ]);

    if (linkErr) {
      console.error("Audience link failed", item.promoName, linkErr);
      throw linkErr;
    }

    console.log(
      `✓ ${item.promoName} → campaign ${item.campaignId.slice(0, 8)}… (exclude lifetime)`,
    );
  }

  // Verify lifetime audience + one campaign audience wiring
  const { data: lifetimeAud } = await supabase
    .from("email_audiences")
    .select("name, filters")
    .eq("id", LIFETIME_USERS)
    .single();

  const { data: links } = await supabase
    .from("email_campaign_audiences")
    .select("campaign_id, audience_id, is_excluded")
    .in(
      "campaign_id",
      built.map((b) => b.campaignId),
    );

  const excluded = (links || []).filter((l) => l.is_excluded);
  console.log(
    `\nLifetime audience rules:`,
    JSON.stringify(lifetimeAud?.filters?.rules?.map((r) => `${r.field}=${r.value}`)),
  );
  console.log(
    `Audience links: ${links?.length || 0} total, ${excluded.length} exclusions (expect ${built.length})`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
