import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Development mode: mock connection if Facebook app is not ready
    const isDevelopment = process.env.NODE_ENV === 'development';
    const mockConnection = process.env.FACEBOOK_MOCK_CONNECTION === 'true';
    
    if (isDevelopment && mockConnection) {
      // Simulate successful connection and redirect back to ad manager
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/ad-manager?connected=true&mock=true`);
    }

    // Facebook OAuth configuration
    const clientId = process.env.FACEBOOK_APP_ID;
    const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/facebook-ads/callback`;
    
    if (!clientId) {
      return NextResponse.json({
        success: false,
        error: 'Facebook App ID not configured'
      }, { status: 500 });
    }

    // Required permissions for Facebook Marketing API
    const scopes = [
      'ads_management',
      'ads_read',
      'business_management',
      'pages_read_engagement',
      'pages_manage_ads',
      'email'
    ].join(',');

    // Build Facebook OAuth URL
    const facebookAuthUrl = new URL('https://www.facebook.com/v20.0/dialog/oauth');
    facebookAuthUrl.searchParams.set('client_id', clientId);
    facebookAuthUrl.searchParams.set('redirect_uri', redirectUri);
    facebookAuthUrl.searchParams.set('scope', scopes);
    facebookAuthUrl.searchParams.set('response_type', 'code');
    facebookAuthUrl.searchParams.set('state', 'facebook_ads_connect'); // CSRF protection

    // Redirect to Facebook OAuth
    return NextResponse.redirect(facebookAuthUrl.toString());
  } catch (error) {
    console.error('Error initiating Facebook OAuth:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to initiate Facebook connection'
    }, { status: 500 });
  }
} 