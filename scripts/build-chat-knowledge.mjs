#!/usr/bin/env node
/**
 * Builds SYSTEM_KNOWLEDGE.md for the site chatbot from Cymasphere + CymaSynth UserManuals only.
 * Run: `npm run chat:build-knowledge`
 *
 * Authority: UserManual TSX sources. No feature catalog, website scripts, or engineering docs.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_DIR = path.join(ROOT, "content", "chat-knowledge");
const OUT_FILE = path.join(OUT_DIR, "SYSTEM_KNOWLEDGE.md");

const CYMASPHERE_ROOT = process.env.CYMASPHERE_REPO || path.resolve(ROOT, "..", "Cymasphere");
const CYMASPHERE_MANUAL = path.join(CYMASPHERE_ROOT, "UserManual", "src", "sections");
const CYMASYNTH_MANUAL = path.join(CYMASPHERE_ROOT, "CymaSynth", "UserManual", "src", "sections");
const CYMASYNTH_GLOSSARY = path.join(
  CYMASPHERE_ROOT,
  "CymaSynth",
  "UserManual",
  "src",
  "data",
  "glossary.ts"
);
const CYMASYNTH_PRESET_GUIDE = path.join(
  CYMASPHERE_ROOT,
  "CymaSynth",
  "UserManual",
  "src",
  "data",
  "presetCategoryGuide.ts"
);

/** Convert manual TSX/JSX prose into plain markdown-ish text. */
function tsxToMarkdown(source, titleHint = "") {
  let text = source;

  text = text.replace(/^[\s\S]*?export const \w+ = memo\(function \w+\(\) \{\s*return\s*\(/m, "");
  text = text.replace(/\);\s*\}\);\s*$/m, "");

  text = text.replace(/<ManualLink[^>]*>([\s\S]*?)<\/ManualLink>/g, "$1");
  text = text.replace(/<RelatedLinks[\s\S]*?\/>/g, "");
  text = text.replace(/<RelatedLinks[\s\S]*?<\/RelatedLinks>/g, "");

  text = text
    .replace(/&amp;/g, "&")
    .replace(/&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\{' '\}/g, " ")
    .replace(/\{\s*' '\s*\}/g, " ");

  text = text.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/gi, "\n# $1\n");
  text = text.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/gi, "\n## $1\n");
  text = text.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/gi, "\n### $1\n");
  text = text.replace(/<h4[^>]*>([\s\S]*?)<\/h4>/gi, "\n#### $1\n");

  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, "- $1\n");
  text = text.replace(/<\/?(ul|ol)[^>]*>/gi, "\n");

  text = text.replace(/<tr[^>]*>/gi, "\n");
  text = text.replace(/<\/tr>/gi, "");
  text = text.replace(/<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi, "$1\t");
  text = text.replace(/<\/?(table|thead|tbody)[^>]*>/gi, "\n");

  text = text.replace(/<p[^>]*>([\s\S]*?)<\/p>/gi, "\n$1\n");
  text = text.replace(/<\/?(strong|b)>/gi, "**");
  text = text.replace(/<\/?(em|i)>/gi, "_");

  text = text.replace(/<[^>]+>/g, " ");

  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (titleHint && !text.startsWith("#")) {
    text = `# ${titleHint}\n\n${text}`;
  }
  return text;
}

function extractManualSections(dir) {
  if (!fs.existsSync(dir)) {
    console.warn(`Skip missing manual dir: ${dir}`);
    return [];
  }
  const chapters = [];
  for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".tsx")).sort()) {
    if (file === "RelatedLinks.tsx") continue;
    const raw = fs.readFileSync(path.join(dir, file), "utf8");
    const title = file.replace(/\.tsx$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2");
    const md = tsxToMarkdown(raw, title);
    if (md.length < 80) continue;
    chapters.push({ file, md });
  }
  return chapters;
}

function extractGlossary() {
  if (!fs.existsSync(CYMASYNTH_GLOSSARY)) {
    console.warn(`Skip missing glossary: ${CYMASYNTH_GLOSSARY}`);
    return "";
  }
  const raw = fs.readFileSync(CYMASYNTH_GLOSSARY, "utf8");
  const entries = [...raw.matchAll(/\{\s*term:\s*'([^']+)'[\s\S]*?definition:\s*'([^']+)'/g)];
  if (!entries.length) return "";
  const lines = ["# CymaSynth Glossary", ""];
  for (const [, term, definition] of entries) {
    lines.push(`## ${term}`, definition, "");
  }
  return lines.join("\n").trim();
}

function extractPresetCategoryGuide() {
  if (!fs.existsSync(CYMASYNTH_PRESET_GUIDE)) {
    console.warn(`Skip missing preset guide: ${CYMASYNTH_PRESET_GUIDE}`);
    return "";
  }
  const raw = fs.readFileSync(CYMASYNTH_PRESET_GUIDE, "utf8");
  const entries = [
    ...raw.matchAll(
      /\{\s*id:\s*'([^']+)'[\s\S]*?description:\s*'([^']+)'[\s\S]*?listeningNotes:\s*'([^']+)'/g
    ),
  ];
  if (!entries.length) return "";
  const lines = [
    "# CymaSynth factory preset categories",
    "",
    "Use when recommending presets. Ask Cyma cannot load presets — tell the user to open CymaSynth and browse by category.",
    "",
  ];
  for (const [, id, description, listeningNotes] of entries) {
    lines.push(`## ${id}`, description, "", `Listen for: ${listeningNotes}`, "");
  }
  return lines.join("\n").trim();
}

