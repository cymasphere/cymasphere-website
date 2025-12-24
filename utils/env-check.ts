/**
 * @fileoverview Environment variable validation and logging utilities.
 * @module utils/env-check
 * @description Provides functions to check for required environment variables and log
 * environment status for debugging deployment issues. Helps identify missing configuration
 * that could cause runtime errors.
 */

/**
 * @brief Checks if all required environment variables are set.
 * @description Validates that all critical environment variables are present in the environment.
 * Logs missing variables to the console and returns a boolean indicating if all are present.
 * @returns {boolean} True if all required environment variables are set, false otherwise.
 * @note Logs missing variables to console.error if any are missing.
 * @note Logs success message if all variables are present.
 * @note Required variables include Supabase, Stripe, and AWS credentials.
 * @example
 * ```typescript
 * if (!checkEnvironmentVariables()) {
 *   console.error("Missing required environment variables!");
 * }
 * ```
 */
export const checkEnvironmentVariables = () => {
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
  ];

  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('Missing required environment variables:', missingVars);
    return false;
  }

  console.log('All required environment variables are set');
  return true;
};

/**
 * @brief Logs the status of all environment variables to the console.
 * @description Logs whether each environment variable is set or missing, with special
 * handling for server-only variables that are expected to be missing on the client.
 * Useful for debugging deployment and configuration issues.
 * @returns {void}
 * @note Detects if running on server or client and handles variables accordingly.
 * @note Server-only variables (SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, AWS_*) show
 * "N/A (server-only)" on the client, which is expected behavior.
 * @note Public variables (NEXT_PUBLIC_*) are checked on both server and client.
 * @example
 * ```typescript
 * logEnvironmentStatus();
 * // Output:
 * // Environment check:
 * // - NODE_ENV: production
 * // - NEXT_PUBLIC_SITE_URL: SET
 * // - NEXT_PUBLIC_SUPABASE_URL: SET
 * // ...
 * ```
 */
export const logEnvironmentStatus = () => {
  const isServer = typeof window === 'undefined';
  console.log('Environment check:');
  console.log('- NODE_ENV:', process.env.NODE_ENV);
  console.log('- NEXT_PUBLIC_SITE_URL:', process.env.NEXT_PUBLIC_SITE_URL ? 'SET' : 'MISSING');
  console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING');
  console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  // Server-only variables - will show MISSING on client (this is expected)
  if (isServer) {
  console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING');
  console.log('- STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'SET' : 'MISSING');
  console.log('- AWS_ACCESS_KEY_ID:', process.env.AWS_ACCESS_KEY_ID ? 'SET' : 'MISSING');
  console.log('- AWS_SECRET_ACCESS_KEY:', process.env.AWS_SECRET_ACCESS_KEY ? 'SET' : 'MISSING');
  console.log('- AWS_REGION:', process.env.AWS_REGION ? 'SET' : 'MISSING');
  } else {
    console.log('- SUPABASE_SERVICE_ROLE_KEY: N/A (server-only)');
    console.log('- STRIPE_SECRET_KEY: N/A (server-only)');
    console.log('- AWS_ACCESS_KEY_ID: N/A (server-only)');
    console.log('- AWS_SECRET_ACCESS_KEY: N/A (server-only)');
    console.log('- AWS_REGION: N/A (server-only)');
  }
  console.log('- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY:', process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ? 'SET' : 'MISSING');
};
