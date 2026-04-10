/**
 * @fileoverview Deep-merges translated overrides from scripts/data/locale-overrides/{lang}.json into public/locales.
 * @module scripts/apply-locale-overrides
 * @note Objects merge recursively; leaf values in the patch replace locale strings.
 * @note Run: node scripts/apply-locale-overrides.mjs
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const overrideDir = path.join(__dirname, "data", "locale-overrides");
const localesDir = path.join(root, "public", "locales");

/**
 * @brief Deep-merge patch into target (objects merge; leaves replaced).
 * @param {object} target
 * @param {object} patch
 */
function deepMerge(target, patch) {
  if (patch === null || patch === undefined) return;
  if (typeof patch !== "object" || Array.isArray(patch)) return;
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv !== null && typeof pv === "object" && !Array.isArray(pv)) {
      target[key] = target[key] || {};
      deepMerge(target[key], pv);
    } else {
      target[key] = pv;
    }
  }
}

const files = fs.readdirSync(overrideDir).filter((f) => f.endsWith(".json"));
if (files.length === 0) {
  console.warn("no overrides in", overrideDir);
  process.exit(0);
}

for (const f of files) {
  const lang = f.replace(/\.json$/, "");
  const localePath = path.join(localesDir, `${lang}.json`);
  if (!fs.existsSync(localePath)) {
    console.warn("skip (no locale):", localePath);
    continue;
  }
  const patch = JSON.parse(fs.readFileSync(path.join(overrideDir, f), "utf8"));
  const data = JSON.parse(fs.readFileSync(localePath, "utf8"));
  deepMerge(data, patch);
  fs.writeFileSync(localePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("applied overrides", lang);
}

console.log("done");
