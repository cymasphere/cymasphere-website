/**
 * @fileoverview Lists JSON leaf paths present in en.json but missing from another locale.
 * @module scripts/list-missing-locale-paths
 * @note Usage: node scripts/list-missing-locale-paths.mjs [locale.json name, default zh.json]
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function paths(v, p = "") {
  if (v === null || typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return [p || "(scalar)"];
  }
  if (Array.isArray(v)) {
    const out = [];
    v.forEach((item, i) => {
      const pp = `${p}[${i}]`;
      if (item !== null && typeof item === "object" && !Array.isArray(item)) {
        out.push(...paths(item, pp));
      } else {
        out.push(pp);
      }
    });
    return out.length ? out : [`${p}[]`];
  }
  if (typeof v === "object") {
    const out = [];
    for (const k of Object.keys(v)) {
      const pp = p ? `${p}.${k}` : k;
      out.push(...paths(v[k], pp));
    }
    return out;
  }
  return [];
}

const targetFile = process.argv[2] || "zh.json";
const en = JSON.parse(fs.readFileSync(path.join(root, "public", "locales", "en.json"), "utf8"));
const loc = JSON.parse(fs.readFileSync(path.join(root, "public", "locales", targetFile), "utf8"));
const enS = new Set(paths(en));
const locS = new Set(paths(loc));
const missing = [...enS].filter((x) => !locS.has(x)).sort();
console.log(missing.join("\n"));
console.error(`\n# count: ${missing.length}`, { file: targetFile });
