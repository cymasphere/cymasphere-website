/**
 * @fileoverview Facebook ads management API endpoint
 * 
 * This endpoint handles listing and creating Facebook ads. Supports filtering
 * by ad set or campaign, and creating new ads with creative content. Includes
 * development mode with mock data for testing.
 * 
 * @module api/facebook-ads/ads
 */

import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

/**
 * @brief GET endpoint to retrieve Facebook ads
 * 
 * Fetches ads from Facebook Ads account, optionally filtered by ad set or
 * campaign. Returns ad data including creative content, performance metrics,
 * and status information.
 * 
 * Query parameters:
 * - adSetId: Filter ads by ad set ID (optional)
 * - campaignId: Filter ads by campaign ID (optional)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "ads": [
 *     {
 *       "id": "ad_1",
 *       "name": "Ad Name",
 *       "adSetId": "adset_1",
 *       "campaignId": "campaign_1",
 *       "status": "active",
 *       "spent": 89.50,
 *       "impressions": 4500,
 *       "clicks": 112,
 *       "conversions": 8,
 *       "creative": {...}
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
 * @returns NextResponse with ads array or error
 * @note Can filter by adSetId or campaignId
 * @note Performance metrics require separate insights API calls
 * 
 * @example
 * ```typescript
 * // GET /api/facebook-ads/ads?adSetId=adset_123
 * // Returns: { success: true, ads: [...] }
 * ```
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adSetId = url.searchParams.get('adSetId');
    const campaignId = url.searchParams.get('campaignId');
    
    // Development mode: return mock ads
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      const mockAds = [
        {
          id: "ad_1",
          name: "Cymasphere Launch - Creative A",
          adSetId: adSetId || "adset_1",
          campaignId: campaignId || "1",
          status: "active",
          spent: 89.50,
          impressions: 4500,
          clicks: 112,
          conversions: 8,
          ctr: 2.49,
          cpc: 0.80,
          cpm: 19.89,
          creative: {
            title: "Create Amazing Music with Cymasphere",
            body: "Professional audio synthesis at your fingertips. Start your free trial today!",
            imageUrl: "/images/ad-creative-1.jpg",
            callToAction: "Learn More"
          },
          createdAt: "2024-01-20"
        },
        {
          id: "ad_2",
          name: "Cymasphere Launch - Creative B",
          adSetId: adSetId || "adset_1",
          campaignId: campaignId || "1",
          status: "active",
          spent: 67.20,
          impressions: 3200,
          clicks: 89,
          conversions: 6,
          ctr: 2.78,
          cpc: 0.75,
          cpm: 21.00,
          creative: {
            title: "Transform Your Music Production",
            body: "Experience the power of advanced synthesis. Try Cymasphere for free!",
            imageUrl: "/images/ad-creative-2.jpg",
            callToAction: "Sign Up"
          },
          createdAt: "2024-01-20"
        },
        {
          id: "ad_3",
          name: "Instagram Story - Music Demo",
          adSetId: adSetId || "adset_2",
          campaignId: campaignId || "1",
          status: "paused",
          spent: 23.40,
          impressions: 1100,
          clicks: 31,
          conversions: 2,
          ctr: 2.82,
          cpc: 0.75,
          cpm: 21.27,
          creative: {
            title: "Hear the Difference",
            body: "Listen to what's possible with Cymasphere's advanced audio engine",
            videoUrl: "/videos/music-demo.mp4",
            callToAction: "Watch More"
          },
          createdAt: "2024-01-20"
        }
      ];

      let filteredAds = mockAds;
      if (adSetId) {
        filteredAds = mockAds.filter(ad => ad.adSetId === adSetId);
      } else if (campaignId) {
        filteredAds = mockAds.filter(ad => ad.campaignId === campaignId);
      }

      return NextResponse.json({
        success: true,
        ads: filteredAds,
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

    const ads = await facebookAPI.getAds(adSetId || undefined);

    return NextResponse.json({
      success: true,
      ads
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ads'
    }, { status: 500 });
  }
}

/**
 * @brief POST endpoint to create a new Facebook ad
 * 
 * Creates a new ad in Facebook Ads with the specified name, ad set, status,
 * and creative content. Validates required fields before creation.
 * 
 * Request body (JSON):
 * - name: Ad name (required)
 * - adSetId: Ad set ID to associate with (required)
 * - campaignId: Campaign ID (optional, derived from ad set)
 * - status: Ad status - "active", "paused", etc. (required)
 * - creative: Creative content object with title, body, images, etc. (required)
 * 
 * Responses:
 * 
 * 200 OK - Success:
 * ```json
 * {
 *   "success": true,
 *   "ad": {
 *     "id": "ad_id",
 *     "name": "Ad Name",
 *     "adSetId": "adset_id",
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
 *   "error": "Missing required fields: name, adSetId, status, creative"
 * }
 * ```
 * 
 * @param request Next.js request object containing JSON body with ad data
 * @returns NextResponse with created ad data or error
 * @note Creative content must include title, body, and image/video
 * 
 * @example
 * ```typescript
 * // POST /api/facebook-ads/ads
 * // Body: { name: "New Ad", adSetId: "adset_123", status: "paused", creative: {...} }
 * // Returns: { success: true, ad: {...} }
 * ```
 */
export async function POST(request: NextRequest) {
  try {
    // Development mode: simulate ad creation
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      const body = await request.json();
      
      // Simulate ad creation delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      
      const mockAd = {
        id: `ad_mock_${Date.now()}`,
        name: body.name,
        adSetId: body.adSetId,
        campaignId: body.campaignId,
        status: body.status?.toLowerCase() || 'paused',
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        creative: body.creative || {},
        createdAt: new Date().toISOString()
      };

      return NextResponse.json({
        success: true,
        ad: mockAd,
        message: 'Ad created successfully (Development Mode)',
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
      adSetId, 
      status, 
      creative
    } = body;

    // Validate required fields
    if (!name || !adSetId || !status || !creative) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: name, adSetId, status, creative'
      }, { status: 400 });
    }

    // Create ad
    const ad = await facebookAPI.createAd({
      name,
      adset_id: adSetId,
      status: status.toUpperCase(),
      creative
    });

    return NextResponse.json({
      success: true,
      ad: {
        id: ad.id,
        name: ad.name,
        adSetId: ad.adset_id,
        campaignId: ad.campaign_id,
        status: ad.status.toLowerCase(),
        createdAt: ad.created_time
      }
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create ad'
    }, { status: 500 });
  }
} 