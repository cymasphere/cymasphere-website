import { NextRequest, NextResponse } from 'next/server';
import { requireAdManagerAccess } from '@/utils/auth/middleware';

export async function GET(request: NextRequest) {
  // Check authentication and permissions first
  const authResult = await requireAdManagerAccess(request);
  if (authResult) {
    return authResult; // Return error response if auth fails
  }

  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    // Handle OAuth errors
    if (error) {
      console.error('Facebook OAuth error:', error, errorDescription);
      const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', 'facebook_auth_failed');
      redirectUrl.searchParams.set('message', errorDescription || 'Facebook authentication failed');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate state parameter (basic security check)
    if (!state || !state.startsWith('facebook_ads_connect_')) {
      console.error('Invalid state parameter:', state);
      const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', 'invalid_state');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Validate authorization code
    if (!code) {
      console.error('No authorization code received');
      const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', 'no_auth_code');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Exchange authorization code for access token
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    const redirectUri = `${baseUrl}/api/facebook-ads/callback`;

    if (!appId || !appSecret) {
      console.error('Facebook app credentials not configured');
      const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', 'app_not_configured');
      return NextResponse.redirect(redirectUrl.toString());
    }

    // Exchange code for access token
    const tokenUrl = `https://graph.facebook.com/v20.0/oauth/access_token?` +
      `client_id=${appId}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `client_secret=${appSecret}&` +
      `code=${code}`;

    console.log('Exchanging code for access token...');
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', 'token_exchange_failed');
      redirectUrl.searchParams.set('message', tokenData.error.message || 'Failed to get access token');
      return NextResponse.redirect(redirectUrl.toString());
    }

    const accessToken = tokenData.access_token;
    if (!accessToken) {
      console.error('No access token received:', tokenData);
      const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
      redirectUrl.searchParams.set('error', 'no_access_token');
      return NextResponse.redirect(redirectUrl.toString());
    }

    console.log('✅ Access token received successfully');

    // Get user info and permissions
    const userResponse = await fetch(`https://graph.facebook.com/v20.0/me?access_token=${accessToken}&fields=id,name,email`);
    const userData = await userResponse.json();

    // Get ad accounts
    const adAccountsResponse = await fetch(`https://graph.facebook.com/v20.0/me/adaccounts?access_token=${accessToken}&fields=id,name,account_status`);
    const adAccountsData = await adAccountsResponse.json();

    console.log('✅ Facebook user connected:', userData.name || userData.id);
    if (adAccountsData.data && adAccountsData.data.length > 0) {
      console.log('✅ Found ad accounts:', adAccountsData.data.length);
    }

    // TODO: Store the access token securely in your database
    // For now, we'll just log success and redirect back to ad manager
    console.log('⚠️  TODO: Store access token in database for persistent connection');

    // Redirect back to ad manager with success
    const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('connected', 'true');
    redirectUrl.searchParams.set('user', userData.name || 'Facebook User');
    
    return NextResponse.redirect(redirectUrl.toString());

  } catch (error) {
    console.error('Callback error:', error);
    const redirectUrl = new URL('/ad-manager', process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000');
    redirectUrl.searchParams.set('error', 'callback_failed');
    redirectUrl.searchParams.set('message', error instanceof Error ? error.message : 'Unknown error');
    return NextResponse.redirect(redirectUrl.toString());
  }
} 