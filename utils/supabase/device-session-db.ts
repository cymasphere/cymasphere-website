/**
 * @fileoverview Direct Postgres helpers for Cymasphere device session management.
 * @module utils/supabase/device-session-db
 * @description Used when the `revoke_cymasphere_device_sessions` RPC is missing or
 * when applying the migration that creates it. Requires `SUPABASE_DB_PASSWORD`.
 */

import { execFile } from "node:child_process";
import { readFileSync } from "node:fs";
import { promisify } from "node:util";
import path from "node:path";

const execFileAsync = promisify(execFile);

const REVOKE_DEVICE_MIGRATION_FILE =
  "20260618120000_revoke_cymasphere_device_sessions.sql";

/**
 * @brief Extracts the Supabase project ref from the public project URL.
 * @param supabaseUrl Public Supabase project URL.
 * @returns Project ref used for pooler connections.
 */
export function getSupabaseProjectRef(supabaseUrl: string): string {
  const hostname = new URL(supabaseUrl).hostname;
  return hostname.split(".")[0] ?? "";
}

/**
 * @brief Reads the configured Supabase database password from the environment.
 * @returns Database password when configured.
 */
export function getSupabaseDbPassword(): string | null {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  return password ? password : null;
}

/**
 * @brief Executes SQL against the linked Supabase Postgres database.
 * @param sql SQL statement or script to execute.
 * @throws When `SUPABASE_DB_PASSWORD` is missing or psql fails.
 */
export async function runSupabaseSql(sql: string): Promise<void> {
  const password = getSupabaseDbPassword();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!password) {
    throw new Error("SUPABASE_DB_PASSWORD is not configured");
  }

  if (!supabaseUrl) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is not configured");
  }

  const projectRef = getSupabaseProjectRef(supabaseUrl);

  await execFileAsync(
    "psql",
    [
      "-h",
      "aws-0-us-east-1.pooler.supabase.com",
      "-p",
      "6543",
      "-U",
      `postgres.${projectRef}`,
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      sql,
    ],
    {
      env: {
        ...process.env,
        PGPASSWORD: password,
      },
    },
  );
}

/**
 * @brief Applies the revoke-device migration when the RPC has not been deployed yet.
 * @returns Whether the migration SQL was executed.
 */
export async function ensureRevokeCymasphereDeviceFunction(): Promise<boolean> {
  if (!getSupabaseDbPassword()) {
    return false;
  }

  const migrationPath = path.join(
    process.cwd(),
    "supabase",
    "migrations",
    REVOKE_DEVICE_MIGRATION_FILE,
  );

  const migrationSql = readFileSync(migrationPath, "utf8");
  await runSupabaseSql(migrationSql);
  return true;
}

/**
 * @brief Deletes Cymasphere app auth sessions for one device directly in Postgres.
 * @param userId Authenticated user ID owning the sessions.
 * @param userAgent Cymasphere app user agent string.
 * @returns Number of deleted auth session rows.
 */
export async function revokeCymasphereDeviceSessionsDirect(
  userId: string,
  userAgent: string,
): Promise<number> {
  const result = await execFileAsync(
    "psql",
    [
      "-h",
      "aws-0-us-east-1.pooler.supabase.com",
      "-p",
      "6543",
      "-U",
      `postgres.${getSupabaseProjectRef(process.env.NEXT_PUBLIC_SUPABASE_URL!)}`,
      "-d",
      "postgres",
      "-v",
      "ON_ERROR_STOP=1",
      "-t",
      "-A",
      "-c",
      `WITH target AS (
         SELECT public.cymasphere_device_host('${userAgent.replace(/'/g, "''")}') AS host
       ),
       revoked AS (
         UPDATE auth.refresh_tokens rt
         SET revoked = true, updated_at = now()
         FROM auth.sessions s, target
         WHERE rt.session_id = s.id
           AND s.user_id = '${userId}'::uuid
           AND s.user_agent ILIKE 'cymasphere:%'
           AND public.cymasphere_device_host(s.user_agent) = target.host
         RETURNING 1
       ),
       deleted AS (
         DELETE FROM auth.sessions s
         USING target
         WHERE s.user_id = '${userId}'::uuid
           AND s.user_agent ILIKE 'cymasphere:%'
           AND public.cymasphere_device_host(s.user_agent) = target.host
         RETURNING 1
       )
       SELECT COUNT(*) FROM deleted;`,
    ],
    {
      env: {
        ...process.env,
        PGPASSWORD: getSupabaseDbPassword() ?? "",
      },
    },
  );

  const deletedCount = Number.parseInt(result.stdout.trim(), 10);
  return Number.isFinite(deletedCount) ? deletedCount : 0;
}
