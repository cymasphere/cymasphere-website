/**
 * @fileoverview Merges missing CymaSynth-related keys from en.json into locale files.
 * @module scripts/merge-cymasynth-i18n
 * @note Only fills missing keys — does not overwrite existing translations.
 * @note Skips zh_broken.json. Prefer apply-cyma-i18n-patches.mjs for curated per-locale CymaSynth copy.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");
const en = JSON.parse(
  fs.readFileSync(path.join(localesDir, "en.json"), "utf8"),
);

/**
 * @brief Recursively merge missing keys from source into target.
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
    if (target === null || typeof target !== "object" || Array.isArray(target)) {
      return;
    }
    for (const key of Object.keys(source)) {
      if (!(key in target)) {
        target[key] = JSON.parse(JSON.stringify(source[key]));
        continue;
      }
      mergeMissing(target[key], source[key]);
    }
  }
}

/** @brief CymaSynth-related subtrees to merge from English when keys are absent. */
const CYMA_PATCH_TREE = {
  hero: {
    includedSynth: en.hero?.includedSynth,
    bundleEyebrow: en.hero?.bundleEyebrow,
    bundleCymasphereTitle: en.hero?.bundleCymasphereTitle,
    bundleCymasphereDesc: en.hero?.bundleCymasphereDesc,
    bundleCymaSynthTitle: en.hero?.bundleCymaSynthTitle,
    bundleCymaSynthDesc: en.hero?.bundleCymaSynthDesc,
    bundleFootnote: en.hero?.bundleFootnote,
    bundleCymasphereImageAlt: en.hero?.bundleCymasphereImageAlt,
    bundleCymaSynthImageAlt: en.hero?.bundleCymaSynthImageAlt,
  },
  features: {
    subtitle: en.features?.subtitle,
    cymaSynth: en.features?.cymaSynth,
  },
  pricing: {
    allFeatures: en.pricing?.allFeatures,
    cymaSynthFeature: en.pricing?.cymaSynthFeature,
    features: en.pricing?.features,
    freeTrial: { description: en.pricing?.freeTrial?.description },
  },
  footer: { description: en.footer?.description },
  chat: { greeting: en.chat?.greeting },
  dashboard: {
    main: {
      fullAccess: en.dashboard?.main?.fullAccess,
      trialMessage: en.dashboard?.main?.trialMessage,
      lifetimeMessage: en.dashboard?.main?.lifetimeMessage,
      activeSubscriptionMessage: en.dashboard?.main?.activeSubscriptionMessage,
      downloadAvailable: en.dashboard?.main?.downloadAvailable,
    },
  },
};

for (const file of fs.readdirSync(localesDir)) {
  if (!file.endsWith(".json") || file === "en.json" || file === "zh_broken.json") {
    continue;
  }
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));

  mergeMissing(data, CYMA_PATCH_TREE);

  data.faq = data.faq || {};
  data.faq.questions = data.faq.questions || [];
  const qs = data.faq.questions;
  const hasCymaFaq = qs.some(
    (q) =>
      q &&
      typeof q.question === "string" &&
      /cymaSynth/i.test(q.question) &&
      /included|inclus/i.test(q.question),
  );
  if (!hasCymaFaq && en.faq?.questions?.[1]) {
    qs.splice(1, 0, JSON.parse(JSON.stringify(en.faq.questions[1])));
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("merged missing CymaSynth keys into", file);
}

console.log("done");
