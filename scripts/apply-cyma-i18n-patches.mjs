/**
 * @fileoverview Merges CymaSynth/bundle translations from scripts/data/cyma-i18n/*.json into public/locales.
 * @module scripts/apply-cyma-i18n-patches
 * @note Run: node scripts/apply-cyma-i18n-patches.mjs
 * @note Locales: de, es, fr, it, ja, pt, tr, zh, zh_broken (merge-cymasynth-i18n.mjs skips zh_broken; run this script to sync CymaSynth strings there).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const localesDir = path.join(root, "public", "locales");
const patchDir = path.join(__dirname, "data", "cyma-i18n");

const LANGS = ["de", "es", "fr", "it", "ja", "pt", "tr", "zh", "zh_broken"];

/**
 * @brief Deep-merge patch into target (objects merge; arrays replaced when patch provides array).
 * @param {object} target
 * @param {object} patch
 */
function deepMerge(target, patch) {
  if (patch === null || patch === undefined) return;
  if (Array.isArray(patch)) {
    return;
  }
  if (typeof patch !== "object") {
    return;
  }
  for (const key of Object.keys(patch)) {
    const pv = patch[key];
    if (pv === undefined) continue;
    if (Array.isArray(pv)) {
      target[key] = pv;
      continue;
    }
    if (pv !== null && typeof pv === "object" && !Array.isArray(pv)) {
      target[key] = target[key] || {};
      deepMerge(target[key], pv);
    } else {
      target[key] = pv;
    }
  }
}

/**
 * @brief Apply FAQ question patches by index (patch.faq.questions is { "0": {...}, "1": {...} }).
 */
function applyFaqPatches(data, faqPatch) {
  if (!faqPatch || !faqPatch.questions || !data.faq?.questions) return;
  const idxMap = faqPatch.questions;
  for (const idxStr of Object.keys(idxMap)) {
    const i = parseInt(idxStr, 10);
    if (!Number.isFinite(i) || !data.faq.questions[i]) continue;
    const partial = idxMap[idxStr];
    Object.assign(data.faq.questions[i], partial);
  }
}

for (const lang of LANGS) {
  const patchPath = path.join(patchDir, `${lang}.json`);
  if (!fs.existsSync(patchPath)) {
    console.warn("skip (missing patch):", patchPath);
    continue;
  }
  const patchRaw = JSON.parse(fs.readFileSync(patchPath, "utf8"));
  const localePath = path.join(localesDir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(localePath, "utf8"));

  const faqQuestionsPatch = patchRaw.faq?.questions;
  const patchNoFaq = { ...patchRaw };
  delete patchNoFaq.faq;
  deepMerge(data, patchNoFaq);
  if (faqQuestionsPatch) {
    applyFaqPatches(data, { questions: faqQuestionsPatch });
  }

  fs.writeFileSync(localePath, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("patched", `${lang}.json`);
}

console.log("done");
