import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const adSetId = url.searchParams.get('adSetId');
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

    // Fetch real ads from Facebook
    const facebookAds = await facebookAPI.getAds(adSetId || undefined);
    
    // Filter by campaign if specified
    let filteredAds = facebookAds;
    if (campaignId) {
      filteredAds = facebookAds.filter(ad => ad.campaign_id === campaignId);
    }

    // Transform Facebook ad data to our format
    const ads = await Promise.all(
      filteredAds.map(async (fbAd) => {
        try {
          // Get ad insights for performance data
          const insights = await facebookAPI.getInsights(
            fbAd.id,
            'ad',
            {
              since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              until: new Date().toISOString().split('T')[0]
            }
          );

          const latestInsight = insights[0] || {};

          return {
            id: fbAd.id,
            name: fbAd.name,
            adSetId: fbAd.adset_id,
            campaignId: fbAd.campaign_id,
            status: fbAd.status.toLowerCase(),
            spent: parseFloat(latestInsight.spend || '0'),
            impressions: parseInt(latestInsight.impressions || '0'),
            clicks: parseInt(latestInsight.clicks || '0'),
            conversions: parseInt(latestInsight.conversions || '0'),
            ctr: parseFloat(latestInsight.ctr || '0'),
            cpc: parseFloat(latestInsight.cpc || '0'),
            cpm: parseFloat(latestInsight.cpm || '0'),
            creative: fbAd.creative || {},
            createdAt: fbAd.created_time
          };
        } catch (error) {
          console.error(`Error processing ad ${fbAd.id}:`, error);
          // Return basic ad data even if insights fail
          return {
            id: fbAd.id,
            name: fbAd.name,
            adSetId: fbAd.adset_id,
            campaignId: fbAd.campaign_id,
            status: fbAd.status.toLowerCase(),
            spent: 0,
            impressions: 0,
            clicks: 0,
            conversions: 0,
            ctr: 0,
            cpc: 0,
            cpm: 0,
            creative: fbAd.creative || {},
            createdAt: fbAd.created_time
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      ads
    });
  } catch (error) {
    console.error('Error fetching ads:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ads from Facebook API'
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

    // Create ad via Facebook API
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
        spent: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        creative: ad.creative || creative,
        createdAt: ad.created_time
      },
      message: 'Ad created successfully'
    });
  } catch (error) {
    console.error('Error creating ad:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create ad'
    }, { status: 500 });
  }
} 