/**
 * @fileoverview In-memory rate limiting utility for API routes
 *
 * Provides per-identifier (e.g. IP) rate limiting within a sliding window.
 * Uses a single in-memory store; for multi-instance deployments use Redis.
 *
 * @module utils/rate-limit
 */

/**
 * In-memory store: identifier -> { count, resetTime }
 * @note In production with multiple instances, use Redis for distributed rate limiting
 */
const store = new Map<string, { count: number; resetTime: number }>();

/**
 * @brief Checks rate limit for an identifier (e.g. client IP)
 *
 * @param identifier Client identifier (e.g. IP address)
 * @param maxRequests Maximum requests allowed in the window (default: 10)
 * @param windowSecs Time window in seconds (default: 60)
 * @returns true if request is allowed, false if rate limited
 *
 * @example
 * ```ts
 * const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ?? '127.0.0.1';
 * if (!checkRateLimit(ip, 5, 60)) {
 *   return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
 * }
 * ```
 */
/**
 * @brief Removes expired entries from the store to prevent unbounded memory growth
 */
function cleanupExpired(): void {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (now > value.resetTime) {
      store.delete(key);
    }
  }
}

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowSecs: number = 60
): boolean {
  const now = Date.now();
  const entry = store.get(identifier);

  if (!entry || now > entry.resetTime) {
    if (entry && now > entry.resetTime) {
      store.delete(identifier);
    }
    store.set(identifier, { count: 1, resetTime: now + windowSecs * 1000 });
    if (store.size > 10000) {
      cleanupExpired();
    }
    return true;
  }

  if (entry.count >= maxRequests) {
    return false;
  }

  entry.count++;
  return true;
}

/**
 * @brief Gets client IP from request headers (supports proxied requests)
 *
 * @param request NextRequest
 * @returns Client IP string, or '127.0.0.1' if unavailable
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIp) {
    return realIp.trim();
  }
  return "127.0.0.1";
}
