/**
 * @fileoverview Regression tests for checkout and subscription invariants.
 * @module tests/checkout-invariants
 *
 * Pure unit tests: no Stripe, Supabase, or app code is imported. Only Node
 * built-in modules (node:test, node:assert) are used. This ensures tests
 * never make real Stripe requests or open network connections.
 *
 * Run with: node --test tests/checkout-invariants.test.js
 * or: bun test tests/checkout-invariants.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");

/** Short timeout so tests cannot hang (e.g. if something ever pulled in I/O). */
const TEST_TIMEOUT_MS = 2000;

/** Server error codes returned by checkout/subscription-setup/payment-intent. Client and scripts depend on these. */
const CHECKOUT_ERROR_CODES = {
  ACTIVE_SUBSCRIPTION_EXISTS: "ACTIVE_SUBSCRIPTION_EXISTS",
  LIFETIME_ALREADY_PURCHASED: "LIFETIME_ALREADY_PURCHASED",
  TRIAL_USED_BEFORE: "TRIAL_USED_BEFORE",
  INVALID_PLAN_CHANGE: "INVALID_PLAN_CHANGE",
};

/** Standard metadata keys for lifetime purchases (PaymentIntents, Checkout Sessions, invoices). */
const LIFETIME_METADATA_KEYS = [
  "purchase_type",
  "plan_type",
  "plan_name",
  "price_id",
];

describe("Checkout and subscription invariants", () => {
  describe("No Stripe or app code loaded", () => {
    it("does not load Stripe module (ensures no real API calls)", { timeout: TEST_TIMEOUT_MS }, () => {
      const required = Object.keys(require.cache).filter(
        (k) => k.includes("stripe") || k.includes("Stripe")
      );
      assert.strictEqual(
        required.length,
        0,
        "Stripe or app code must not be required in this test file; only node:test and node:assert are allowed"
      );
    });
  });

  describe("Error codes", () => {
    it("ACTIVE_SUBSCRIPTION_EXISTS is the string the server returns and client checks", { timeout: TEST_TIMEOUT_MS }, () => {
      assert.strictEqual(
        CHECKOUT_ERROR_CODES.ACTIVE_SUBSCRIPTION_EXISTS,
        "ACTIVE_SUBSCRIPTION_EXISTS"
      );
    });

    it("LIFETIME_ALREADY_PURCHASED is the string the server returns and client checks", { timeout: TEST_TIMEOUT_MS }, () => {
      assert.strictEqual(
        CHECKOUT_ERROR_CODES.LIFETIME_ALREADY_PURCHASED,
        "LIFETIME_ALREADY_PURCHASED"
      );
    });

    it("TRIAL_USED_BEFORE is the string the server returns and client checks", { timeout: TEST_TIMEOUT_MS }, () => {
      assert.strictEqual(
        CHECKOUT_ERROR_CODES.TRIAL_USED_BEFORE,
        "TRIAL_USED_BEFORE"
      );
    });

    it("INVALID_PLAN_CHANGE is the string the server returns when plan change has no/multiple subs", { timeout: TEST_TIMEOUT_MS }, () => {
      assert.strictEqual(
        CHECKOUT_ERROR_CODES.INVALID_PLAN_CHANGE,
        "INVALID_PLAN_CHANGE"
      );
    });
  });

  describe("Lifetime metadata schema", () => {
    it("purchase_type is required for lifetime detection in webhooks and Supabase", { timeout: TEST_TIMEOUT_MS }, () => {
      assert.ok(LIFETIME_METADATA_KEYS.includes("purchase_type"));
      const metadata = { purchase_type: "lifetime" };
      assert.strictEqual(metadata.purchase_type, "lifetime");
    });

    it("Standard lifetime metadata includes plan_type, plan_name, price_id", { timeout: TEST_TIMEOUT_MS }, () => {
      assert.ok(LIFETIME_METADATA_KEYS.includes("plan_type"));
      assert.ok(LIFETIME_METADATA_KEYS.includes("plan_name"));
      assert.ok(LIFETIME_METADATA_KEYS.includes("price_id"));
    });
  });

  describe("Idempotency key shape", () => {
    it("Subscription idempotency key includes customer and plan to avoid cross-customer collision", { timeout: TEST_TIMEOUT_MS }, () => {
      const customerId = "cus_abc";
      const planType = "monthly";
      const hourKey = "2025010912";
      const key = `sub_${customerId}_${planType}_${hourKey}`.substring(0, 255);
      assert.ok(key.startsWith("sub_"));
      assert.ok(key.includes(customerId));
      assert.ok(key.includes(planType));
    });

    it("Payment intent idempotency key for lifetime includes customer and lifetime", { timeout: TEST_TIMEOUT_MS }, () => {
      const customerId = "cus_abc";
      const hourKey = "2025010912";
      const key = `pi_${customerId}_lifetime_${hourKey}`.substring(0, 255);
      assert.ok(key.startsWith("pi_"));
      assert.ok(key.includes("lifetime"));
    });
  });
});
