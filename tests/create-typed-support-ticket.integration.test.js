/**
 * @fileoverview Integration invariants for createTypedSupportTicket (shared ticket create path).
 * @module tests/create-typed-support-ticket.integration
 *
 * Run: bun test tests/create-typed-support-ticket.integration.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const { createFakeSupabase } = require("./support/fake-supabase.js");

const TEST_TIMEOUT_MS = 5000;
const USER_ID = "11111111-1111-4111-8111-111111111111";

/**
 * Dynamic import so the suite can be authored before the module exists (TDD).
 */
async function loadHelper() {
  return import("../lib/support/create-typed-support-ticket.ts");
}

describe("createTypedSupportTicket invariants", () => {
  it(
    "persists exact ticket_type bug with subject, description, and initial message",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { createTypedSupportTicket } = await loadHelper();
      const fake = createFakeSupabase();
      fake.nextTicketNumber = "T-2001";

      const result = await createTypedSupportTicket({
        supabase: fake.client,
        serviceSupabase: fake.serviceClient,
        userId: USER_ID,
        subject: "Bank delete crashes",
        description: "Steps: open bank, delete, crash. Expected: no crash.",
        ticketType: "bug",
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(result.ticket.ticket_number, "T-2001");

      const tickets = fake.dumpTable("support_tickets");
      assert.strictEqual(tickets.length, 1);
      assert.strictEqual(tickets[0].ticket_type, "bug");
      assert.strictEqual(tickets[0].subject, "Bank delete crashes");
      assert.strictEqual(
        tickets[0].description,
        "Steps: open bank, delete, crash. Expected: no crash."
      );
      assert.strictEqual(tickets[0].user_id, USER_ID);
      assert.strictEqual(tickets[0].status, "open");

      const messages = fake.dumpTable("support_messages");
      assert.strictEqual(messages.length, 1);
      assert.strictEqual(messages[0].ticket_id, tickets[0].id);
      assert.strictEqual(
        messages[0].content,
        "Steps: open bank, delete, crash. Expected: no crash."
      );
      assert.strictEqual(messages[0].is_admin, false);
    }
  );

  it(
    "persists feature, support, and crash ticket_type exactly",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { createTypedSupportTicket } = await loadHelper();

      for (const ticketType of ["feature", "support", "crash"]) {
        const fake = createFakeSupabase();
        const result = await createTypedSupportTicket({
          supabase: fake.client,
          serviceSupabase: fake.serviceClient,
          userId: USER_ID,
          subject: `Sub ${ticketType}`,
          description: `Desc ${ticketType}`,
          ticketType,
        });
        assert.strictEqual(result.success, true);
        assert.strictEqual(
          fake.dumpTable("support_tickets")[0].ticket_type,
          ticketType
        );
      }
    }
  );

  it(
    "omitted ticketType defaults to support",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { createTypedSupportTicket } = await loadHelper();
      const fake = createFakeSupabase();
      const result = await createTypedSupportTicket({
        supabase: fake.client,
        serviceSupabase: fake.serviceClient,
        userId: USER_ID,
        subject: "Help",
        description: "How do I export?",
      });
      assert.strictEqual(result.success, true);
      assert.strictEqual(
        fake.dumpTable("support_tickets")[0].ticket_type,
        "support"
      );
    }
  );

  it(
    "with attachments creates exact support_attachments rows and storage paths",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { createTypedSupportTicket } = await loadHelper();
      const fake = createFakeSupabase();
      const dbBytes = new Uint8Array([1, 2, 3, 4]);

      const result = await createTypedSupportTicket({
        supabase: fake.client,
        serviceSupabase: fake.serviceClient,
        userId: USER_ID,
        subject: "Crash",
        description: "Died mid-save",
        ticketType: "crash",
        attachments: [
          {
            fieldName: "database",
            fileName: "song.db.zip",
            contentType: "application/zip",
            bytes: dbBytes,
          },
          {
            fieldName: "crash_report",
            fileName: "stack.txt",
            contentType: "text/plain",
            bytes: new TextEncoder().encode("frame0\nframe1\n"),
          },
        ],
      });

      assert.strictEqual(result.success, true);
      const attachments = fake.dumpTable("support_attachments");
      assert.strictEqual(attachments.length, 2);
      assert.strictEqual(attachments[0].file_name, "song.db.zip");
      assert.strictEqual(attachments[1].file_name, "stack.txt");
      assert.ok(
        String(attachments[0].storage_path).startsWith("support-attachments/feedback-"),
        "storage path must use support-attachments/feedback- prefix"
      );
      assert.ok(
        String(attachments[0].storage_path).includes(result.ticket.id),
        "storage path must include ticket id"
      );
      assert.strictEqual(fake.storage.length, 2);
      assert.deepStrictEqual(
        Array.from(fake.storage[0].bytes),
        Array.from(dbBytes)
      );
    }
  );

  it(
    "without attachments leaves zero support_attachments rows",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { createTypedSupportTicket } = await loadHelper();
      const fake = createFakeSupabase();
      await createTypedSupportTicket({
        supabase: fake.client,
        serviceSupabase: fake.serviceClient,
        userId: USER_ID,
        subject: "Idea",
        description: "Please add X",
        ticketType: "feature",
      });
      assert.strictEqual(fake.dumpTable("support_attachments").length, 0);
      assert.strictEqual(fake.storage.length, 0);
    }
  );

  it(
    "ticket-number RPC failure creates no ticket, message, or attachment rows",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const { createTypedSupportTicket } = await loadHelper();
      const fake = createFakeSupabase();
      fake.rpcShouldFail = true;

      const result = await createTypedSupportTicket({
        supabase: fake.client,
        serviceSupabase: fake.serviceClient,
        userId: USER_ID,
        subject: "X",
        description: "Y",
        ticketType: "bug",
        attachments: [
          {
            fieldName: "database",
            fileName: "a.db",
            contentType: "application/octet-stream",
            bytes: new Uint8Array([9]),
          },
        ],
      });

      assert.strictEqual(result.success, false);
      assert.strictEqual(fake.dumpTable("support_tickets").length, 0);
      assert.strictEqual(fake.dumpTable("support_messages").length, 0);
      assert.strictEqual(fake.dumpTable("support_attachments").length, 0);
      assert.strictEqual(fake.storage.length, 0);
    }
  );
});
