/**
 * @fileoverview Facebook ad campaign deletion API endpoint
 * 
 * This endpoint permanently deletes a Facebook ad campaign. This operation
 * cannot be undone and will also delete associated ad sets and ads. Supports
 * development mode with mock responses.
 * 
 * @module api/facebook-ads/campaigns/[id]/delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

/**
 * @brief POST endpoint to delete a Facebook ad campaign
 * 
 * Permanently deletes a campaign from Facebook Ads. This operation cannot
 * be undone and will cascade delete associated ad sets and ads.
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
 *   "message": "Campaign deleted successfully",
 *   "campaignId": "campaign_123"
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
 *   "error": "Failed to delete campaign"
 * }
 * ```
 * 
 * @param request Next.js request object
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with success status or error
 * @note Deletion is permanent and cannot be undone
 * @note Also deletes associated ad sets and ads (cascade delete)
 * 
 * @example
 * ```typescript
 * // POST /api/facebook-ads/campaigns/campaign_123/delete
 * // Returns: { success: true, message: "...", campaignId: "..." }
 * ```
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Development mode: simulate campaign deletion
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      // Simulate deletion delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      return NextResponse.json({
        success: true,
        message: 'Campaign deleted successfully (Development Mode)',
        campaignId,
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

    // Delete the campaign
    await facebookAPI.deleteCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully',
      campaignId
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete campaign'
    }, { status: 500 });
  }
} 