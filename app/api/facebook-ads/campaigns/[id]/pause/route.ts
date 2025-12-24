/**
 * @fileoverview Facebook ad campaign pause API endpoint
 * 
 * This endpoint pauses a running Facebook ad campaign. Changes the campaign
 * status to "PAUSED" which stops ad delivery but preserves campaign settings.
 * Supports development mode with mock responses.
 * 
 * @module api/facebook-ads/campaigns/[id]/pause
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

/**
 * @brief POST endpoint to pause a Facebook ad campaign
 * 
 * Pauses a campaign by setting its status to "PAUSED". This stops ad delivery
 * immediately but preserves all campaign settings, allowing it to be resumed later.
 * 
 * Route parameters:
 * - id: Campaign ID (from URL path)
 * 
 * Responses:
 * 
 * 200 OK - Success (development mode):
 * ```json
 * {
 *   "success": true,
 *   "message": "Campaign paused successfully (Development Mode)",
 *   "campaignId": "campaign_123",
 *   "status": "paused",
 *   "isDevelopmentMode": true
 * }
 * ```
 * 
 * 200 OK - Success (production):
 * ```json
 * {
 *   "success": true,
 *   "message": "Campaign paused successfully",
 *   "campaignId": "campaign_123",
 *   "status": "paused"
 * }
 * ```
 * 
 * 401 Unauthorized - Not connected:
 * ```json
 * {
 *   "success": false,
 *   "error": "Not connected to Facebook Ads"
 * }
 * ```
 * 
 * 500 Internal Server Error:
 * ```json
 * {
 *   "success": false,
 *   "error": "Failed to pause campaign"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with success status or error
 * @note Pausing stops ad delivery but preserves campaign settings
 * @note Campaign can be resumed using the play endpoint
 * 
 * @example
 * ```typescript
 * // POST /api/facebook-ads/campaigns/campaign_123/pause
 * // Returns: { success: true, message: "...", campaignId: "...", status: "paused" }
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Development mode: simulate campaign pause
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      // Simulate pause delay
      await new Promise(resolve => setTimeout(resolve, 800));

      return NextResponse.json({
        success: true,
        message: 'Campaign paused successfully (Development Mode)',
        campaignId,
        status: 'paused',
        isDevelopmentMode: true
      });
    }

    const mockAdAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID || '123456789';
    const facebookAPI = createFacebookAPI(mockAdAccountId);
    
    if (!facebookAPI) {
      return NextResponse.json({
        success: false,
        error: 'Not connected to Facebook Ads'
      }, { status: 401 });
    }

    // Pause the campaign
    await facebookAPI.pauseCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign paused successfully',
      campaignId,
      status: 'paused'
    });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to pause campaign'
    }, { status: 500 });
  }
} 