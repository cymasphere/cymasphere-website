// Mock data for Facebook Ads development
export const mockCampaigns = [
  {
    id: 'mock_campaign_1',
    name: 'Summer Sale Campaign',
    status: 'ACTIVE',
    objective: 'CONVERSIONS',
    daily_budget: 5000, // in cents
    lifetime_budget: null,
    start_time: '2024-01-15T00:00:00+0000',
    stop_time: null,
    created_time: '2024-01-15T10:30:00+0000',
    updated_time: '2024-01-20T14:22:00+0000',
    insights: {
      impressions: 125430,
      clicks: 3420,
      spend: 2850.75,
      ctr: 2.73,
      cpc: 0.83,
      conversions: 156,
      conversion_rate: 4.56
    }
  },
  {
    id: 'mock_campaign_2',
    name: 'Brand Awareness Q1',
    status: 'PAUSED',
    objective: 'BRAND_AWARENESS',
    daily_budget: 3000,
    lifetime_budget: null,
    start_time: '2024-01-10T00:00:00+0000',
    stop_time: null,
    created_time: '2024-01-10T09:15:00+0000',
    updated_time: '2024-01-18T16:45:00+0000',
    insights: {
      impressions: 89650,
      clicks: 1890,
      spend: 1245.30,
      ctr: 2.11,
      cpc: 0.66,
      conversions: 78,
      conversion_rate: 4.13
    }
  },
  {
    id: 'mock_campaign_3',
    name: 'Product Launch - New Collection',
    status: 'ACTIVE',
    objective: 'TRAFFIC',
    daily_budget: 7500,
    lifetime_budget: null,
    start_time: '2024-01-20T00:00:00+0000',
    stop_time: '2024-02-20T23:59:59+0000',
    created_time: '2024-01-20T08:00:00+0000',
    updated_time: '2024-01-22T11:30:00+0000',
    insights: {
      impressions: 45230,
      clicks: 2340,
      spend: 1890.45,
      ctr: 5.17,
      cpc: 0.81,
      conversions: 234,
      conversion_rate: 10.00
    }
  }
];

export const mockAdSets = [
  {
    id: 'mock_adset_1',
    campaign_id: 'mock_campaign_1',
    name: 'Desktop Users 25-45',
    status: 'ACTIVE',
    daily_budget: 2500,
    targeting: {
      age_min: 25,
      age_max: 45,
      genders: [1, 2],
      device_platforms: ['desktop'],
      geo_locations: {
        countries: ['US', 'CA', 'GB']
      }
    },
    insights: {
      impressions: 62150,
      clicks: 1710,
      spend: 1425.38,
      ctr: 2.75,
      cpc: 0.83
    }
  },
  {
    id: 'mock_adset_2',
    campaign_id: 'mock_campaign_1',
    name: 'Mobile Users 18-35',
    status: 'ACTIVE',
    daily_budget: 2500,
    targeting: {
      age_min: 18,
      age_max: 35,
      genders: [1, 2],
      device_platforms: ['mobile'],
      geo_locations: {
        countries: ['US', 'CA']
      }
    },
    insights: {
      impressions: 63280,
      clicks: 1710,
      spend: 1425.37,
      ctr: 2.70,
      cpc: 0.83
    }
  }
];

export const mockAds = [
  {
    id: 'mock_ad_1',
    adset_id: 'mock_adset_1',
    campaign_id: 'mock_campaign_1',
    name: 'Summer Sale - Hero Image',
    status: 'ACTIVE',
    creative: {
      title: 'Summer Sale - Up to 50% Off!',
      body: 'Don\'t miss our biggest sale of the year. Shop now and save big on all your favorites.',
      image_url: 'https://via.placeholder.com/1200x628/4285f4/ffffff?text=Summer+Sale+Ad',
      call_to_action_type: 'SHOP_NOW',
      link_url: 'https://example.com/summer-sale'
    },
    insights: {
      impressions: 31075,
      clicks: 855,
      spend: 712.69,
      ctr: 2.75,
      cpc: 0.83
    }
  },
  {
    id: 'mock_ad_2',
    adset_id: 'mock_adset_1',
    name: 'Summer Sale - Video',
    status: 'ACTIVE',
    creative: {
      title: 'Summer Collection 2024',
      body: 'Discover our new summer collection with exclusive designs and premium quality.',
      video_url: 'https://example.com/video.mp4',
      call_to_action_type: 'LEARN_MORE',
      link_url: 'https://example.com/collection'
    },
    insights: {
      impressions: 31075,
      clicks: 855,
      spend: 712.69,
      ctr: 2.75,
      cpc: 0.83
    }
  }
];

export const mockAudiences = [
  {
    id: 'mock_audience_1',
    name: 'Website Visitors - Last 30 Days',
    type: 'CUSTOM',
    subtype: 'WEBSITE',
    approximate_count: 15420,
    status: 'READY',
    description: 'People who visited our website in the last 30 days',
    created_time: '2024-01-01T00:00:00+0000'
  },
  {
    id: 'mock_audience_2',
    name: 'Email Subscribers',
    type: 'CUSTOM',
    subtype: 'CUSTOMER_FILE',
    approximate_count: 8930,
    status: 'READY',
    description: 'Uploaded customer email list',
    created_time: '2024-01-05T00:00:00+0000'
  },
  {
    id: 'mock_audience_3',
    name: 'Lookalike - Top Customers',
    type: 'LOOKALIKE',
    subtype: 'LOOKALIKE',
    approximate_count: 2100000,
    status: 'READY',
    description: '1% lookalike based on top 10% customers',
    created_time: '2024-01-10T00:00:00+0000'
  }
];

export const mockAdAccounts = [
  {
    id: 'act_550575860745857',
    name: 'Cymasphere Ad Account',
    account_status: 1, // ACTIVE
    currency: 'USD',
    timezone_name: 'America/Los_Angeles',
    business: {
      id: 'mock_business_1',
      name: 'Cymasphere Business'
    },
    insights: {
      spend: 5986.50,
      impressions: 260310,
      clicks: 6850,
      conversions: 468,
      ctr: 2.63,
      cpc: 0.87,
      conversion_rate: 6.83
    }
  }
];

export const mockStats = {
  totalSpend: 5986.50,
  totalImpressions: 260310,
  totalClicks: 6850,
  totalConversions: 468,
  averageCTR: 2.63,
  averageCPC: 0.87,
  conversionRate: 6.83,
  activeCampaigns: 2,
  pausedCampaigns: 1,
  totalCampaigns: 3
};

// Helper function to simulate API delays
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API responses
export const mockApiResponses = {
  campaigns: {
    data: mockCampaigns,
    paging: {
      cursors: {
        before: 'before_cursor',
        after: 'after_cursor'
      }
    }
  },
  adsets: {
    data: mockAdSets,
    paging: {
      cursors: {
        before: 'before_cursor',
        after: 'after_cursor'
      }
    }
  },
  ads: {
    data: mockAds,
    paging: {
      cursors: {
        before: 'before_cursor',
        after: 'after_cursor'
      }
    }
  },
  audiences: {
    data: mockAudiences,
    paging: {
      cursors: {
        before: 'before_cursor',
        after: 'after_cursor'
      }
    }
  },
  adaccounts: {
    data: mockAdAccounts,
    paging: {
      cursors: {
        before: 'before_cursor',
        after: 'after_cursor'
      }
    }
  }
}; 