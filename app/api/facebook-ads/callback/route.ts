/**
 * @fileoverview Facebook OAuth callback handler API endpoint
 * 
 * This endpoint handles the OAuth callback from Facebook after user authorization.
 * Exchanges the authorization code for an access token, optionally exchanges for
 * a long-lived token, and stores the token securely. Includes CSRF protection
 * via state parameter validation.
 * 
 * @module api/facebook-ads/callback
 */

import { NextRequest, NextResponse } from 'next/server';
import { storeFacebookToken } from '@/utils/facebook/api';

/**
 * @brief GET endpoint to handle Facebook OAuth callback
 * 
 * Processes the OAuth callback from Facebook, validates the state parameter
 * for CSRF protection, exchanges the authorization code for an access token,
 * and stores the token. Redirects back to the ad manager with success or error status.
 * 
 * Query parameters:
 * - code: Authorization code from Facebook (required if successful)
 * - state: CSRF protection state parameter (required)
 * - error: OAuth error code (if authorization was denied)
 * 
 * Responses:
 * 
 * 302 Redirect - Success:
 * - Redirects to: /admin/ad-manager?connected=true
 * 
 * 302 Redirect - OAuth error:
 * - Redirects to: /admin/ad-manager?error=oauth_denied
 * 
 * 302 Redirect - Invalid state:
 * - Redirects to: /admin/ad-manager?error=invalid_state
 * 
 * 302 Redirect - No code:
 * - Redirects to: /admin/ad-manager?error=no_code
 * 
 * 302 Redirect - Token exchange failed:
 * - Redirects to: /admin/ad-manager?error=token_exchange_failed
 * 
 * @param request Next.js request object containing OAuth callback query parameters
 * @returns NextResponse redirect to ad manager with status
 * @note Validates state parameter for CSRF protection
 * @note Exchanges short-lived token for long-lived token (60 days)
 * @note Stores token securely (in production, should be stored in database)
 * 
 * @example
 * ```typescript
 * // GET /api/facebook-ads/callback?code=abc123&state=facebook_ads_connect
 * // Redirects to: /admin/ad-manager?connected=true
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Check for OAuth errors
    if (error) {
      console.error('Facebook OAuth error:', error);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?error=oauth_denied`);
    }

    // Verify state parameter for CSRF protection
    if (state !== 'facebook_ads_connect') {
      console.error('Invalid state parameter');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?error=invalid_state`);
    }

    if (!code) {
      console.error('No authorization code received');
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?error=no_code`);
    }

    // Exchange authorization code for access token
    const accessToken = await exchangeCodeForToken(code);
    
    if (!accessToken) {
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?error=token_exchange_failed`);
    }

    // Store the access token (in production, this would be stored securely in database)
    storeFacebookToken(accessToken);

    // Redirect back to Ad Manager with success
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?connected=true`);
  } catch (error) {
    console.error('Error handling Facebook OAuth callback:', error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?error=callback_failed`);
  }
}

/**
 * @brief Exchanges Facebook OAuth authorization code for access token
 * 
 * Makes a request to Facebook's token endpoint to exchange the authorization
 * code for a short-lived access token. Optionally exchanges for a long-lived
 * token (60 days) for better user experience.
 * 
 * @param code Authorization code from Facebook OAuth callback
 * @returns Access token string or null if exchange failed
 * @note Requires FACEBOOK_APP_ID and FACEBOOK_APP_SECRET
 * @note Attempts to exchange for long-lived token automatically
 * 
 * @example
 * ```typescript
 * const token = await exchangeCodeForToken("authorization_code");
 * // Returns: "access_token_string" or null
 * ```
 */
async function exchangeCodeForToken(code: string): Promise<string | null> {
  try {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/facebook-ads/callback`;

    if (!clientId || !clientSecret) {
      console.error('Facebook App credentials not configured');
      return null;
    }

    // Exchange code for access token
    const tokenUrl = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('redirect_uri', redirectUri);
    tokenUrl.searchParams.set('code', code);

    const response = await fetch(tokenUrl.toString(), {
      method: 'GET',
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Token exchange failed:', errorData);
      return null;
    }

    const tokenData = await response.json();
    
    if (!tokenData.access_token) {
      console.error('No access token in response:', tokenData);
      return null;
    }

    // Optionally, exchange short-lived token for long-lived token
    const longLivedToken = await exchangeForLongLivedToken(tokenData.access_token);
    
    return longLivedToken || tokenData.access_token;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    return null;
  }
}

/**
 * @brief Exchanges short-lived token for long-lived token
 * 
 * Converts a short-lived access token (1-2 hours) to a long-lived token
 * (60 days) for better user experience and reduced re-authentication.
 * 
 * @param shortLivedToken Short-lived access token to exchange
 * @returns Long-lived access token or null if exchange failed
 * @note Falls back to short-lived token if exchange fails
 * @note Long-lived tokens expire after 60 days
 * 
 * @example
 * ```typescript
 * const longToken = await exchangeForLongLivedToken("short_token");
 * // Returns: "long_lived_token" or null
 * ```
 */
async function exchangeForLongLivedToken(shortLivedToken: string): Promise<string | null> {
  try {
    const clientId = process.env.FACEBOOK_APP_ID;
    const clientSecret = process.env.FACEBOOK_APP_SECRET;

    if (!clientId || !clientSecret) {
      return null;
    }

    const tokenUrl = new URL('https://graph.facebook.com/v20.0/oauth/access_token');
    tokenUrl.searchParams.set('grant_type', 'fb_exchange_token');
    tokenUrl.searchParams.set('client_id', clientId);
    tokenUrl.searchParams.set('client_secret', clientSecret);
    tokenUrl.searchParams.set('fb_exchange_token', shortLivedToken);

    const response = await fetch(tokenUrl.toString());
    
    if (!response.ok) {
      console.warn('Failed to exchange for long-lived token, using short-lived token');
      return null;
    }

    const tokenData = await response.json();
    return tokenData.access_token || null;
  } catch (error) {
    console.warn('Error exchanging for long-lived token:', error);
    return null;
  }
} 