/**
 * @fileoverview Single source of truth for the display name written at registration time.
 *
 * Matches how `/api/auth/register` builds `user_metadata.name` so subscriber records and
 * automation signup events use the same value as the profile-facing auth metadata.
 *
 * @module utils/registration-display-name
 */

/**
 * @brief Computes the canonical registration display name from name parts and email.
 *
 * @param params.email User email (used for local-part fallback).
 * @param params.firstName Parsed first name (may be empty).
 * @param params.lastName Parsed last name (may be empty).
 * @returns Trimmed "first last", or the email local-part if that string is empty.
 *
 * @note Same precedence as web registration: combined first+last, else `@` prefix.
 */
export function getRegistrationDisplayName(params: {
  email: string;
  firstName: string;
  lastName: string;
}): string {
  const combined = `${params.firstName} ${params.lastName}`.trim();
  if (combined.length > 0) {
    return combined;
  }
  return params.email.split("@")[0];
}
