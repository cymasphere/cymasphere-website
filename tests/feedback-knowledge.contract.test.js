/**
 * @fileoverview Knowledge contract: bug/feature/crash paths must appear in chatbot prompts.
 * @module tests/feedback-knowledge.contract
 *
 * Run: bun test tests/feedback-knowledge.contract.test.js
 */

const { describe, it } = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const TEST_TIMEOUT_MS = 10000;
const ROOT = path.join(__dirname, "..");

describe("feedback knowledge contract", () => {
  it(
    "SYSTEM_KNOWLEDGE or site-ops source includes bug-report and feature-request URLs and in-app paths",
    { timeout: TEST_TIMEOUT_MS },
    () => {
      const systemKnowledge = fs.readFileSync(
        path.join(ROOT, "content/chat-knowledge/SYSTEM_KNOWLEDGE.md"),
        "utf8"
      );
      const buildScript = fs.readFileSync(
        path.join(ROOT, "scripts/build-chat-knowledge.mjs"),
        "utf8"
      );
      const corpus = `${systemKnowledge}\n${buildScript}`;

      assert.ok(
        corpus.includes("https://cymasphere.com/bug-report"),
        "must document https://cymasphere.com/bug-report"
      );
      assert.ok(
        corpus.includes("https://cymasphere.com/feature-request"),
        "must document https://cymasphere.com/feature-request"
      );
      assert.ok(
        corpus.includes("Bug Report"),
        "must mention Profile menu Bug Report"
      );
      assert.ok(
        corpus.includes("Feature Request"),
        "must mention Profile menu Feature Request"
      );
      assert.ok(
        /closed unexpectedly|send.?report|crash/i.test(corpus),
        "must mention crash relaunch send-report behavior"
      );
    }
  );

  it(
    "buildAppAssistantSystemPrompt includes bug-report URL or Profile Bug Report guidance",
    { timeout: TEST_TIMEOUT_MS },
    async () => {
      const mod = await import("../lib/app-assistant-knowledge.ts");
      // Prompt embeds Product Knowledge; also check SHARED_GROUNDING / file source
      const src = fs.readFileSync(
        path.join(ROOT, "lib/app-assistant-knowledge.ts"),
        "utf8"
      );
      const prompt = mod.buildAppAssistantSystemPrompt(
        { appVersion: "1.0.0", platform: "windows" },
        "chat"
      );
      const combined = `${src}\n${prompt}`;
      assert.ok(
        combined.includes("Bug Report") ||
          combined.includes("/bug-report") ||
          combined.includes("cymasphere.com/bug-report"),
        "app assistant must mention Bug Report path or URL"
      );
      assert.ok(
        combined.includes("Feature Request") ||
          combined.includes("/feature-request") ||
          combined.includes("cymasphere.com/feature-request"),
        "app assistant must mention Feature Request path or URL"
      );
    }
  );
});
