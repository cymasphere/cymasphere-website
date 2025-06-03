import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const campaignId = url.searchParams.get('campaignId');
    
    // Get Facebook API instance
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;
    if (!adAccountId) {
      return NextResponse.json({
        success: false,
        error: 'Facebook Ad Account ID not configured'
      }, { status: 400 });
    }

    const facebookAPI = createFacebookAPI(adAccountId);
    if (!facebookAPI) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Facebook API client'
      }, { status: 500 });
    }

    // Fetch real ad sets from Facebook
    const facebookAdSets = await facebookAPI.getAdSets(campaignId || undefined);
    
    // Transform Facebook ad set data to our format
    const adSets = await Promise.all(
      facebookAdSets.map(async (fbAdSet) => {
        try {
          // Get ad set insights for performance data
          const insights = await facebookAPI.getInsights(
            fbAdSet.id,
            'adset',
            {
              since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              until: new Date().toISOString().split('T')[0]
            }
          );

          const latestInsight = insights[0] || {};

          return {
            id: fbAdSet.id,
            name: fbAdSet.name,
            campaignId: fbAdSet.campaign_id,
            status: fbAdSet.status.toLowerCase(),
            budget: parseFloat(fbAdSet.daily_budget || fbAdSet.lifetime_budget || '0') / 100,
            spent: parseFloat(latestInsight.spend || '0'),
            impressions: parseInt(latestInsight.impressions || '0'),
            clicks: parseInt(latestInsight.clicks || '0'),
            conversions: parseInt(latestInsight.conversions || '0'),
            ctr: parseFloat(latestInsight.ctr || '0'),
            cpc: parseFloat(latestInsight.cpc || '0'),
            cpm: parseFloat(latestInsight.cpm || '0'),
            targeting: fbAdSet.targeting || {},
            placements: ['facebook_feeds'], // Default placement
            createdAt: fbAdSet.created_time
          };
        } catch (error) {
          console.error(`Error processing ad set ${fbAdSet.id}:`, error);
          // Return basic ad set data even if insights fail
          return {
            id: fbAdSet.id,
            name: fbAdSet.name,
            campaignId: fbAdSet.campaign_id,
            status: fbAdSet.status.toLowerCase(),
            budget: parseFloat(fbAdSet.daily_budget || fbAdSet.lifetime_budget || '0') / 100,
            spent: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            targeting: fbAdSet.targeting || {},
            placements: ['facebook_feeds'],
            createdAt: fbAdSet.created_time
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      adSets
    });
  } catch (error) {
    console.error('Error fetching ad sets:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ad sets from Facebook API'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // Get Facebook API instance
    const adAccountId = process.env.FACEBOOK_AD_ACCOUNT_ID;
    if (!adAccountId) {
      return NextResponse.json({
        success: false,
        error: 'Facebook Ad Account ID not configured'
      }, { status: 400 });
    }

    const facebookAPI = createFacebookAPI(adAccountId);
    if (!facebookAPI) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Facebook API client'
      }, { status: 500 });
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

    // Prepare ad set parameters
    const adSetParams: any = {
      name,
      campaign_id: campaignId,
      status: status.toUpperCase(),
      targeting: targeting || {
        geo_locations: { countries: ['US'] },
        age_min: 18,
        age_max: 65
      },
      optimization_goal: optimizationGoal || 'LINK_CLICKS',
      billing_event: billingEvent || 'LINK_CLICKS'
    };

    // Add budget (convert to cents for Facebook API)
    if (dailyBudget) {
      adSetParams.daily_budget = Math.round(dailyBudget * 100);
    }

    // Add time parameters
    if (startTime) {
      adSetParams.start_time = startTime;
    }
    if (endTime) {
      adSetParams.end_time = endTime;
    }

    // Create ad set via Facebook API
    const adSet = await facebookAPI.createAdSet(adSetParams);

    return NextResponse.json({
      success: true,
      adSet: {
        id: adSet.id,
        name: adSet.name,
        campaignId: adSet.campaign_id,
        status: adSet.status.toLowerCase(),
        budget: dailyBudget || 0,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        targeting: targeting || {},
        placements: ['facebook_feeds'],
        createdAt: adSet.created_time
      },
      message: 'Ad set created successfully'
    });
  } catch (error) {
    console.error('Error creating ad set:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create ad set'
    }, { status: 500 });
  }
} 