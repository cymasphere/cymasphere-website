/**
 * @fileoverview Thin adapter invariants for POST /api/feedback (auth + multipart mapping).
 * @module tests/api-feedback.adapter
 *
 * Tests parseFeedbackForm + auth gate helpers without a second full ticket dump suite.
 * Run: bun test tests/api-feedback.adapter.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");

const TEST_TIMEOUT_MS = 5000;

async function loadFeedbackLib() {
  return import("../lib/support/feedback-api.ts");
}

describe("feedback API adapter invariants", () => {
  it(
    "parseFeedbackForm maps type subject description and optional files into helper args",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { parseFeedbackForm } = await loadFeedbackLib();
      const form = new FormData();
      form.set("type", "bug");
      form.set("subject", "UI freeze");
      form.set("description", "Freeze when opening mixer");
      form.set(
        "database",
        new File([new Uint8Array([7, 8])], "song.db.lz4", {
          type: "application/octet-stream",
        })
      );
      form.set(
        "crash_report",
        new File(["stack"], "stack.txt", { type: "text/plain" })
      );

      const parsed = await parseFeedbackForm(form);
      assert.strictEqual(parsed.ok, true);
      assert.strictEqual(parsed.value.ticketType, "bug");
      assert.strictEqual(parsed.value.subject, "UI freeze");
      assert.strictEqual(parsed.value.description, "Freeze when opening mixer");
      assert.strictEqual(parsed.value.attachments.length, 2);
      assert.strictEqual(parsed.value.attachments[0].fieldName, "database");
      assert.strictEqual(parsed.value.attachments[0].fileName, "song.db.lz4");
      assert.strictEqual(parsed.value.attachments[1].fieldName, "crash_report");
    }
  );

  it(
    "parseFeedbackForm accepts crash type and defaults empty subject for crash",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { parseFeedbackForm } = await loadFeedbackLib();
      const form = new FormData();
      form.set("type", "crash");
      form.set("description", "Closed while editing progression");
      const parsed = await parseFeedbackForm(form);
      assert.strictEqual(parsed.ok, true);
      assert.strictEqual(parsed.value.ticketType, "crash");
      assert.ok(
        parsed.value.subject.startsWith("Crash Report"),
        "crash without subject gets Crash Report prefix"
      );
    }
  );

  it(
    "parseFeedbackForm rejects invalid type with 400 semantics",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { parseFeedbackForm } = await loadFeedbackLib();
      const form = new FormData();
      form.set("type", "not-a-type");
      form.set("subject", "S");
      form.set("description", "D");
      const parsed = await parseFeedbackForm(form);
      assert.strictEqual(parsed.ok, false);
      assert.strictEqual(parsed.status, 400);
    }
  );

  it(
    "requireFeedbackUser returns 401 when user missing",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { requireFeedbackUser } = await loadFeedbackLib();
      const result = await requireFeedbackUser({
        getUser: async () => ({ data: { user: null }, error: { message: "nope" } }),
      });
      assert.strictEqual(result.ok, false);
      assert.strictEqual(result.status, 401);
    }
  );

  it(
    "requireFeedbackUser returns user when authenticated",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { requireFeedbackUser } = await loadFeedbackLib();
      const result = await requireFeedbackUser({
        getUser: async () => ({
          data: { user: { id: "u1" } },
          error: null,
        }),
      });
      assert.strictEqual(result.ok, true);
      assert.strictEqual(result.user.id, "u1");
    }
  );

  it(
    "selectFeedbackTicketSupabase uses service client for Bearer native app requests",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { selectFeedbackTicketSupabase } = await loadFeedbackLib();
      const cookieClient = { tag: "cookie" };
      const serviceClient = { tag: "service" };
      const bearer = selectFeedbackTicketSupabase("jwt-token", cookieClient, serviceClient);
      assert.strictEqual(bearer.ok, true);
      assert.strictEqual(bearer.supabase, serviceClient);

      const cookie = selectFeedbackTicketSupabase(null, cookieClient, serviceClient);
      assert.strictEqual(cookie.ok, true);
      assert.strictEqual(cookie.supabase, cookieClient);

      const missing = selectFeedbackTicketSupabase("jwt-token", cookieClient, null);
      assert.strictEqual(missing.ok, false);
      assert.strictEqual(missing.status, 500);
    }
  );
});
