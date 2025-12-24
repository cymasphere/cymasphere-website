/**
 * @fileoverview Facebook ad sets management API endpoint
 * 
 * This endpoint handles listing and creating Facebook ad sets. Ad sets define
 * targeting, budget, and optimization settings for groups of ads. Supports
 * filtering by campaign and includes development mode with mock data.
 * 
 * @module api/facebook-ads/adsets
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

/**
 * @brief GET endpoint to retrieve Facebook ad sets
 * 
 * Fetches ad sets from Facebook Ads account, optionally filtered by campaign.
 * Returns ad set data including targeting, budget, placements, and performance metrics.
 * 
 * Query parameters:
 * - campaignId: Filter ad sets by campaign ID (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "adSets": [
 *     {
 *       "id": "adset_1",
 *       "name": "Ad Set Name",
 *       "campaignId": "campaign_1",
 *       "status": "active",
 *       "budget": 500,
 *       "targeting": {
 *         "ageMin": 25,
 *         "ageMax": 45,
 *         "genders": ["male", "female"],
 *         "locations": ["United States"]
 *       },
 *       "placements": ["facebook_feeds", "instagram_feeds"]
 *     }
 *   ]
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
 * @param request Next.js request object containing query parameters
 * @returns NextResponse with ad sets array or error
 * @note Can filter by campaignId
 * @note Performance metrics require separate insights API calls
 * 
 * @example
 * ```typescript
 * // GET /api/facebook-ads/adsets?campaignId=campaign_123
 * // Returns: { success: true, adSets: [...] }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    
    // Development mode: return mock ad sets
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      const mockAdSets = [
        {
          id: "adset_1",
          name: "Desktop Users 25-45",
          campaignId: campaignId || "1",
          status: "active",
          budget: 500,
          spent: 123.45,
          impressions: 6225,
          clicks: 156,
          conversions: 12,
          ctr: 2.51,
          cpc: 0.79,
          cpm: 19.85,
          targeting: {
            ageMin: 25,
            ageMax: 45,
            genders: ["male", "female"],
            locations: ["United States"],
            interests: ["Technology", "Music Production"]
          },
          placements: ["facebook_feeds", "instagram_feeds"],
          createdAt: "2024-01-20"
        },
        {
          id: "adset_2",
          name: "Mobile Users 18-35",
          campaignId: campaignId || "1",
          status: "active",
          budget: 300,
          spent: 67.89,
          impressions: 3420,
          clicks: 89,
          conversions: 7,
          ctr: 2.60,
          cpc: 0.76,
          cpm: 19.85,
          targeting: {
            ageMin: 18,
            ageMax: 35,
            genders: ["male", "female"],
            locations: ["United States", "Canada"],
            interests: ["Music", "Electronic Music", "Audio Equipment"]
          },
          placements: ["instagram_feeds", "instagram_stories"],
          createdAt: "2024-01-20"
        }
      ];

      const filteredAdSets = campaignId 
        ? mockAdSets.filter(adSet => adSet.campaignId === campaignId)
        : mockAdSets;

      return NextResponse.json({
        success: true,
        adSets: filteredAdSets,
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

    const adSets = await facebookAPI.getAdSets(campaignId || undefined);

    return NextResponse.json({
      success: true,
      adSets
    });
  } catch (error) {
    console.error('Error fetching ad sets:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ad sets'
    }, { status: 500 });
  }
}

/**
 * @brief POST endpoint to create a new Facebook ad set
 * 
 * Creates a new ad set with targeting, budget, optimization settings, and
 * scheduling. Ad sets define who sees the ads and how much to spend.
 * 
 * Request body (JSON):
 * - name: Ad set name (required)
 * - campaignId: Campaign ID to associate with (required)
 * - status: Ad set status - "active", "paused", etc. (required)
 * - dailyBudget: Daily budget in cents (optional)
 * - targeting: Targeting object with demographics, interests, etc. (optional)
 * - optimizationGoal: Optimization goal - "LINK_CLICKS", "CONVERSIONS", etc. (optional)
 * - billingEvent: Billing event - "LINK_CLICKS", "IMPRESSIONS", etc. (optional)
 * - startTime: Ad set start time (optional)
 * - endTime: Ad set end time (optional)
 * - placements: Array of placement names (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "adSet": {
 *     "id": "adset_id",
 *     "name": "Ad Set Name",
 *     "campaignId": "campaign_id",
 *     "status": "paused",
 *     "createdAt": "2024-01-01T00:00:00Z"
 *   }
 * }
 * ```
 * 
 * 400 Bad Request - Missing fields:
 * ```json
 * {
 *   "success": false,
 *   "error": "Missing required fields: name, campaignId, status"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with ad set data
 * @returns NextResponse with created ad set data or error
 * @note Budget must be specified in cents (e.g., $10.00 = 1000)
 * @note Targeting defines who sees the ads
 * 
 * @example
 * ```typescript
 * // POST /api/facebook-ads/adsets
 * // Body: { name: "New Ad Set", campaignId: "campaign_123", status: "paused", dailyBudget: 1000 }
 * // Returns: { success: true, adSet: {...} }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Development mode: simulate ad set creation
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      const body = await request.json();
      
      // Simulate ad set creation delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockAdSet = {
        id: `adset_mock_${Date.now()}`,
        name: body.name,
        campaignId: body.campaignId,
        status: body.status?.toLowerCase() || 'paused',
        budget: body.dailyBudget || 0,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        targeting: body.targeting || {},
        placements: body.placements || [],
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        adSet: mockAdSet,
        message: 'Ad set created successfully (Development Mode)',
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

    const body = await request.json();
    const { 
      name, 
      campaignId, 
      status, 
      dailyBudget, 
      targeting, 
      optimizationGoal,
      billingEvent,
      startTime,
      endTime
    } = body;

    // Validate required fields
    if (!name || !campaignId || !status) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, campaignId, status'
      }, { status: 400 });
    }

    // Create ad set
    const adSet = await facebookAPI.createAdSet({
      name,
      campaign_id: campaignId,
      status: status.toUpperCase(),
      daily_budget: dailyBudget,
      targeting: targeting || {},
      optimization_goal: optimizationGoal || 'LINK_CLICKS',
      billing_event: billingEvent || 'LINK_CLICKS',
      start_time: startTime,
      end_time: endTime
    });

    return NextResponse.json({
      success: true,
      adSet: {
        id: adSet.id,
        name: adSet.name,
        campaignId: adSet.campaign_id,
        status: adSet.status.toLowerCase(),
        createdAt: adSet.created_time
      }
    });
  } catch (error) {
    console.error('Error creating ad set:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create ad set'
    }, { status: 500 });
  }
} 