/**
 * @fileoverview Helpers for parsing Cymasphere app device identifiers from user agents.
 * @module utils/supabase/cymasphere-device
 */

/**
 * @brief Extracts the stable device host suffix from a Cymasphere user agent string.
 * @description Cymasphere user agents look like `cymasphere: Windows 11 DESKTOP-ABC`
 * or `cymasphere: Mac OSX 26.4 KVWLQHJWL9`. The OS segment can change after updates,
 * but the host suffix usually identifies the same physical install.
 * @param userAgent Full Cymasphere auth user agent string.
 * @returns Device host suffix used to group and revoke sessions for one install.
 * @example
 * ```typescript
 * extractCymasphereDeviceHost("cymasphere: Mac OSX 26.4 KVWLQHJWL9");
 * // "KVWLQHJWL9"
 * ```
 */
export function extractCymasphereDeviceHost(userAgent: string): string {
  const withoutPrefix = userAgent.replace(/^cymasphere:\s*/i, "").trim();
  const hostMatch = withoutPrefix.match(
    /^(?:Windows \d+|Mac OSX [\d.]+|iOS [\d.]+)\s+(.+)$/i,
  );

  return (hostMatch?.[1] ?? withoutPrefix).trim();
}

/**
 * @brief Builds a display name for a Cymasphere device from its user agent.
 * @param userAgent Full Cymasphere auth user agent string.
 * @returns Human-readable device label without the `cymasphere:` prefix.
 */
export function formatCymasphereDeviceName(userAgent: string): string {
  return userAgent.replace(/^cymasphere:\s*/i, "").trim();
}
