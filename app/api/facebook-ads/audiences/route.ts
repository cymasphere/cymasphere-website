import { NextRequest, NextResponse } from 'next/server';
import { createFacebookAPI } from '@/utils/facebook/api';

interface AudienceData {
  name: string;
  description: string;
  type: 'custom' | 'lookalike' | 'saved';
  demographics: {
    ageRange: string;
    gender: string;
    locations: string[];
  };
  interests: string[];
  source?: 'website_visitors' | 'customer_list' | 'app_users' | 'engagement';
}

export async function POST(request: NextRequest) {
  try {
    const audienceData: AudienceData = await request.json();

    // Validate required fields
    if (!audienceData.name?.trim()) {
      return NextResponse.json(
        { error: 'Audience name is required' },
        { status: 400 }
      );
    }

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

    // Create custom audience via Facebook API
    const audience = await facebookAPI.createCustomAudience(
      audienceData.name,
      audienceData.description || '',
      audienceData.type === 'custom' ? 'CUSTOM' : 'LOOKALIKE'
    );

    // Transform to our format
    const transformedAudience = {
      id: audience.id,
      name: audience.name,
      description: audienceData.description || '',
      type: audienceData.type,
      status: 'active',
      size: audience.approximate_count || 0,
      reach: Math.floor((audience.approximate_count || 0) * 0.8), // Estimate reach as 80% of size
      demographics: audienceData.demographics,
      interests: audienceData.interests,
      createdAt: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      audience: transformedAudience,
      message: 'Audience created successfully'
    });

  } catch (error) {
    console.error('Error creating audience:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create audience'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
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

    // Fetch real audiences from Facebook
    const facebookAudiences = await facebookAPI.getCustomAudiences();
    
    // Transform Facebook audience data to our format
    const audiences = facebookAudiences.map((fbAudience) => ({
      id: fbAudience.id,
      name: fbAudience.name,
      description: fbAudience.description || '',
      type: fbAudience.subtype === 'LOOKALIKE' ? 'lookalike' : 'custom',
      status: 'active', // Facebook audiences don't have the same status concept
      size: fbAudience.approximate_count || 0,
      reach: Math.floor((fbAudience.approximate_count || 0) * 0.8), // Estimate reach as 80% of size
      demographics: {
        ageRange: "18-65", // Default since Facebook doesn't expose detailed demographics
        gender: "All",
        locations: ["United States"] // Default, would need additional API calls for exact targeting
      },
      interests: [], // Would need additional API calls to get targeting details
      createdAt: fbAudience.time_created || new Date().toISOString(),
      lastUpdated: fbAudience.time_updated || new Date().toISOString()
    }));

    return NextResponse.json({
      success: true,
      audiences
    });

  } catch (error) {
    console.error('Error fetching audiences:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch audiences'
    }, { status: 500 });
  }
} 