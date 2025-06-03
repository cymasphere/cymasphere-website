import { NextRequest, NextResponse } from 'next/server';
import { requireAdManagerAccess } from '@/utils/auth/middleware';

export async function GET(request: NextRequest) {
  // Check authentication and permissions first
  const authResult = await requireAdManagerAccess(request);
  if (authResult) {
    return authResult; // Return error response if auth fails
  }

  try {
    // Get Facebook app configuration
    const appId = process.env.FACEBOOK_APP_ID;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    if (!appId) {
      return NextResponse.json({
        error: 'Facebook App ID not configured. Please set FACEBOOK_APP_ID in environment variables.'
      }, { status: 500 });
    }

    if (!baseUrl) {
      return NextResponse.json({
        error: 'Base URL not configured. Please set NEXT_PUBLIC_BASE_URL in environment variables.'
      }, { status: 500 });
    }

    // Construct OAuth URL
    const redirectUri = `${baseUrl}/api/facebook-ads/callback`;
    const scope = encodeURIComponent('ads_management,ads_read,business_management,pages_read_engagement,pages_manage_ads,email');
    const state = `facebook_ads_connect_${Date.now()}`; // Add timestamp for security
    
    console.log('🔗 Initiating Facebook OAuth:', {
      appId,
      redirectUri,
      scope: 'ads_management,ads_read,business_management,pages_read_engagement,pages_manage_ads,email'
    });
    
    const oauthUrl = `https://www.facebook.com/v20.0/dialog/oauth?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `scope=${scope}&` +
      `response_type=code&` +
      `state=${state}`;

    // Redirect to Facebook OAuth
    return NextResponse.redirect(oauthUrl);

  } catch (error) {
    console.error('Error initiating Facebook connect:', error);
    return NextResponse.json({
      error: 'Failed to initiate Facebook connection'
    }, { status: 500 });
  }
} 