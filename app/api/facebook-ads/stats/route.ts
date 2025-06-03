import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';
import { requireAdManagerAccess } from '@/utils/auth/middleware';

export async function GET(request: NextRequest) {
  // Check authentication and permissions first
  const authResult = await requireAdManagerAccess(request);
  if (authResult) {
    return authResult; // Return error response if auth fails
  }

  try {
    // Get Facebook API instance
    const facebookAPI = createFacebookAPI();
    if (!facebookAPI) {
      return NextResponse.json({
        success: false,
        error: 'Failed to initialize Facebook API client'
      }, { status: 500 });
    }

    // Check if API is configured
    if (!facebookAPI.isApiConfigured()) {
      // Return mock/demo data when not configured
      const mockStats = {
        totalCampaigns: 0,
        activeCampaigns: 0,
        totalSpent: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        averageCTR: 0,
        averageCPC: 0,
        averageCPM: 0,
        conversionRate: 0,
        returnOnAdSpend: 0
      };
      
      return NextResponse.json({
        success: true,
        stats: mockStats,
        message: 'Facebook API not configured - showing demo data'
      });
    }

    // Fetch real data from Facebook
    const campaigns = await facebookAPI.getCampaigns();
    const activeCampaigns = campaigns.data.filter(campaign => campaign.status === 'ACTIVE').length;

    // Get account insights for the last 30 days
    const dateRange = {
      since: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      until: new Date().toISOString().split('T')[0]
    };

    const accountInsights = await facebookAPI.getAccountInsights(dateRange);

    // Calculate stats from real data
    const totalSpent = parseFloat(accountInsights.spend || '0');
    const totalImpressions = parseInt(accountInsights.impressions || '0');
    const totalClicks = parseInt(accountInsights.clicks || '0');
    const totalConversions = accountInsights.actions
      ? accountInsights.actions.filter(action => action.action_type === 'purchase').reduce((sum, action) => sum + parseInt(action.value), 0)
      : 0;
    const ctr = parseFloat(accountInsights.ctr || '0');
    const cpc = parseFloat(accountInsights.cpc || '0');
    const cpm = parseFloat(accountInsights.cpm || '0');
    const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;
    const returnOnAdSpend = totalSpent > 0 ? (totalConversions * 50) / totalSpent : 0; // Assuming $50 avg conversion value

    const stats = {
      totalCampaigns: campaigns.data.length,
      activeCampaigns,
      totalSpent,
      totalImpressions,
      totalClicks,
      totalConversions,
      averageCTR: ctr,
      averageCPC: cpc,
      averageCPM: cpm,
      conversionRate: parseFloat(conversionRate.toFixed(2)),
      returnOnAdSpend: parseFloat(returnOnAdSpend.toFixed(2))
    };

    return NextResponse.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch ad statistics from Facebook API'
    }, { status: 500 });
  }
} 