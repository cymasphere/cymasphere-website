// Facebook Marketing API Client for Next.js (2025 Implementation)
// Following Meta's official best practices and latest API standards

// API Configuration
const GRAPH_API_VERSION = 'v20.0'; // Use latest stable version
const BASE_URL = `https://graph.facebook.com/${GRAPH_API_VERSION}`;

// Campaign Objectives (2025 updated list)
export const CAMPAIGN_OBJECTIVES = {
  OUTCOME_AWARENESS: 'OUTCOME_AWARENESS',
  OUTCOME_ENGAGEMENT: 'OUTCOME_ENGAGEMENT', 
  OUTCOME_TRAFFIC: 'OUTCOME_TRAFFIC',
  OUTCOME_LEADS: 'OUTCOME_LEADS',
  OUTCOME_APP_PROMOTION: 'OUTCOME_APP_PROMOTION',
  OUTCOME_SALES: 'OUTCOME_SALES'
} as const;

// Campaign Status
export const CAMPAIGN_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DELETED: 'DELETED',
  ARCHIVED: 'ARCHIVED'
} as const;

// Special Ad Categories (REQUIRED as of 2025)
export const SPECIAL_AD_CATEGORIES = {
  NONE: 'NONE',
  HOUSING: 'HOUSING',
  EMPLOYMENT: 'EMPLOYMENT', 
  CREDIT: 'CREDIT',
  ISSUES_ELECTIONS_POLITICS: 'ISSUES_ELECTIONS_POLITICS'
} as const;

// Rate Limiting and Error Handling
interface APIRateLimit {
  appUsage: number;
  businessUsage: number;
  callsRemaining: number;
}

interface APIError {
  message: string;
  type: string;
  code: number;
  error_subcode?: number;
  fbtrace_id?: string;
}

// Enhanced Facebook API Response Types
export interface FacebookCampaign {
  id: string;
  name: string;
  status: string;
  objective?: string;
  created_time: string;
  updated_time: string;
  start_time?: string;
  stop_time?: string;
  budget_limit?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  spend_cap?: string;
  special_ad_categories: string[];
  insights?: {
    impressions?: string;
    clicks?: string;
    spend?: string;
    ctr?: string;
    cpc?: string;
    cpm?: string;
    reach?: string;
  };
}

export interface FacebookAdAccount {
  id: string;
  account_id: string;
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  spend_cap?: string;
  balance?: string;
  business?: {
    id: string;
    name: string;
  };
}

export interface FacebookInsights {
  impressions: string;
  clicks: string;
  spend: string;
  reach?: string;
  ctr: string;
  cpc: string;
  cpm: string;
  frequency?: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

export interface CreateCampaignRequest {
  name: string;
  objective: keyof typeof CAMPAIGN_OBJECTIVES;
  status?: keyof typeof CAMPAIGN_STATUS;
  special_ad_categories: (keyof typeof SPECIAL_AD_CATEGORIES)[];
  budget_limit?: number;
  daily_budget?: number;
  lifetime_budget?: number;
  start_time?: string;
  stop_time?: string;
}

export interface CreateAudienceRequest {
  name: string;
  description?: string;
  subtype: 'CUSTOM' | 'WEBSITE' | 'ENGAGEMENT' | 'LOOKALIKE';
  customer_file_source?: string;
  retention_days?: number;
  lookalike_spec?: {
    origin_country: string;
    ratio: number;
    base_ids: string[];
  };
}

export interface CustomAudience {
  id: string;
  name: string;
  description?: string;
  approximate_count: number;
  data_source?: string;
  subtype: string;
  time_created: string;
  time_updated: string;
}

// Main Facebook Marketing API Client
export class FacebookMarketingAPI {
  private accessToken: string;
  private adAccountId: string;
  private rateLimits: APIRateLimit = { appUsage: 0, businessUsage: 0, callsRemaining: 100 };
  private isConfigured: boolean = false;

  constructor(accessToken?: string, adAccountId?: string) {
    this.accessToken = accessToken || process.env.FACEBOOK_SYSTEM_USER_TOKEN || '';
    this.adAccountId = adAccountId || process.env.FACEBOOK_AD_ACCOUNT_ID || '';
    
    // Check if properly configured
    this.isConfigured = !!(this.accessToken && this.adAccountId);
    
    // Don't throw error in constructor, handle gracefully in methods
    if (this.isConfigured && this.adAccountId && !this.adAccountId.startsWith('act_')) {
      this.adAccountId = `act_${this.adAccountId}`;
    }
  }

