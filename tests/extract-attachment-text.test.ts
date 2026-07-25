/**
 * @fileoverview Tests for support attachment text extraction.
 * @module tests/extract-attachment-text
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { zipSync, strToU8 } from "fflate";
import {
  extractAttachmentText,
  isPreviewableSupportAttachment,
} from "../lib/support/extract-attachment-text";

describe("extractAttachmentText", () => {
  it("returns plain text logs", () => {
    const bytes = new TextEncoder().encode("FATAL: boom\n  at main()");
    const result = extractAttachmentText("log.txt", "text/plain", bytes);
    assert.equal(result.files.length, 1);
    assert.match(result.combined, /FATAL: boom/);
  });

  it("extracts preferred stack files from zip first", () => {
    const zipped = zipSync({
      "readme.md": strToU8("notes"),
      "stacktrace.txt": strToU8("STACK\nat Foo.bar"),
      "other.log": strToU8("other"),
    });
    const result = extractAttachmentText(
      "crash-report.zip",
      "application/zip",
      zipped
    );
    assert.ok(result.files.length >= 2);
    assert.match(result.files[0].name, /stacktrace/i);
    assert.match(result.combined, /STACK/);
  });

  it("marks crash zips as previewable", () => {
    assert.equal(
      isPreviewableSupportAttachment(
        "crash-report.zip",
        "application/zip",
        "document"
      ),
      true
    );
  });
});
