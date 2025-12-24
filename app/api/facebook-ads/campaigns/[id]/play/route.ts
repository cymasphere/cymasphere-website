/**
 * @fileoverview Facebook ad campaign resume API endpoint
 * 
 * This endpoint resumes a paused Facebook ad campaign. Changes the campaign
 * status to "ACTIVE" which resumes ad delivery. Supports development mode
 * with mock responses.
 * 
 * @module api/facebook-ads/campaigns/[id]/play
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

/**
 * @brief POST endpoint to resume a paused Facebook ad campaign
 * 
 * Resumes a paused campaign by setting its status to "ACTIVE". This resumes
 * ad delivery immediately using the existing campaign settings.
 * 
 * Route parameters:
 * - id: Campaign ID (from URL path)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "message": "Campaign resumed successfully",
 *   "campaignId": "campaign_123",
 *   "status": "active"
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
 *   "error": "Failed to resume campaign"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with success status or error
 * @note Resumes ad delivery using existing campaign settings
 * @note Campaign must be in "PAUSED" status to be resumed
 * 
 * @example
 * ```typescript
 * // POST /api/facebook-ads/campaigns/campaign_123/play
 * // Returns: { success: true, message: "...", campaignId: "...", status: "active" }
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Development mode: simulate campaign resume
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      // Simulate resume delay
      await new Promise(resolve => setTimeout(resolve, 800));

      return NextResponse.json({
        success: true,
        message: 'Campaign resumed successfully (Development Mode)',
        campaignId,
        status: 'active',
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

    // Resume the campaign
    await facebookAPI.resumeCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign resumed successfully',
      campaignId,
      status: 'active'
    });
  } catch (error) {
    console.error('Error resuming campaign:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to resume campaign'
    }, { status: 500 });
  }
} 