/**
 * @fileoverview HTML escaping utility for safe inclusion of user content in HTML
 *
 * Provides escapeHtml for use in email templates, contact forms, and support
 * ticket notifications so that user-controlled data cannot inject script or
 * other HTML. All user content inserted into HTML should be escaped first.
 *
 * @module utils/escape-html
 */

/**
 * @brief Escapes a string for safe use in HTML
 *
 * Encodes &, <, >, ", ' so that the string can be safely interpolated into
 * HTML without allowing script injection or tag breakout.
 *
 * @param str Raw string (e.g. user input)
 * @returns HTML-encoded string safe for use in HTML text content or attributes
 * @note Use this for any user- or ticket-derived data before inserting into HTML
 *
 * @example
 * ```ts
 * const safe = escapeHtml(userInput);
 * element.innerHTML = safe;
 * ```
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
