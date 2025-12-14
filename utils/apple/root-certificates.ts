/**
 * ============================================================================
 * APPLE ROOT CERTIFICATES LOADER
 * ============================================================================
 *
 * Loads Apple root certificates for verifying JWS signatures from the
 * App Store Server API.
 *
 * ## How to Obtain Certificates
 *
 * 1. Visit https://www.apple.com/certificateauthority/
 * 2. Download the Apple Root Certificates
 * 3. Store them in a secure location (e.g., `certs/apple/` directory)
 * 4. Set the `APPLE_ROOT_CERTIFICATES_PATH` environment variable to the directory path
 *
 * Alternatively, you can provide the certificates as base64-encoded strings
 * in environment variables.
 *
 * ## Required Certificates
 *
 * For App Store Server API verification, you need:
 * - Apple Root CA - G3
 * - Apple Root CA
 * - Any intermediate certificates used by Apple
 *
 * @see https://www.apple.com/certificateauthority/
 */

import { readFileSync, readdirSync, existsSync } from "fs";
import { join } from "path";

/**
 * Loads Apple root certificates from a directory or environment variables
 *
 * @returns Array of certificate buffers
 */
export function loadAppleRootCertificates(): Buffer[] {
  const certificates: Buffer[] = [];

  // Method 1: Load from directory (preferred)
  const certsPath = process.env.APPLE_ROOT_CERTIFICATES_PATH;
  if (certsPath && existsSync(certsPath)) {
    try {
      const files = readdirSync(certsPath);
      for (const file of files) {
        if (
          file.endsWith(".cer") ||
          file.endsWith(".crt") ||
          file.endsWith(".pem")
        ) {
          const certPath = join(certsPath, file);
          const cert = readFileSync(certPath);
          certificates.push(cert);
          console.log(`[apple-certificates] Loaded certificate: ${file}`);
        }
      }
    } catch (error) {
      console.error(
        "[apple-certificates] Error loading certificates from directory:",
        error
      );
    }
  }

  // Method 2: Load from environment variables (fallback)
  // Format: APPLE_ROOT_CERT_1, APPLE_ROOT_CERT_2, etc.
  let certIndex = 1;
  while (true) {
    const certEnv = process.env[`APPLE_ROOT_CERT_${certIndex}`];
    if (!certEnv) break;

    try {
      // Try to decode as base64
      const cert = Buffer.from(certEnv, "base64");
      certificates.push(cert);
      console.log(
        `[apple-certificates] Loaded certificate from env: APPLE_ROOT_CERT_${certIndex}`
      );
    } catch (error) {
      console.error(
        `[apple-certificates] Error decoding certificate from APPLE_ROOT_CERT_${certIndex}:`,
        error
      );
    }
    certIndex++;
  }

  if (certificates.length === 0) {
    console.warn(
      "[apple-certificates] WARNING: No Apple root certificates found. " +
        "JWS signature verification will be disabled. " +
        "Set APPLE_ROOT_CERTIFICATES_PATH or APPLE_ROOT_CERT_* environment variables."
    );
  }

  return certificates;
}

/**
 * Gets the default path for Apple certificates (if not set via env var)
 */
export function getDefaultCertificatesPath(): string | null {
  // Try common locations
  const possiblePaths = [
    join(process.cwd(), "certs", "apple"),
    join(process.cwd(), "certificates", "apple"),
    "/etc/ssl/certs/apple",
  ];

  for (const path of possiblePaths) {
    if (existsSync(path)) {
      return path;
    }
  }

  return null;
}