  // Check if API is properly configured
  public isApiConfigured(): boolean {
    return this.isConfigured;
  }

  // Get configuration status with details
  public getConfigurationStatus(): { configured: boolean; message: string } {
    if (!this.accessToken) {
      return { 
        configured: false, 
        message: 'Facebook access token is required. Set FACEBOOK_SYSTEM_USER_TOKEN environment variable.' 
      };
    }
    
    if (!this.adAccountId) {
      return { 
        configured: false, 
        message: 'Facebook ad account ID is required. Set FACEBOOK_AD_ACCOUNT_ID environment variable.' 
      };
    }
    
    return { configured: true, message: 'Facebook API is properly configured.' };
  }

  // Enhanced API request with rate limiting and error handling
  private async makeRequest<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    body?: any,
    retries = 3
  ): Promise<T> {
    // Check configuration before making requests
    if (!this.isConfigured) {
      const status = this.getConfigurationStatus();
      throw new Error(status.message);
    }

    const url = `${BASE_URL}${endpoint}`;
    const params = new URLSearchParams();
    
    // Always include access token
    params.append('access_token', this.accessToken);
    
    // For GET requests, add body params to URL
    if (method === 'GET' && body) {
      Object.entries(body).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }

    const requestUrl = method === 'GET' ? `${url}?${params}` : url;
    const requestInit: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'CymasphereFacebookAPI/1.0'
      }
    };

    // For non-GET requests, send body as JSON with access_token included
    if (method !== 'GET') {
      requestInit.body = JSON.stringify({
        ...body,
        access_token: this.accessToken
      });
    }

    try {
      const response = await fetch(requestUrl, requestInit);
      
      // Update rate limit info from headers
      this.updateRateLimits(response.headers);
      
      const data = await response.json();
      
      if (!response.ok) {
        const error = data.error as APIError;
        
        // Handle rate limiting with exponential backoff
        if (error.code === 17 || error.code === 4) {
          if (retries > 0) {
            const backoffTime = Math.pow(2, 4 - retries) * 1000; // 1s, 2s, 4s
            console.warn(`Rate limited, retrying in ${backoffTime}ms...`);
            await new Promise(resolve => setTimeout(resolve, backoffTime));
            return this.makeRequest<T>(endpoint, method, body, retries - 1);
          }
        }
        
        throw new Error(`Facebook API Error (${error.code}): ${error.message}`);
      }
      
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(`API request failed: ${String(error)}`);
    }
  }

  // Update rate limit tracking from response headers
  private updateRateLimits(headers: Headers): void {
    const appUsage = headers.get('X-App-Usage');
    const businessUsage = headers.get('X-Business-Use-Case-Usage');
    
    if (appUsage) {
      try {
        const usage = JSON.parse(appUsage);
        this.rateLimits.appUsage = usage.call_count || 0;
      } catch (e) {
        console.warn('Failed to parse app usage header:', e);
      }
    }
    
    if (businessUsage) {
      try {
        const usage = JSON.parse(businessUsage);
        this.rateLimits.businessUsage = Object.values(usage)[0] as number || 0;
      } catch (e) {
        console.warn('Failed to parse business usage header:', e);
      }
    }
  }

  // Get current rate limit status
  public getRateLimits(): APIRateLimit {
    return { ...this.rateLimits };
  }

  // Test API connection and permissions
  async testConnection(): Promise<{ connected: boolean; permissions: string[]; account?: FacebookAdAccount }> {
    try {
      // Test basic API access
      const user = await this.makeRequest<{ id: string; name: string }>('/me');
      
      // Test Marketing API access by fetching ad account info
      const account = await this.makeRequest<FacebookAdAccount>(`/${this.adAccountId}`, 'GET', {
        fields: 'id,account_id,name,account_status,currency,timezone_name,business{id,name}'
      });
      
      // Get permissions for this token
      const permissions = await this.makeRequest<{ data: Array<{ permission: string; status: string }> }>('/me/permissions');
      const grantedPermissions = permissions.data
        .filter(p => p.status === 'granted')
        .map(p => p.permission);
      
      return {
        connected: true,
        permissions: grantedPermissions,
        account
      };
    } catch (error) {
      console.error('Facebook connection test failed:', error);
      return {
        connected: false,
        permissions: []
      };
    }
  }

  // Campaign Management
  async getCampaigns(limit = 25, fields?: string[]): Promise<{ data: FacebookCampaign[]; paging?: any }> {
    const defaultFields = ['id', 'name', 'status', 'objective', 'created_time', 'updated_time', 'special_ad_categories'];
    const requestFields = fields || defaultFields;
    
    return this.makeRequest(`/${this.adAccountId}/campaigns`, 'GET', {
      fields: requestFields.join(','),
      limit
    });
  }

  async getCampaign(campaignId: string, fields?: string[]): Promise<FacebookCampaign> {
    const defaultFields = ['id', 'name', 'status', 'objective', 'created_time', 'updated_time', 'start_time', 'stop_time', 'special_ad_categories'];
    const requestFields = fields || defaultFields;
    
    return this.makeRequest(`/${campaignId}`, 'GET', {
      fields: requestFields.join(',')
    });
  }

  async createCampaign(campaignData: CreateCampaignRequest): Promise<FacebookCampaign> {
    // Validate required fields
    if (!campaignData.name || !campaignData.objective) {
      throw new Error('Campaign name and objective are required');
    }
    
    // Ensure special_ad_categories is set (required in 2025)
    if (!campaignData.special_ad_categories || campaignData.special_ad_categories.length === 0) {
      campaignData.special_ad_categories = ['NONE'];
    }
    
    const payload: any = {
      name: campaignData.name,
      objective: campaignData.objective,
      status: campaignData.status || 'PAUSED',
      special_ad_categories: campaignData.special_ad_categories
    };
    
    // Add budget fields if provided
    if (campaignData.budget_limit) payload.budget_limit = campaignData.budget_limit;
    if (campaignData.daily_budget) payload.daily_budget = campaignData.daily_budget;
    if (campaignData.lifetime_budget) payload.lifetime_budget = campaignData.lifetime_budget;
    if (campaignData.start_time) payload.start_time = campaignData.start_time;
    if (campaignData.stop_time) payload.stop_time = campaignData.stop_time;
    
    const result = await this.makeRequest<{ id: string }>(`/${this.adAccountId}/campaigns`, 'POST', payload);
    
    // Return the created campaign with full details
    return this.getCampaign(result.id);
  }

  async updateCampaign(campaignId: string, updates: Partial<CreateCampaignRequest>): Promise<FacebookCampaign> {
    await this.makeRequest(`/${campaignId}`, 'POST', updates);
    return this.getCampaign(campaignId);
  }

  async deleteCampaign(campaignId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/${campaignId}`, 'DELETE');
  }

  // Campaign Actions
  async pauseCampaign(campaignId: string): Promise<FacebookCampaign> {
    return this.updateCampaign(campaignId, { status: 'PAUSED' });
  }

  async activateCampaign(campaignId: string): Promise<FacebookCampaign> {
    return this.updateCampaign(campaignId, { status: 'ACTIVE' });
  }

  // Insights and Analytics
  async getCampaignInsights(
    campaignId: string, 
    dateRange?: { since: string; until: string },
    breakdowns?: string[]
  ): Promise<FacebookInsights> {
    const params: any = {
      fields: 'impressions,clicks,spend,reach,ctr,cpc,cpm,frequency,actions'
    };
    
    if (dateRange) {
      params.time_range = JSON.stringify({
        since: dateRange.since,
        until: dateRange.until
      });
    }
    
    if (breakdowns && breakdowns.length > 0) {
      params.breakdowns = breakdowns.join(',');
    }
    
    const response = await this.makeRequest<{ data: FacebookInsights[] }>(`/${campaignId}/insights`, 'GET', params);
    
    // Return the first (aggregated) insights object
    return response.data[0] || {
      impressions: '0',
      clicks: '0', 
      spend: '0.00',
      ctr: '0.00',
      cpc: '0.00',
      cpm: '0.00'
    };
  }

  async getAccountInsights(dateRange?: { since: string; until: string }): Promise<FacebookInsights> {
    const params: any = {
      fields: 'impressions,clicks,spend,reach,ctr,cpc,cpm,frequency'
    };
    
    if (dateRange) {
      params.time_range = JSON.stringify({
        since: dateRange.since,
        until: dateRange.until
      });
    }
    
    const response = await this.makeRequest<{ data: FacebookInsights[] }>(`/${this.adAccountId}/insights`, 'GET', params);
    
    return response.data[0] || {
      impressions: '0',
      clicks: '0',
      spend: '0.00', 
      ctr: '0.00',
      cpc: '0.00',
      cpm: '0.00'
    };
  }

  // Custom Audience Management
  async getCustomAudiences(limit = 25): Promise<{ data: CustomAudience[] }> {
    return this.makeRequest(`/${this.adAccountId}/customaudiences`, 'GET', {
      fields: 'id,name,description,approximate_count,data_source,subtype,time_created,time_updated',
      limit
    });
  }

  async createCustomAudience(audienceData: CreateAudienceRequest): Promise<CustomAudience> {
    // Validate required fields
    if (!audienceData.name || !audienceData.subtype) {
      throw new Error('Audience name and subtype are required');
    }
    
    const payload: any = {
      name: audienceData.name,
      subtype: audienceData.subtype,
      description: audienceData.description || ''
    };
    
    // Add subtype-specific fields
    if (audienceData.subtype === 'CUSTOM') {
      payload.customer_file_source = audienceData.customer_file_source || 'USER_PROVIDED_ONLY';
    }
    
    if (audienceData.subtype === 'LOOKALIKE' && audienceData.lookalike_spec) {
      payload.lookalike_spec = audienceData.lookalike_spec;
    }
    
    if (audienceData.retention_days) {
      payload.retention_days = audienceData.retention_days;
    }
    
    const result = await this.makeRequest<{ id: string }>(`/${this.adAccountId}/customaudiences`, 'POST', payload);
    
    // Return the created audience with full details
    const audience = await this.makeRequest<CustomAudience>(`/${result.id}`, 'GET', {
      fields: 'id,name,description,approximate_count,data_source,subtype,time_created,time_updated'
    });
    
    return audience;
  }

  async addUsersToAudience(audienceId: string, emails: string[]): Promise<{ success: boolean }> {
    // Hash emails with SHA-256 as required by Facebook
    const crypto = require('crypto');
    const hashedEmails = emails.map(email => 
      crypto.createHash('sha256').update(email.trim().toLowerCase()).digest('hex')
    );
    
    return this.makeRequest(`/${audienceId}/users`, 'POST', {
      payload: {
        schema: 'EMAIL',
        data: hashedEmails
      }
    });
  }

  async deleteCustomAudience(audienceId: string): Promise<{ success: boolean }> {
    return this.makeRequest(`/${audienceId}`, 'DELETE');
  }

  // Account Information
  async getAdAccount(): Promise<FacebookAdAccount> {
    return this.makeRequest(`/${this.adAccountId}`, 'GET', {
      fields: 'id,account_id,name,account_status,currency,timezone_name,spend_cap,balance,business{id,name}'
    });
  }

  // Batch Operations (for efficiency)
  async batchRequest(requests: Array<{ method: string; relative_url: string; body?: any }>): Promise<any[]> {
    const batchPayload = requests.map(req => ({
      method: req.method,
      relative_url: req.relative_url,
      body: req.body ? JSON.stringify(req.body) : undefined
    }));
    
    return this.makeRequest('/', 'POST', {
      batch: JSON.stringify(batchPayload)
    });
  }
}

// Utility functions for working with Facebook data
export const formatCurrency = (amount: string, currency = 'USD'): string => {
  const num = parseFloat(amount) / 100; // Facebook returns amounts in cents
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(num);
};

export const formatPercentage = (value: string): string => {
  const num = parseFloat(value);
  return `${num.toFixed(2)}%`;
};

export const formatNumber = (value: string): string => {
  const num = parseInt(value);
  return new Intl.NumberFormat('en-US').format(num);
};

// Factory function to create Facebook API instance
export function createFacebookAPI(adAccountId?: string): FacebookMarketingAPI | null {
  try {
    return new FacebookMarketingAPI(undefined, adAccountId);
  } catch (error) {
    console.error('Failed to create Facebook API instance:', error);
    return null;
  }
}

// Default client instance (uses environment variables)
// Note: This may not be configured initially and that's okay
let facebookAPI: FacebookMarketingAPI;
try {
  facebookAPI = new FacebookMarketingAPI();
} catch (error) {
  // Create unconfigured instance for graceful degradation
  facebookAPI = createFacebookAPI()!;
}

export { facebookAPI }; 