/**
 * @fileoverview Individual Facebook ad campaign management API endpoint
 * 
 * This endpoint handles operations on a single Facebook ad campaign by ID.
 * Supports retrieving, updating, and deleting campaigns. Includes development
 * mode with mock data for testing.
 * 
 * @module api/facebook-ads/campaigns/[id]
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI, CAMPAIGN_OBJECTIVES } from '@/utils/facebook/api';

/**
 * @brief GET endpoint to retrieve a single Facebook ad campaign by ID
 * 
 * Fetches detailed information about a specific campaign including name,
 * objective, status, budget, scheduling, and platform targeting.
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
 *   "campaign": {
 *     "id": "1",
 *     "name": "Campaign Name",
 *     "objective": "TRAFFIC",
 *     "status": "active",
 *     "platforms": { "facebook": true, "instagram": false },
 *     "budget": { "type": "daily", "amount": 1000 },
 *     "schedule": { "startDate": "2024-01-20T09:00", "endDate": "2024-02-20T23:59" }
 *   },
 *   "isDevelopmentMode": true
 * }
 * ```
 * 
 * 200 OK - Success (production):
 * ```json
 * {
 *   "success": true,
 *   "campaign": {...}
 * }
 * ```
 * 
 * 404 Not Found:
 * ```json
 * {
 *   "success": false,
 *   "error": "Campaign not found"
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
 * @param request Next.js request object
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with campaign data or error
 * @note Development mode: Returns mock data for predefined campaign IDs
 * 
 * @example
 * ```typescript
 * // GET /api/facebook-ads/campaigns/campaign_123
 * // Returns: { success: true, campaign: {...} }
 * ```
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    
    // Development mode: return mock campaign data
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      const mockCampaigns = {
        "1": {
          id: "1",
          name: "Cymasphere Launch Campaign",
          description: "Main campaign to promote the launch of Cymasphere music production software",
          objective: "TRAFFIC",
          status: "active",
          platforms: {
            facebook: true,
            instagram: false
          },
          budget: {
            type: "daily",
            amount: 1000
          },
          schedule: {
            startDate: "2024-01-20T09:00",
            endDate: "2024-02-20T23:59"
          },
          createdAt: "2024-01-20T10:00:00Z"
        },
        "2": {
          id: "2",
          name: "Instagram Promotion",
          description: "Social media engagement campaign targeting music producers",
          objective: "ENGAGEMENT",
          status: "paused",
          platforms: {
            facebook: false,
            instagram: true
          },
          budget: {
            type: "lifetime",
            amount: 500
          },
          schedule: {
            startDate: "2024-01-18T12:00",
            endDate: ""
          },
          createdAt: "2024-01-18T12:00:00Z"
        },
        "3": {
          id: "3",
          name: "Brand Awareness Drive",
          description: "Building brand recognition in the music production community",
          objective: "BRAND_AWARENESS",
          status: "active",
          platforms: {
            facebook: true,
            instagram: true
          },
          budget: {
            type: "daily",
            amount: 750
          },
          schedule: {
            startDate: "2024-01-15T08:00",
            endDate: "2024-03-15T20:00"
          },
          createdAt: "2024-01-15T08:00:00Z"
        }
      };

      const campaign = mockCampaigns[campaignId as keyof typeof mockCampaigns];
      
      if (!campaign) {
        return NextResponse.json({
          success: false,
          error: 'Campaign not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        campaign,
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

    const campaign = await facebookAPI.getCampaign(campaignId);
    
    if (!campaign) {
      return NextResponse.json({
        success: false,
        error: 'Campaign not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      campaign
    });
  } catch (error) {
    console.error('Error fetching campaign:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch campaign'
    }, { status: 500 });
  }
}

/**
 * @brief PUT endpoint to update a Facebook ad campaign
 * 
 * Updates campaign fields including name, objective, status, budget, and
 * scheduling. Validates required fields and objective before updating.
 * 
 * Route parameters:
 * - id: Campaign ID (from URL path)
 * 
 * Request body (JSON):
 * - name: Campaign name (required)
 * - objective: Campaign objective (required)
 * - status: Campaign status (required)
 * - description: Campaign description (optional)
 * - platforms: Platform targeting object (optional)
 * - budget: Budget object with type and amount (optional)
 * - schedule: Schedule object with startDate and endDate (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "campaign": {
 *     "id": "campaign_id",
 *     "name": "Updated Name",
 *     "objective": "TRAFFIC",
 *     "status": "active"
 *   }
 * }
 * ```
 * 
 * 400 Bad Request - Missing fields:
 * ```json
 * {
 *   "success": false,
 *   "error": "Missing required fields: name, objective, status"
 * }
 * ```
 * 
 * 400 Bad Request - Invalid objective:
 * ```json
 * {
 *   "success": false,
 *   "error": "Invalid campaign objective"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with update data
 * @param params Route parameters containing campaign ID
 * @returns NextResponse with updated campaign data or error
 * @note Validates campaign objective against CAMPAIGN_OBJECTIVES
 * @note Development mode: Simulates update with mock data
 * 
 * @example
 * ```typescript
 * // PUT /api/facebook-ads/campaigns/campaign_123
 * // Body: { name: "Updated Name", status: "active" }
 * // Returns: { success: true, campaign: {...} }
 * ```
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: campaignId } = await params;
    const body = await request.json();
    
    // Development mode: simulate campaign update
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      // Simulate update delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Basic validation
      if (!body.name || !body.objective) {
        return NextResponse.json({
          success: false,
          error: 'Missing required fields: name, objective'
        }, { status: 400 });
      }

      const updatedCampaign = {
        ...body,
        id: campaignId,
        updatedAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        campaign: updatedCampaign,
        message: 'Campaign updated successfully (Development Mode)',
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

    const { name, objective, status, description, platforms, budget, schedule } = body;

    // Validate required fields
    if (!name || !objective || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, objective, status'
      }, { status: 400 });
    }

    // Validate objective
    if (!Object.keys(CAMPAIGN_OBJECTIVES).includes(objective)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid campaign objective'
      }, { status: 400 });
    }

    // Update campaign
    const updatedCampaign = await facebookAPI.updateCampaign(campaignId, {
      name,
      objective,
      status: status.toUpperCase(),
      daily_budget: budget?.type === 'daily' ? budget.amount : undefined,
      lifetime_budget: budget?.type === 'lifetime' ? budget.amount : undefined,
      start_time: schedule?.startDate,
      end_time: schedule?.endDate
    });

    return NextResponse.json({
      success: true,
      campaign: updatedCampaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update campaign'
    }, { status: 500 });
  }
}

/**
 * @brief DELETE endpoint to delete a Facebook ad campaign
 * 
 * Permanently deletes a campaign from Facebook Ads. This operation cannot
 * be undone and will also delete associated ad sets and ads.
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
 *   "message": "Campaign deleted successfully"
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
 * @note Also deletes associated ad sets and ads
 * @note Development mode: Simulates deletion
 * 
 * @example
 * ```typescript
 * // DELETE /api/facebook-ads/campaigns/campaign_123
 * // Returns: { success: true, message: "Campaign deleted successfully" }
 * ```
 */
export async function DELETE(
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
      await new Promise(resolve => setTimeout(resolve, 800));

      return NextResponse.json({
        success: true,
        message: 'Campaign deleted successfully (Development Mode)',
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

    await facebookAPI.deleteCampaign(campaignId);

    return NextResponse.json({
      success: true,
      message: 'Campaign deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete campaign'
    }, { status: 500 });
  }
} 