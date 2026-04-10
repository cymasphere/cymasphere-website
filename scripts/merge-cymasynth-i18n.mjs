/**
 * @fileoverview Merges CymaSynth-related translation keys from en.json into all other locale files.
 * @module scripts/merge-cymasynth-i18n
 * @note Run after updating public/locales/en.json. Skips zh_broken.json.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const localesDir = path.join(__dirname, "..", "public", "locales");
const enPath = path.join(localesDir, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

const EXTRA_FAQ_ANSWER =
  " Every subscription and lifetime license also includes CymaSynth—our professional wavetable synthesizer (VST3 & AU)—a $149 value when sold separately, included at no extra cost.";

for (const file of fs.readdirSync(localesDir)) {
  if (!file.endsWith(".json") || file === "en.json" || file === "zh_broken.json") {
    continue;
  }
  const p = path.join(localesDir, file);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));

  data.hero = data.hero || {};
  data.hero.includedSynth = en.hero.includedSynth;
  for (const k of [
    "bundleEyebrow",
    "bundleCymasphereTitle",
    "bundleCymasphereDesc",
    "bundleCymaSynthTitle",
    "bundleCymaSynthDesc",
    "bundleFootnote",
    "bundleCymasphereImageAlt",
    "bundleCymaSynthImageAlt",
  ]) {
    if (en.hero[k] !== undefined) {
      data.hero[k] = en.hero[k];
    }
  }

  data.features = data.features || {};
  data.features.subtitle = en.features.subtitle;
  data.features.cymaSynth = en.features.cymaSynth;

  data.pricing = data.pricing || {};
  data.pricing.allFeatures = en.pricing.allFeatures;
  data.pricing.features = en.pricing.features;
  data.pricing.freeTrial = data.pricing.freeTrial || {};
  data.pricing.freeTrial.description = en.pricing.freeTrial.description;

  data.footer = data.footer || {};
  data.footer.description = en.footer.description;

  data.chat = data.chat || {};
  data.chat.greeting = en.chat.greeting;

  const dm = en.dashboard?.main;
  if (dm) {
    data.dashboard = data.dashboard || {};
    data.dashboard.main = data.dashboard.main || {};
    for (const k of [
      "fullAccess",
      "trialMessage",
      "lifetimeMessage",
      "activeSubscriptionMessage",
      "downloadAvailable",
    ]) {
      if (dm[k] !== undefined) {
        data.dashboard.main[k] = dm[k];
      }
    }
  }

  data.faq = data.faq || {};
  data.faq.questions = data.faq.questions || [];
  const qs = data.faq.questions;
  const hasCymaFaq = qs.some(
    (q) =>
      q &&
      typeof q.question === "string" &&
      q.question.includes("CymaSynth") &&
      q.question.includes("included"),
  );
  if (!hasCymaFaq && en.faq.questions[1]) {
    qs.splice(1, 0, JSON.parse(JSON.stringify(en.faq.questions[1])));
  }
  if (qs[0] && typeof qs[0].answer === "string" && !qs[0].answer.includes("CymaSynth")) {
    qs[0].answer += EXTRA_FAQ_ANSWER;
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("updated", file);
}

console.log("done");
