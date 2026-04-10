/**
 * @fileoverview Deep-merges missing keys from public/locales/en.json into every other locale JSON.
 * @module scripts/sync-missing-locale-keys-from-en
 * @note Preserves existing translations; adds missing objects/strings and extends shorter arrays from en.
 * @note Run: node scripts/sync-missing-locale-keys-from-en.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const localesDir = path.join(root, "public", "locales");

/**
 * @brief Recursively merge `source` into `target` — only fills missing keys / array slots.
 * @param {unknown} target
 * @param {unknown} source
 */
function mergeMissing(target, source) {
  if (source === undefined || source === null) return;
  if (Array.isArray(source)) {
    if (!Array.isArray(target)) return;
    for (let i = 0; i < source.length; i++) {
      if (i >= target.length) {
        target[i] = JSON.parse(JSON.stringify(source[i]));
        continue;
      }
      const te = target[i];
      const se = source[i];
      if (se !== null && typeof se === "object" && !Array.isArray(se)) {
        if (te === null || typeof te !== "object" || Array.isArray(te)) {
          target[i] = JSON.parse(JSON.stringify(se));
        } else {
          mergeMissing(te, se);
        }
      }
    }
    return;
  }
  if (typeof source === "object") {
    if (target === null || typeof target !== "object" || Array.isArray(target)) return;
    for (const key of Object.keys(source)) {
      if (!(key in target)) {
        target[key] = JSON.parse(JSON.stringify(source[key]));
        continue;
      }
      mergeMissing(target[key], source[key]);
    }
  }
}

const enPath = path.join(localesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

for (const file of fs.readdirSync(localesDir)) {
  if (!file.endsWith(".json") || file === "en.json") continue;
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  mergeMissing(data, en);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("synced", file);
}

console.log("done");
