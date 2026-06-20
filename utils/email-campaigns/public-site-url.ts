/**
 * @fileoverview Resolves the public site base URL for outbound customer emails.
 * @module utils/email-campaigns/public-site-url
 */

/** Production origin used when env points at localhost or is unset. */
const DEFAULT_PRODUCTION_SITE_URL = "https://cymasphere.com";

/**
 * @brief Base URL for links in emails sent to real customers.
 * @description Never returns localhost — local scripts and dev env must not embed local URLs in SES messages.
 * @returns Origin without trailing slash (e.g. https://cymasphere.com).
 * @example
 * ```typescript
 * const siteUrl = resolvePublicSiteUrlForEmail();
 * const cta = `${siteUrl}/getting-started`;
 * ```
 */
export function resolvePublicSiteUrlForEmail(): string {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    "";

  if (!raw) {
    return DEFAULT_PRODUCTION_SITE_URL;
  }

  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host.endsWith(".local")
    ) {
      return DEFAULT_PRODUCTION_SITE_URL;
    }
    return `${url.protocol}//${url.host}`;
  } catch {
    return DEFAULT_PRODUCTION_SITE_URL;
  }
}
