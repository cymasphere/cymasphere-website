/**
 * Email tracking utilities for injecting tracking pixels and rewriting links
 */

/**
 * Inject tracking pixel and rewrite links in HTML content
 */
export function injectEmailTracking(
  htmlContent: string, 
  campaignId: string, 
  subscriberId: string, 
  sendId: string
): string {
  console.log('🔧 Injecting email tracking:', { campaignId, subscriberId, sendId });

  if (!campaignId || !subscriberId || !sendId) {
    console.log('⚠️ Missing tracking parameters, returning original content');
    return htmlContent; // Return original content if tracking parameters missing
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com';
  console.log('🔧 Using base URL:', baseUrl);

  // Step 1: Rewrite links for click tracking
  let trackedHtml = rewriteLinksForTracking(htmlContent, campaignId, subscriberId, sendId, baseUrl);

  // Step 2: Add tracking pixel
  const trackingPixel = `
    <!-- Email Open Tracking -->
    <img src="${baseUrl}/api/email-campaigns/track/open?c=${campaignId}&u=${subscriberId}&s=${sendId}" width="1" height="1" style="display:none;border:0;outline:0;" alt="" />`;

  console.log('📧 Generated tracking pixel:', trackingPixel.trim());

  // Try to insert before closing body tag, fallback to append
  if (trackedHtml.includes('</body>')) {
    trackedHtml = trackedHtml.replace('</body>', `${trackingPixel}\n</body>`);
    console.log('✅ Tracking pixel inserted before </body>');
  } else {
    trackedHtml += trackingPixel;
    console.log('✅ Tracking pixel appended to end of HTML');
  }

  // Log a sample of the final HTML to verify tracking was added
  const htmlSample = trackedHtml.slice(-500); // Last 500 characters
  console.log('📧 Final HTML sample (last 500 chars):', htmlSample);

  return trackedHtml;
}

/**
 * Rewrite all links in HTML for click tracking
 */
function rewriteLinksForTracking(
  html: string, 
  campaignId: string, 
  subscriberId: string, 
  sendId: string,
  baseUrl: string
): string {
  // Find and replace all href attributes
  return html.replace(/href=["']([^"']+)["']/g, (match, url) => {
    // Skip already tracked URLs
    if (url.includes('/api/email-campaigns/track/click')) {
      return match;
    }
    
    // Skip internal tracking URLs and special links
    if (url.includes('unsubscribe') || url.includes('mailto:') || url.startsWith('#')) {
      return match;
    }
    
    // Create tracking URL
    const trackingUrl = `${baseUrl}/api/email-campaigns/track/click?c=${campaignId}&u=${subscriberId}&s=${sendId}&url=${encodeURIComponent(url)}`;
    return `href="${trackingUrl}"`;
  });
}

/**
 * Create a unique send record for tracking
 */
export async function createSendRecord(
  campaignId: string, 
  subscriberId: string, 
  recipientEmail: string,
  supabase: any
): Promise<string | null> {
  try {
    console.log('📝 Creating send record:', { campaignId, subscriberId, recipientEmail });

    const sendRecord = {
      campaign_id: campaignId,
      subscriber_id: subscriberId,
      recipient_email: recipientEmail,
      sent_at: new Date().toISOString(),
      status: 'sent'
    };

    console.log('📝 Send record data:', sendRecord);

    const { data, error } = await supabase
      .from('email_sends')
      .insert(sendRecord)
      .select('id')
      .single();

    if (error) {
      console.error('❌ Error creating send record:', {
        error: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      
      // Try to continue without send record for now
      console.log('⚠️ Continuing without send record - using fallback ID');
      return `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    console.log('✅ Send record created successfully:', data.id);
    return data.id;
  } catch (error) {
    console.error('❌ Exception creating send record:', error);
    
    // Return a fallback ID so tracking can still work
    const fallbackId = `fallback-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log('⚠️ Using fallback send ID:', fallbackId);
    return fallbackId;
  }
} 