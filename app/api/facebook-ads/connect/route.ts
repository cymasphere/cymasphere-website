/**
 * @fileoverview Facebook Ads OAuth connection initiation API endpoint
 * 
 * This endpoint initiates the Facebook OAuth flow to connect a Facebook Ads account.
 * Redirects users to Facebook's OAuth dialog with required permissions for the
 * Facebook Marketing API. Supports development mode with mock connections.
 * 
 * @module api/facebook-ads/connect
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * @brief GET endpoint to initiate Facebook OAuth connection
 * 
 * Redirects users to Facebook's OAuth dialog to authorize access to Facebook Ads.
 * Requests required permissions for managing ads, reading ad data, and business management.
 * Supports development mode with mock connection simulation.
 * 
 * Query parameters: None
 * 
 * Responses:
 * 
 * 302 Redirect - OAuth flow:
 * - Redirects to Facebook OAuth dialog
 * - Callback URL: /api/facebook-ads/callback
 * 
 * 302 Redirect - Development mode (mock):
 * - Redirects to: /admin/ad-manager?connected=true&mock=true
 * 
 * 500 Internal Server Error - Missing configuration:
 * ```json
 * {
 *   "success": false,
 *   "error": "Facebook App ID not configured"
 * }
 * ```
 * 
 * 500 Internal Server Error - OAuth initiation failed:
 * ```json
 * {
 *   "success": false,
 *   "error": "Failed to initiate Facebook connection"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @returns NextResponse redirect to Facebook OAuth or error
 * @note Requires FACEBOOK_APP_ID environment variable
 * @note Requests permissions: ads_management, ads_read, business_management, pages_read_engagement, pages_manage_ads, email
 * @note Development mode: Set FACEBOOK_MOCK_CONNECTION=true to skip OAuth
 * 
 * @example
 * ```typescript
 * // GET /api/facebook-ads/connect
 * // Redirects to: https://www.facebook.com/v20.0/dialog/oauth?...
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Development mode: mock connection if Facebook app is not ready
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      // Simulate successful connection and redirect back to ad manager
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/admin/ad-manager?connected=true&mock=true`);
    }

    // Facebook OAuth configuration
    const clientId = process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/facebook-ads/callback`;
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Facebook App ID not configured'
      }, { status: 500 });
    }

    // Required permissions for Facebook Marketing API
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_manage_ads',
      'email'
    ].join(',');

    // Build Facebook OAuth URL
    const facebookAuthUrl = new URL('https://www.facebook.com/v20.0/dialog/oauth');
    facebookAuthUrl.searchParams.set('client_id', clientId);
    facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
    facebookAuthUrl.searchParams.set('scope', scopes);
    facebookAuthUrl.searchParams.set('response_type', 'code');
    facebookAuthUrl.searchParams.set('state', 'facebook_ads_connect'); // CSRF protection

    // Redirect to Facebook OAuth
    return NextResponse.redirect(facebookAuthUrl.toString());
  } catch (error) {
    console.error('Error initiating Facebook OAuth:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate Facebook connection'
    }, { status: 500 });
  }
} 