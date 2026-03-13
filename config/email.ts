/**
 * @fileoverview Email configuration constants (single source of truth for support address)
 *
 * Used by both server (utils/email, actions, API routes) and client (admin UI defaults).
 * Do not add env-based config here; support address is intentionally hardcoded in one place.
 *
 * @module config/email
 */

/** Support/admin email address (recipient and sender). */
export const SUPPORT_EMAIL = "support@cymasphere.com";
