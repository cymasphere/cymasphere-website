import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI, CAMPAIGN_OBJECTIVES } from '@/utils/facebook/api';
import { requireAdManagerAccess } from '@/utils/auth/middleware';

export async function GET(request: NextRequest) {
  // Check authentication and permissions first
  const authResult = await requireAdManagerAccess(request);
  if (authResult) {
    return authResult; // Return error response if auth fails
  }

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

    // Fetch real campaigns from Facebook
    const facebookCampaigns = await facebookAPI.getCampaigns();
    
    // Transform Facebook campaign data to our format with performance data
    const campaigns = await Promise.all(
      facebookCampaigns.map(async (fbCampaign) => {
        try {
          // Get campaign insights for performance data
          const insights = await facebookAPI.getInsights(
            fbCampaign.id,
            'campaign',
            {
              since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 30 days
              until: new Date().toISOString().split('T')[0]
            }
          );

          const latestInsight = insights[0] || {};
          
          // Get ad sets and ads count for this campaign
          const adSets = await facebookAPI.getAdSets(fbCampaign.id);
          const ads = await facebookAPI.getAds();
          const campaignAds = ads.filter(ad => ad.campaign_id === fbCampaign.id);

          return {
            id: fbCampaign.id,
            name: fbCampaign.name,
            status: fbCampaign.status.toLowerCase() as 'active' | 'paused' | 'ended',
            objective: fbCampaign.objective || 'Unknown',
            platform: 'facebook' as const, // Default to facebook
            budget: parseFloat(fbCampaign.daily_budget || fbCampaign.lifetime_budget || '0') / 100, // Convert cents to dollars
            spent: parseFloat(latestInsight.spend || '0'),
            impressions: parseInt(latestInsight.impressions || '0'),
            clicks: parseInt(latestInsight.clicks || '0'),
            conversions: parseInt(latestInsight.conversions || '0'),
            ctr: parseFloat(latestInsight.ctr || '0'),
            cpc: parseFloat(latestInsight.cpc || '0'),
            cpm: parseFloat(latestInsight.cpm || '0'),
            adSets: adSets.length,
            ads: campaignAds.length,
            createdAt: fbCampaign.created_time
          };
        } catch (error) {
          console.error(`Error processing campaign ${fbCampaign.id}:`, error);
          // Return basic campaign data even if insights fail
          return {
            id: fbCampaign.id,
            name: fbCampaign.name,
            status: fbCampaign.status.toLowerCase() as 'active' | 'paused' | 'ended',
            objective: fbCampaign.objective || 'Unknown',
            platform: 'facebook' as const,
            budget: parseFloat(fbCampaign.daily_budget || fbCampaign.lifetime_budget || '0') / 100,
            spent: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            adSets: 0,
            ads: 0,
            createdAt: fbCampaign.created_time
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      campaigns
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch campaigns from Facebook API'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  // Check authentication and permissions first
  const authResult = await requireAdManagerAccess(request);
  if (authResult) {
    return authResult; // Return error response if auth fails
  }

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
    const { name, objective, status, dailyBudget, lifetimeBudget, startTime, endTime } = body;

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

    // Prepare campaign parameters
    const campaignParams: any = {
      name,
      objective,
      status: status.toUpperCase()
    };

    // Add budget (convert to cents for Facebook API)
    if (dailyBudget) {
      campaignParams.daily_budget = Math.round(dailyBudget * 100);
    }
    if (lifetimeBudget) {
      campaignParams.lifetime_budget = Math.round(lifetimeBudget * 100);
    }

    // Add time parameters
    if (startTime) {
      campaignParams.start_time = startTime;
    }
    if (endTime) {
      campaignParams.end_time = endTime;
    }

    // Create campaign via Facebook API
    const campaign = await facebookAPI.createCampaign(campaignParams);

    return NextResponse.json({
      success: true,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        status: campaign.status.toLowerCase(),
        objective: campaign.objective,
        budget: dailyBudget || lifetimeBudget || 0,
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        adSets: 0,
        ads: 0,
        createdAt: campaign.created_time,
        platform: 'facebook'
      },
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create campaign'
    }, { status: 500 });
  }
} 