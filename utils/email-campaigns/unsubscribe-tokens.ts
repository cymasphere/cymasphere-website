/**
 * @fileoverview Unsubscribe token generation and verification utilities
 * 
 * This file provides secure token generation and verification for email
 * unsubscribe links. Uses HMAC-SHA256 for signing tokens to prevent tampering
 * and includes expiration logic for security.
 * 
 * @module utils/email-campaigns/unsubscribe-tokens
 */

import crypto from 'crypto';

/**
 * @brief Gets the secret key for signing unsubscribe tokens
 * 
 * Retrieves the unsubscribe token secret from environment variables.
 * Falls back to Supabase service role key or a default (for development only).
 * 
 * @returns Secret key string for token signing
 * @note In production, should use UNSUBSCRIBE_TOKEN_SECRET environment variable
 * @note Falls back to SUPABASE_SERVICE_ROLE_KEY if available
 * 
 * @example
 * ```typescript
 * const secret = getUnsubscribeSecret();
 * // Returns: process.env.UNSUBSCRIBE_TOKEN_SECRET || ...
 * ```
 */
const getUnsubscribeSecret = (): string => {
  return process.env.UNSUBSCRIBE_TOKEN_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-change-in-production';
};

/**
 * @brief Generates a signed token for unsubscribe links
 * 
 * Creates a cryptographically signed token containing the email address,
 * timestamp, and random nonce. Uses HMAC-SHA256 for signing to prevent
 * tampering. Tokens expire after 30 days by default.
 * 
 * @param email Email address to include in token
 * @returns Base64URL-encoded token string (payload.signature)
 * @note Token format: email|timestamp|nonce.signature
 * @note Uses base64url encoding for URL-safe tokens
 * @note Default expiration is 30 days (configurable in verify function)
 * 
 * @example
 * ```typescript
 * const token = generateUnsubscribeToken("user@example.com");
 * // Returns: "dXNlckBleGFtcGxlLmNvbXwxNzAwMDAwMDAwfGFiY2RlZmc..."
 * ```
 */
export function generateUnsubscribeToken(email: string): string {
  const secret = getUnsubscribeSecret();
  const timestamp = Date.now();
  const nonce = crypto.randomBytes(16).toString('hex');
  
  // Create payload: email|timestamp|nonce
  const payload = `${email.toLowerCase()}|${timestamp}|${nonce}`;
  
  // Create HMAC signature
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  
  // Return base64 encoded token: payload.signature
  const token = Buffer.from(`${payload}.${signature}`).toString('base64url');
  return token;
}

/**
 * @brief Verifies and decodes an unsubscribe token
 * 
 * Verifies the HMAC signature of an unsubscribe token and extracts the email
 * address. Returns null if the token is invalid, expired, or tampered with.
 * 
 * @param token Base64URL-encoded token to verify
 * @param maxAgeDays Maximum age of token in days (default: 30)
 * @returns Email address if token is valid, null otherwise
 * @note Verifies HMAC signature to prevent tampering
 * @note Checks token expiration based on timestamp
 * @note Returns null for invalid, expired, or malformed tokens
 * 
 * @example
 * ```typescript
 * const email = verifyUnsubscribeToken(token, 30);
 * // Returns: "user@example.com" if valid, null if invalid/expired
 * ```
 */
export function verifyUnsubscribeToken(token: string, maxAgeDays: number = 30): string | null {
  try {
    const secret = getUnsubscribeSecret();
    
    // Decode base64url token
    const decoded = Buffer.from(token, 'base64url').toString('utf-8');
    const [payload, signature] = decoded.split('.');
    
    if (!payload || !signature) {
      return null;
    }
    
    // Verify signature
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(payload);
    const expectedSignature = hmac.digest('hex');
    
    // Use timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }
    
    // Parse payload: email|timestamp|nonce
    const [email, timestampStr, nonce] = payload.split('|');
    
    if (!email || !timestampStr) {
      return null;
    }
    
    // Check expiration (30 days default)
    const timestamp = parseInt(timestampStr, 10);
    const maxAge = maxAgeDays * 24 * 60 * 60 * 1000; // Convert days to milliseconds
    const age = Date.now() - timestamp;
    
    if (age > maxAge) {
      return null; // Token expired
    }
    
    if (age < 0) {
      return null; // Token from future (clock skew)
    }
    
    return email.toLowerCase();
  } catch (error) {
    console.error('[Unsubscribe Token] Verification error:', error);
    return null;
  }
}

/**
 * Generate unsubscribe URL with token
 */
export function generateUnsubscribeUrl(email: string, baseUrl?: string): string {
  const token = generateUnsubscribeToken(email);
  const siteUrl = baseUrl || process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com';
  return `${siteUrl}/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

