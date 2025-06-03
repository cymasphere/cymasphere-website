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
    // Create Facebook API instance
    const facebookAPI = createFacebookAPI();
    
    if (!facebookAPI) {
      return NextResponse.json({
        connected: false,
        message: 'Failed to initialize Facebook API client'
      });
    }

    // Check if API is configured
    if (!facebookAPI.isApiConfigured()) {
      const status = facebookAPI.getConfigurationStatus();
      return NextResponse.json({
        connected: false,
        message: status.message
      });
    }

    // Test the connection with real Facebook API
    const connectionTest = await facebookAPI.testConnection();
    
    if (connectionTest.connected) {
      return NextResponse.json({
        connected: true,
        permissions: connectionTest.permissions,
        account: connectionTest.account,
        message: `Connected to Facebook Ads - Account: ${connectionTest.account?.name || 'Unknown'}`
      });
    } else {
      return NextResponse.json({
        connected: false,
        message: 'Failed to connect to Facebook API - check token permissions'
      });
    }
  } catch (error) {
    console.error('Error checking Facebook connection:', error);
    return NextResponse.json({
      connected: false,
      message: 'Error checking connection status'
    }, { status: 500 });
  }
} 