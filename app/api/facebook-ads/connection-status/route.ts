/**
 * @fileoverview Facebook Ads connection status check API endpoint
 * 
 * This endpoint checks whether the application is connected to Facebook Ads
 * and validates the connection by testing API access. Returns connection status
 * and user information if connected. Supports development mode with mock data.
 * 
 * @module api/facebook-ads/connection-status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

/**
 * @brief GET endpoint to check Facebook Ads connection status
 * 
 * Tests the Facebook Ads API connection and returns connection status along
 * with user information if connected. Validates stored access tokens and
 * tests API accessibility.
 * 
 * Responses:
 * 
 * 200 OK - Connected (development mode):
 * ```json
 * {
 *   "connected": true,
 *   "user": {
 *     "id": "mock_user_123",
 *     "name": "Development User",
 *     "email": "dev@example.com"
 *   },
 *   "message": "Connected to Facebook Ads (Development Mode)",
 *   "isDevelopmentMode": true
 * }
 * ```
 * 
 * 200 OK - Connected (production):
 * ```json
 * {
 *   "connected": true,
 *   "user": {
 *     "id": "facebook_user_id",
 *     "name": "User Name",
 *     "email": "user@example.com"
 *   },
 *   "message": "Connected to Facebook Ads"
 * }
 * ```
 * 
 * 200 OK - Not connected:
 * ```json
 * {
 *   "connected": false,
 *   "message": "No Facebook access token found"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "connected": false,
 *   "message": "Error checking connection status"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @returns NextResponse with connection status and user info
 * @note Tests API connection by making a test API call
 * @note Development mode: Returns mock data if FACEBOOK_MOCK_CONNECTION=true
 * 
 * @example
 * ```typescript
 * // GET /api/facebook-ads/connection-status
 * // Returns: { connected: true, user: {...}, message: "..." }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    // Development mode: mock connection if Facebook app is not ready
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      return NextResponse.json({
        connected: true,
        user: {
          id: 'mock_user_123',
          name: 'Development User',
          email: 'dev@example.com'
        },
        message: 'Connected to Facebook Ads (Development Mode)',
        isDevelopmentMode: true
      });
    }

    // Get stored Facebook token from user session/database
    // For now, we'll check if a token exists in a mock way
    // In production, this would check the database for stored tokens
    
    const mockAdAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID || '123456789';
    const facebookAPI = createFacebookAPI(mockAdAccountId);
    
    if (!facebookAPI) {
      return NextResponse.json({
        connected: false,
        message: 'No Facebook access token found'
      });
    }

    // Test the connection
    const connectionTest = await facebookAPI.testConnection();
    
    if (connectionTest.success) {
      return NextResponse.json({
        connected: true,
        user: connectionTest.user,
        message: 'Connected to Facebook Ads'
      });
    } else {
      return NextResponse.json({
        connected: false,
        message: connectionTest.error || 'Failed to connect to Facebook'
      });
    }
  } catch (error) {
    console.error('Error checking Facebook connection:', error);
    return NextResponse.json({
      connected: false,
      message: 'Error checking connection status'
    }, { status: 500 });
  }
} 