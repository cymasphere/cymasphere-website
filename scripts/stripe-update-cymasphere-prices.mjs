/**
 * @fileoverview Creates new Cymasphere Stripe prices and archives the previous active prices.
 * @module scripts/stripe-update-cymasphere-prices
 *
 * Run after pricing changes (updates .env.local STRIPE_PRICE_ID_*):
 *   node scripts/stripe-update-cymasphere-prices.mjs
 *
 * @note Requires STRIPE_SECRET_KEY in .env.local. Also update Vercel/production env vars.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import Stripe from "stripe";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

dotenv.config({ path: path.join(root, ".env.local") });

const PRODUCT_ID = "prod_KnKBt8XjWz8GcS";

/** @brief Charge amounts (cents) and compare-at retail anchors (cents). */
const PLANS = [
  {
    key: "monthly",
    env: "STRIPE_PRICE_ID_MONTHLY",
    unit_amount: 900,
    compare_at: 1200,
    recurring: { interval: "month" },
  },
  {
    key: "annual",
    env: "STRIPE_PRICE_ID_ANNUAL",
    unit_amount: 6900,
    compare_at: 8900,
    recurring: { interval: "year" },
  },
  {
    key: "lifetime",
    env: "STRIPE_PRICE_ID_LIFETIME",
    unit_amount: 19900,
    compare_at: 49900,
    recurring: undefined,
  },
];

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * @brief Creates new prices, archives old env-referenced prices, updates .env.local.
 */
async function main() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY missing from .env.local");
  }

  const created = {};
  for (const plan of PLANS) {
    const params = {
      product: PRODUCT_ID,
      currency: "usd",
      unit_amount: plan.unit_amount,
      metadata: {
        plan_type: plan.key,
        compare_at_amount: String(plan.compare_at),
        cymasphere_pricing_tier: "2026-05",
      },
      nickname: `Cymasphere ${plan.key} ($${plan.unit_amount / 100})`,
    };
    if (plan.recurring) params.recurring = plan.recurring;
    const price = await stripe.prices.create(params);
    created[plan.key] = { id: price.id, env: plan.env };
    console.log(
      `Created ${plan.key}: ${price.id} ($${plan.unit_amount / 100}, compare $${plan.compare_at / 100})`,
    );
  }

  for (const plan of PLANS) {
    const oldId = process.env[plan.env];
    if (!oldId || oldId === created[plan.key].id) continue;
    try {
      await stripe.prices.update(oldId, { active: false });
      console.log(`Archived ${plan.key}: ${oldId}`);
    } catch (error) {
      console.warn(`Could not archive ${oldId}:`, error.message);
    }
  }

  await stripe.products.update(PRODUCT_ID, {
    default_price: created.lifetime.id,
  });

  const envPath = path.join(root, ".env.local");
  let env = fs.readFileSync(envPath, "utf8");
  for (const plan of PLANS) {
    const re = new RegExp(`^${plan.env}=.*`, "m");
    env = env.replace(re, `${plan.env}=${created[plan.key].id}`);
  }
  fs.writeFileSync(envPath, env);
  console.log("\nUpdated .env.local — also set these on Vercel/production:");
  for (const plan of PLANS) {
    console.log(`${plan.env}=${created[plan.key].id}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