/** Site facts manuals do not define (pricing injected at API runtime from lib/pricing.ts). */
const SITE_OPS_APPENDIX = `
# Site operations appendix

Facts for the public website chatbot that are not covered by the in-app User Manuals.
Do not invent additional product features beyond the manuals above.

## Trials
- 7-day free trial without requiring a credit card
- 14-day free trial with a card on file (not charged until the trial ends)
- Both options include full access to Cymasphere features and CymaSynth

## Support contacts
- Email: support@cymasphere.com
- Discord community: https://discord.gg/gXGqqYR47B
- In-app Help / User Manual is the primary product documentation
- Account bug reports: https://cymasphere.com/bug-report
- Account feature requests: https://cymasphere.com/feature-request
- General support tickets: https://cymasphere.com/support
- In the app Profile menu: **Bug Report** and **Feature Request** open the same report form used after a crash
- After a crash, the next launch shows a send-report prompt (same report UI) so you can describe what happened and attach the pending crash data

## Installation (typical desktop paths)
- Windows standalone: C:\\Program Files\\Cymasphere\\
- Windows VST3: C:\\Program Files\\Common Files\\VST3\\
- macOS standalone: /Applications/
- macOS plugins: /Library/Audio/Plug-Ins/
- Sign in with a Cymasphere account on first launch

## Bundle note
- CymaSynth (standalone, VST3 & AU) is included with Cymasphere subscription and lifetime licenses
`.trim();

function clearCorpusDir() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  for (const name of fs.readdirSync(OUT_DIR)) {
    const full = path.join(OUT_DIR, name);
    if (name === "README.md") continue;
    if (fs.statSync(full).isDirectory()) {
      fs.rmSync(full, { recursive: true, force: true });
    } else {
      fs.unlinkSync(full);
    }
  }
}

function main() {
  if (!fs.existsSync(CYMASPHERE_ROOT)) {
    console.error(`Cymasphere repo not found at ${CYMASPHERE_ROOT}`);
    console.error("Set CYMASPHERE_REPO or keep the sibling ../Cymasphere checkout.");
    process.exit(1);
  }

  clearCorpusDir();

  const cymasphere = extractManualSections(CYMASPHERE_MANUAL);
  const cymasynth = extractManualSections(CYMASYNTH_MANUAL);
  const glossary = extractGlossary();
  const presetGuide = extractPresetCategoryGuide();

  const parts = [
    "# Cymasphere & CymaSynth knowledge (User Manuals)",
    "",
    "Authoritative product documentation compiled from the Cymasphere and CymaSynth User Manuals.",
    "For product features, workflows, controls, and examples, use only this document.",
    "",
    "# Part 1 — Cymasphere User Manual",
    "",
    ...cymasphere.flatMap(({ file, md }) => [`<!-- ${file} -->`, md, "", "---", ""]),
    "# Part 2 — CymaSynth User Manual",
    "",
    ...cymasynth.flatMap(({ file, md }) => [`<!-- ${file} -->`, md, "", "---", ""]),
  ];

  if (glossary) {
    parts.push(glossary, "", "---", "");
  }

  if (presetGuide) {
    parts.push(presetGuide, "", "---", "");
  }

  parts.push(SITE_OPS_APPENDIX, "");

  const body = parts.join("\n").replace(/\n{3,}/g, "\n\n");
  fs.writeFileSync(OUT_FILE, body, "utf8");

  fs.writeFileSync(
    path.join(OUT_DIR, "README.md"),
    `# Chat knowledge

Runtime file: \`SYSTEM_KNOWLEDGE.md\` (committed for production).

Built only from:
- \`../Cymasphere/UserManual/src/sections/*.tsx\`
- \`../Cymasphere/CymaSynth/UserManual/src/sections/*.tsx\`
- CymaSynth glossary
- Short site-ops appendix (trials, support, install paths)

\`\`\`bash
npm run chat:build-knowledge
\`\`\`

Optional: \`CYMASPHERE_REPO=/path/to/Cymasphere\`
`,
    "utf8"
  );

  console.log(
    `Wrote ${OUT_FILE} (${(Buffer.byteLength(body) / 1024).toFixed(1)} KB)`
  );
  console.log(
    `Chapters: Cymasphere=${cymasphere.length}, CymaSynth=${cymasynth.length}, glossary=${Boolean(glossary)}, presetGuide=${Boolean(presetGuide)}`
  );
  console.log(`Source repo: ${CYMASPHERE_ROOT}`);
}

main();
