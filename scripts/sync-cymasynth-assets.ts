/**
 * @fileoverview Download NNAudio catalog marketing images (CymaSynth packshots + Cymasphere square hero),
 * optimize to WebP (thumb + medium + large), upload to Cymasphere `feature-images/optimized/`.
 * @module scripts/sync-cymasynth-assets
 *
 * @note Requires `.env.local` with NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (Cymasphere project).
 * @note NNAudio sources are public URLs; no NNAudio key required.
 *
 * @example
 * npx tsx scripts/sync-cymasynth-assets.ts
 */

import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { config } from "dotenv";
import sharp from "sharp";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET_NAME = "feature-images";

const NN_AUDIO_PUBLIC =
  "https://znecvzfogwkzinkduyuq.supabase.co/storage/v1/object/public/product-images";

/** CymaSynth marketing PNGs under `product-images/cymasynth/`. */
const NN_AUDIO_BASE = `${NN_AUDIO_PUBLIC}/cymasynth`;

/**
 * Cymasphere square catalog WebP (same path as NNAudio `products.featured_image_url` for `cymasphere`).
 */
const NN_AUDIO_CYMASPHERE_SQUARE_WEBP = `${NN_AUDIO_PUBLIC}/product-images/cymasphere.webp`;

const SOURCE_FILES = [
  "cymasynth-product.png",
  "cymasynth-background.png",
  "cymasynth-feature-1.png",
  "cymasynth-feature-2.png",
  "cymasynth-feature-3.png",
];

const IMAGE_SIZES = {
  thumbnail: { width: 600, quality: 80, suffix: "-thumb" },
  medium: { width: 1200, quality: 85, suffix: "" },
  large: { width: 1920, quality: 90, suffix: "-large" },
};

async function ensureBucket(): Promise<void> {
  const { data: buckets, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error("listBuckets:", error.message);
    process.exit(1);
  }
  const exists = buckets?.some((b) => b.name === BUCKET_NAME);
  if (!exists) {
    const { error: createError } = await supabase.storage.createBucket(
      BUCKET_NAME,
      {
        public: true,
        allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
        fileSizeLimit: 10485760,
      },
    );
    if (createError) {
      console.error("createBucket:", createError.message);
      process.exit(1);
    }
    console.log(`Created bucket ${BUCKET_NAME}`);
  }
}

async function downloadToFile(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`GET ${url} -> ${res.status} ${res.statusText}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buf);
}

function baseNameFromFile(file: string): string {
  return path.basename(file, path.extname(file)).toLowerCase();
}

async function optimizeAndUploadFromPath(
  localPath: string,
  baseName: string,
): Promise<{ thumbnail?: string; medium?: string; large?: string }> {
  const out: { thumbnail?: string; medium?: string; large?: string } = {};
  const metadata = await sharp(localPath).metadata();
  console.log(
    `   Source: ${metadata.width}x${metadata.height} (${(fs.statSync(localPath).size / 1024).toFixed(1)} KB)`,
  );

  for (const [sizeName, cfg] of Object.entries(IMAGE_SIZES)) {
    const optimizedBuffer = await sharp(localPath)
      .resize(cfg.width, null, {
        withoutEnlargement: true,
        fit: "inside",
      })
      .webp({ quality: cfg.quality })
      .toBuffer();

    const storageFileName = `${baseName}${cfg.suffix}.webp`;
    const storagePath = `optimized/${storageFileName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, optimizedBuffer, {
        contentType: "image/webp",
        upsert: true,
        cacheControl: "31536000",
      });

    if (uploadError) {
      console.error(`   ❌ ${sizeName}: ${uploadError.message}`);
      continue;
    }

    const { data: pub } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(storagePath);

    const url = pub.publicUrl;
    if (sizeName === "thumbnail") out.thumbnail = url;
    if (sizeName === "medium") out.medium = url;
    if (sizeName === "large") out.large = url;

    const kb = (optimizedBuffer.length / 1024).toFixed(1);
    console.log(`   ✓ ${sizeName}: ${storagePath} (${kb} KB)`);
  }

  return out;
}

async function main(): Promise<void> {
  console.log(
    "NNAudio → Cymasphere: CymaSynth assets + Cymasphere square (feature-images/optimized/)\n",
  );
  await ensureBucket();

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "cymasynth-"));
  const results: Record<
    string,
    { thumbnail?: string; medium?: string; large?: string }
  > = {};

  try {
    for (const file of SOURCE_FILES) {
      const url = `${NN_AUDIO_BASE}/${file}`;
      const localPath = path.join(tmp, file);
      console.log(`\n⬇️  ${file}`);
      await downloadToFile(url, localPath);
      const base = baseNameFromFile(file);
      results[base] = await optimizeAndUploadFromPath(localPath, base);
    }

    const cymLocal = path.join(tmp, "cymasphere-nnaudio.webp");
    console.log(
      `\n⬇️  Cymasphere square (NNAudio catalog)\n   ${NN_AUDIO_CYMASPHERE_SQUARE_WEBP}`,
    );
    await downloadToFile(NN_AUDIO_CYMASPHERE_SQUARE_WEBP, cymLocal);
    results["cymasphere-square"] = await optimizeAndUploadFromPath(
      cymLocal,
      "cymasphere-square",
    );
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }

  console.log("\n" + "=".repeat(72));
  console.log("Done. Public URLs (Cymasphere):\n");
  console.log("— HeroSection: Cymasphere square (1:1), hosted on this project");
  const sq = results["cymasphere-square"];
  if (sq?.medium) {
    console.log(`  cymasphere-square.webp: "${sq.medium}"`);
  }
  console.log("\n— FeaturesSection CymaSynth card (match other feature cards):");
  const prod = results["cymasynth-product"];
  if (prod?.medium && prod?.thumbnail) {
    console.log(`  webp:  "${prod.medium}",`);
    console.log(`  png:   "${prod.thumbnail}",`);
  }
  console.log("\n— Other optimized keys:");
  for (const key of Object.keys(results).sort()) {
    if (key === "cymasynth-product" || key === "cymasphere-square") continue;
    const r = results[key];
    console.log(`  ${key}: medium=${r?.medium ?? "—"}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
