/**
 * @fileoverview Applies the Cymasphere per-device logout database migration.
 * @module scripts/apply-revoke-device-migration
 */

import path from "node:path";
import { config } from "dotenv";
import { ensureRevokeCymasphereDeviceFunction, getSupabaseDbPassword } from "../utils/supabase/device-session-db";

config({ path: path.join(process.cwd(), ".env.local") });

async function main(): Promise<void> {
  if (!getSupabaseDbPassword()) {
    console.error(
      "SUPABASE_DB_PASSWORD is missing from .env.local. Add it from Supabase Dashboard > Project Settings > Database.",
    );
    process.exit(1);
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is missing from .env.local.");
    process.exit(1);
  }

  console.log("Applying revoke-device migration...");
  await ensureRevokeCymasphereDeviceFunction();
  console.log("Done. Per-device logout should work after restarting the dev server.");
}

main().catch((error) => {
  console.error("Failed to apply revoke-device migration:", error);
  process.exit(1);
});
