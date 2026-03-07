/**
 * @fileoverview Request validation helpers for API routes
 *
 * Provides origin/referer checks to reduce CSRF-style abuse from other origins.
 *
 * @module utils/request-validation
 */

/**
 * @brief Allowlist of origins considered valid for form submissions
 */
function getAllowedOrigins(): string[] {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const origins: string[] = [];
  if (siteUrl) {
    origins.push(siteUrl.replace(/\/$/, ""));
  }
  if (process.env.NODE_ENV === "development") {
    origins.push("http://localhost:3000", "http://127.0.0.1:3000");
  }
  return origins;
}

/**
 * @brief Returns true if the request Origin or Referer matches an allowed origin
 *
 * If neither header is present, returns true (no check to apply).
 * If either header is present, it must match one of the allowed origins.
 *
 * @param request Request object with headers
 * @returns true if origin is allowed or headers are absent
 */
export function isAllowedOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const allowed = getAllowedOrigins();
  if (allowed.length === 0) {
    return true;
  }

  if (origin) {
    const originNormalized = origin.replace(/\/$/, "");
    if (allowed.some((a) => a === originNormalized)) return true;
    return false;
  }

  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = refererUrl.origin;
      if (allowed.some((a) => new URL(a).origin === refererOrigin)) return true;
      return false;
    } catch {
      return false;
    }
  }

  return true;
}
