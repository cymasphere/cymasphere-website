/**
 * Utility functions for handling build-time route skipping
 */

// Detect if we're in build process
export const isBuildTime = process.env.NEXT_BUILD_SKIP_VALIDATION === 'true';

// Standard response for auth endpoints during build
export const buildAuthResponse = {
  user: { 
    id: 'mock-profile-id', 
    email: 'build@example.com',
    username: 'mock-user',
    subscription_status: 'active',
    subscription_id: 'mock-sub-id',
    customer_id: 'mock-customer-id',
    full_name: 'Mock User',
  },
  access_token: 'mock-token',
  refresh_token: 'mock-refresh',
  expires_at: 9999999999,
  error: null
};

/**
 * For route handlers - checks if we should skip route validation during build
 * Returns true if the current route should be skipped during build
 */
export function shouldSkipRoute() {
  return isBuildTime;
} 