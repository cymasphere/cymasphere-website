"use server";

import { sendEmail } from "@/utils/email";
import { createClient } from "@/utils/supabase/server";

// 🔒 SAFETY CONFIGURATION - CRITICAL FOR PREVENTING ACCIDENTAL SENDS
const DEVELOPMENT_MODE = false; // Temporarily disabled for testing
const TEST_MODE = false; // Temporarily disabled for testing

// 🔒 SAFE EMAIL WHITELIST - Only these emails will receive messages in development
const SAFE_TEST_EMAILS = [
  "ryan@cymasphere.com",
  "test@cymasphere.com",
  "demo@cymasphere.com",
];

// 🔒 TEST AUDIENCE IDENTIFIERS - Audiences that are safe to send to
const TEST_AUDIENCE_NAMES = [
  "Test Audience",
  "TEST AUDIENCE",
  "Development Test",
  "Safe Test Audience",
];

export interface SendCampaignParams {
  campaignId?: string;
  name: string;
  subject: string;
  preheader?: string; // Email preheader text shown in inbox preview
  testEmail?: string; // optional test recipient; if present, send only to this address with [TEST] prefix
  brandHeader?: string;
  audienceIds: string[]; // Updated to match new audience system
  excludedAudienceIds?: string[];
  emailElements: any[];
  scheduleType: "immediate" | "scheduled" | "timezone" | "draft";
  scheduleDate?: string;
  scheduleTime?: string;
}

export interface SendCampaignResponse {
  success: boolean;
  status?: string;
  message?: string;
  campaignId?: string;
  stats?: {
    total?: number;
    sent?: number;
    failed?: number;
    successRate?: string;
    mode?: string;
    safetyEnabled?: boolean;
    audienceCount?: number;
    excludedAudienceCount?: number;
    scheduleType?: string;
    scheduledDateTime?: string;
    sendTime?: string;
    deliveryWindow?: string;
    estimatedStartTime?: string;
    estimatedCompletionTime?: string;
  };
  results?: Array<{
    subscriberId?: string;
    email?: string;
    messageId?: string;
    sendId?: string;
    status?: string;
  }>;
  errors?: Array<{
    subscriberId?: string;
    email?: string;
    error?: string;
    sendId?: string;
    status?: string;
  }>;
  scheduledFor?: string;
  error?: string;
}

// Get real subscribers from database based on audience selection
async function getSubscribersForAudiences(
  supabase: any,
  audienceIds: string[],
  excludedAudienceIds: string[] = []
) {
  try {
    console.log("🔍 Getting subscribers for audiences:", {
      audienceIds,
      excludedAudienceIds,
    });

    if (!audienceIds || audienceIds.length === 0) {
      return [];
    }

    // Get audience details to check if they're test audiences
    // Use authenticated client (admin check already passed, RLS will allow access)
    const { data: audiences, error: audienceError } = await supabase
      .from("email_audiences")
      .select("id, name, description")
      .in("id", audienceIds);

    if (audienceError) {
      console.error("❌ Error fetching audience details:", audienceError);
      return [];
    }

    console.log("📊 Audience details:", audiences);

    // 🔒 SAFETY CHECK: Verify we're only sending to test audiences in development
    if (DEVELOPMENT_MODE || TEST_MODE) {
      const nonTestAudiences = audiences?.filter(
        (aud: any) =>
          !TEST_AUDIENCE_NAMES.some((testName) =>
            aud.name.toLowerCase().includes(testName.toLowerCase())
          )
      );

      if (nonTestAudiences && nonTestAudiences.length > 0) {
        console.error(
          "🚨 SAFETY BLOCK: Attempting to send to non-test audience in development mode"
        );
        console.error(
          "Non-test audiences:",
          nonTestAudiences.map((a: any) => a.name)
        );
        throw new Error(
          `SAFETY BLOCK: Cannot send to non-test audiences in development mode. Detected: ${nonTestAudiences
            .map((a: any) => a.name)
            .join(", ")}`
        );
      }

      console.log(
        "🔒 SAFETY: All selected audiences are test audiences, proceeding with whitelist filter"
      );
    }

    // Get subscribers directly from database (avoid API authentication issues)
    const allSubscribers = new Set();
    const subscriberDetails = new Map();

    for (const audienceId of audienceIds) {
      try {
        console.log(`🔍 Getting subscribers for audience: ${audienceId}`);

        // Get audience to check if it's static
        const { data: audience } = await supabase
          .from("email_audiences")
          .select("id, name, filters")
          .eq("id", audienceId)
          .single();

        if (!audience) {
          console.error(`❌ Audience ${audienceId} not found`);
          continue;
        }

        const filters = (audience.filters as any) || {};
        console.log(
          `📋 Audience "${audience.name}" type:`,
          filters.audience_type || "dynamic"
        );

        let subscribers = [];

        // For static audiences, get subscribers from the junction table
        if (filters.audience_type === "static") {
          console.log(
            "📋 Static audience - getting subscribers from junction table"
          );

          // Get subscribers via junction table
          const { data: relations, error: relationsError } = await supabase
            .from("email_audience_subscribers")
            .select(
              `
              subscriber_id,
              subscribers (
                id,
                email,
                status,
                created_at,
                metadata
              )
            `
            )
            .eq("audience_id", audienceId);

          if (relationsError) {
            console.error(
              `❌ Error getting relations for audience ${audienceId}:`,
              relationsError
            );
            continue;
          }

          console.log(
            `📊 Found ${relations?.length || 0} subscriber relations`
          );
          console.log(
            "📊 Raw relations data:",
            JSON.stringify(relations, null, 2)
          );

          subscribers = (relations || [])
            .map((rel: any) => rel.subscribers)
            .filter(Boolean);
          console.log(
            "📊 Extracted subscribers:",
            JSON.stringify(subscribers, null, 2)
          );
        } else {
          // For dynamic audiences, we'd need to implement filter logic here
          // For now, skip dynamic audiences in development mode for safety
          console.log(
            `⚠️ Dynamic audience skipped in development mode for safety`
          );
          continue;
        }

        console.log(
          `📧 Audience ${audienceId}: ${subscribers.length} subscribers found`
        );
        console.log(
          `📧 Subscribers:`,
          subscribers.map((s: any) => ({
            id: s.id,
            email: s.email,
            status: s.status,
          }))
        );
        console.log(
          `📧 Full subscriber details:`,
          JSON.stringify(subscribers, null, 2)
        );

        subscribers.forEach((sub: any) => {
          // 🚫 UNSUBSCRIBE FILTER: Skip INACTIVE (unsubscribed) subscribers
          if (sub.status === 'INACTIVE' || sub.status === 'unsubscribed') {
            console.log(
              `🚫 UNSUBSCRIBE: Skipping unsubscribed email: ${sub.email} (status: ${sub.status})`
            );
            return;
          }

          // 🔒 SAFETY FILTER: In development, only allow whitelisted emails
          if (DEVELOPMENT_MODE || TEST_MODE) {
            if (!SAFE_TEST_EMAILS.includes(sub.email)) {
              console.log(
                `🔒 SAFETY: Skipping non-whitelisted email: ${sub.email}`
              );
              return;
            }
          }

          console.log(`✅ Adding subscriber: ${sub.email} (${sub.status})`);
          allSubscribers.add(sub.id);

          const metadata = (sub.metadata as any) || {};
          subscriberDetails.set(sub.id, {
            id: sub.id,
            email: sub.email,
            name:
              [metadata.first_name, metadata.last_name]
                .filter(Boolean)
                .join(" ") || sub.email.split("@")[0],
            first_name: metadata.first_name,
            last_name: metadata.last_name,
            status: sub.status || "active",
          });
        });
      } catch (error) {
        console.error(
          `❌ Error fetching subscribers for audience ${audienceId}:`,
          error
        );
      }
    }

    // Remove excluded audience subscribers
    if (excludedAudienceIds && excludedAudienceIds.length > 0) {
      for (const excludedAudienceId of excludedAudienceIds) {
        try {
          // For excluded audiences, we need to get their subscribers
          // We'll use the same logic as included audiences
          const { data: excludedAudience } = await supabase
            .from("email_audiences")
            .select("id, name, filters")
            .eq("id", excludedAudienceId)
            .single();

          if (!excludedAudience) {
            continue;
          }

          const excludedFilters = (excludedAudience.filters as any) || {};
          if (excludedFilters.audience_type === "static") {
            const { data: excludedRelations } = await supabase
              .from("email_audience_subscribers")
              .select(
                `
                subscriber_id,
                subscribers (
                  id,
                  email
                )
              `
              )
              .eq("audience_id", excludedAudienceId);

            if (excludedRelations) {
              excludedRelations.forEach((rel: any) => {
                if (rel.subscribers?.id) {
                  allSubscribers.delete(rel.subscribers.id);
                  subscriberDetails.delete(rel.subscribers.id);
                }
              });
            }
          }
        } catch (error) {
          console.error(
            `❌ Error fetching excluded subscribers for audience ${excludedAudienceId}:`,
            error
          );
        }
      }
    }

    const finalSubscribers = Array.from(allSubscribers).map((id) =>
      subscriberDetails.get(id)
    );

    console.log(`🎯 Final subscriber count: ${finalSubscribers.length}`);
    console.log(
      `🎯 Final subscribers:`,
      finalSubscribers.map((s: any) => ({
        id: s?.id,
        email: s?.email,
        status: s?.status,
      }))
    );
    
    // Log unsubscribe filtering summary
    const activeSubscribers = finalSubscribers.filter(s => s?.status === 'active');
    const inactiveSubscribers = finalSubscribers.filter(s => s?.status === 'INACTIVE' || s?.status === 'unsubscribed');
    console.log(`🚫 Unsubscribe filtering summary:`, {
      total: finalSubscribers.length,
      active: activeSubscribers.length,
      inactive: inactiveSubscribers.length,
      inactiveEmails: inactiveSubscribers.map(s => s?.email)
    });
    console.log(`🎯 All subscriber IDs:`, Array.from(allSubscribers));
    console.log(
      `🎯 Subscriber details map:`,
      Object.fromEntries(subscriberDetails)
    );
    console.log(
      `🔒 Safety mode: ${DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION"}`
    );
    console.log(`🔒 Whitelisted emails: ${SAFE_TEST_EMAILS.join(", ")}`);

    return finalSubscribers;
  } catch (error) {
    console.error("❌ Error getting subscribers:", error);
    throw error;
  }
}

// Helper function to generate HTML from email elements with tracking
function generateHtmlFromElements(
  elements: any[],
  subject: string,
  campaignId?: string,
  subscriberId?: string,
  sendId?: string,
  preheader?: string
): string {
  // Helper function to rewrite links for click tracking
  const rewriteLinksForTracking = (html: string): string => {
    if (!campaignId || !subscriberId || !sendId) {
      return html; // No tracking if missing parameters
    }

    // Find and replace all href attributes
    return html.replace(/href=["']([^"']+)["']/g, (match, url) => {
      // Skip already tracked URLs
      if (url.includes("/api/email-campaigns/track/click")) {
        return match;
      }

      // Skip internal tracking URLs
      if (url.includes("unsubscribe") || url.includes("mailto:")) {
        return match;
      }

      // Always use production URL for tracking (even in development)
      // because localhost URLs won't work in external email clients
      const baseUrl =
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com"
          : "https://cymasphere.com";
      const trackingUrl = `${baseUrl}/api/email-campaigns/track/click?c=${campaignId}&u=${subscriberId}&s=${sendId}&url=${encodeURIComponent(
        url
      )}`;
      return `href="${trackingUrl}"`;
    });
  };

  // Resolve base URL for view-in-browser and other absolute links
  // In production, force cymasphere.com if env mistakenly points to localhost
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const resolvedBaseUrl = process.env.NODE_ENV === "production"
    ? (siteUrl && !siteUrl.includes("localhost") ? siteUrl : "https://cymasphere.com")
    : (siteUrl || "http://localhost:3000");

  const elementHtml = elements
    .map((element) => {
      // Debug logging to see element properties
      console.log('🎨 Generating HTML for element:', {
        id: element.id,
        type: element.type,
        fontFamily: element.fontFamily,
        fontSize: element.fontSize,
        textColor: element.textColor,
        backgroundColor: element.backgroundColor,
        paddingTop: element.paddingTop,
        paddingBottom: element.paddingBottom,
        paddingLeft: element.paddingLeft,
        paddingRight: element.paddingRight,
        fullWidth: element.fullWidth
      });
      
      const wrapperClass = element.fullWidth
        ? "full-width"
        : "constrained-width";

      // Compute per-side padding using nullish coalescing with sensible defaults
      const lrDefault = (() => {
        switch (element.type) {
          case "button":
          case "image":
            return 0;
          case "footer":
            return 0; // match visual editor (no side padding by default)
          case "brand-header":
            return 0; // brand header aligns edge-to-edge in editor
          default:
            return element.fullWidth ? 24 : 32;
        }
      })();

      const defaultTop = (() => {
        switch (element.type) {
          case "brand-header":
            return 0;
          case "footer":
            return 0; // footer defaults to 0 in editor
          default:
            return 16;
        }
      })();

      const defaultBottom = defaultTop;

      const paddingTop = (element.paddingTop ?? defaultTop) as number;
      const paddingBottom = (element.paddingBottom ?? defaultBottom) as number;
      const paddingLeft = (element.paddingLeft ?? lrDefault) as number;
      const paddingRight = (element.paddingRight ?? lrDefault) as number;
      const paddingStyle = `padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;`;

      switch (element.type) {
        case "header":
          return `<div class="${wrapperClass}" style="${paddingStyle}"><h1 style="font-size: ${element.fontSize || '2.5rem'}; color: ${element.textColor || '#333'}; margin-bottom: 1rem; text-align: ${element.textAlign || 'center'}; font-weight: ${element.fontWeight || '800'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; margin: 0 0 1rem 0;">${element.content}</h1></div>`;

        case "text":
          return `<div class="${wrapperClass}" style="${paddingStyle}"><p style="font-size: ${element.fontSize || '1rem'}; color: ${element.textColor || '#555'}; line-height: ${element.lineHeight || '1.6'}; margin: 0 0 1rem 0; text-align: ${element.textAlign || 'left'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'};">${element.content}</p></div>`;

        case "button":
          return `<div class="${wrapperClass}" style="text-align: ${element.fullWidth ? 'left' : (element.textAlign || 'center')}; margin: 2rem 0; ${paddingStyle}"><a href="${
            element.url || "#"
          }" style="display: ${element.fullWidth ? 'block' : 'inline-block'}; padding: ${element.fullWidth ? '1.25rem 2.5rem' : '1.25rem 2.5rem'}; background: ${element.gradient || element.backgroundColor || 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)'}; color: ${element.textColor || 'white'}; text-decoration: none; border-radius: ${element.fullWidth ? '0' : '50px'}; font-weight: ${element.fontWeight || '700'}; font-size: ${element.fontSize || '1rem'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); text-transform: uppercase; letter-spacing: 1px; box-shadow: ${element.fullWidth ? 'none' : '0 8px 25px rgba(108, 99, 255, 0.3)'}; min-height: 1em; width: ${element.fullWidth ? '100%' : 'auto'}; text-align: ${element.textAlign || 'center'};">${
            element.content
          }</a></div>`;

        case "image":
          return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1.5rem 0; ${paddingStyle}"><img src="${
            element.src
          }" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: ${
            element.fullWidth ? "0" : "8px"
          };" /></div>`;

        case "divider":
          return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; ${paddingStyle}"><hr style="border: none; height: 2px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); margin: 2rem 0;" /></div>`;

        case "spacer":
          return `<div class="${wrapperClass}" style="height: ${element.height || "20px"}; ${paddingStyle}"></div>`;

        case "footer":
          // Use inline SVG icons for email compatibility and professional appearance
          const iconMap: Record<string, string> = {
            facebook: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>`,
            twitter: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
            instagram: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>`,
            youtube: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>`,
            discord: `<svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418Z"/></svg>`
          };
          const socialLinksHtml = element.socialLinks && element.socialLinks.length > 0
            ? `<table role="presentation" align="center" cellspacing="0" cellpadding="0" border="0" style="margin:0 auto;">
                 <tr>
                   ${element.socialLinks
                     .map((social: any) => {
                       const key = (social.platform || '').toLowerCase();
                       const svgIcon = iconMap[key];
                       if (!svgIcon) return '';
                       return `<td align="center" valign="middle" style="padding:0 8px;"><a href="${social.url}" style="text-decoration:none; display:inline-block; color:${element.textColor || '#ffffff'}; text-align:center; vertical-align:middle;">${svgIcon}</a></td>`;
                     })
                     .join('')}
                 </tr>
               </table>`
            : "";

        return `
        <div style="font-size: ${element.fontSize || '0.8rem'}; color: ${element.textColor || '#ffffff'}; background: ${element.backgroundColor || '#363636'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.4'}; border-top: ${element.fullWidth ? 'none' : '1px solid #dee2e6'}; margin-top: 0; ${paddingStyle}">
          ${socialLinksHtml ? `<div style="margin-bottom: 16px; text-align: center;">${socialLinksHtml}</div>` : ""}
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 0 0 8px 0; text-align: center; color: ${element.textColor || '#ffffff'};">${element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`}</td>
            </tr>
          </table>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td align="center" style="padding: 0; text-align: center; color: ${element.textColor || '#ffffff'};">
                <a href="${element.unsubscribeUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com'}/unsubscribe?email={{email}}`}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none;">${element.unsubscribeText || "Unsubscribe"}</a>
                &nbsp;|&nbsp;
                <a href="${element.privacyUrl || "https://cymasphere.com/privacy-policy"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none;">${element.privacyText || "Privacy Policy"}</a>
                &nbsp;|&nbsp;
                <a href="${element.termsUrl || "https://cymasphere.com/terms-of-service"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none;">${element.termsText || "Terms of Service"}</a>
              </td>
            </tr>
          </table>
        </div>`;

        case "brand-header":
          // Use a more reliable image source and Gmail-compatible structure
          const logoUrl = "https://cymasphere.com/images/cm-logo.png";
          // Force brand header to align with content width
          const headerWrapperClass = "constrained-width";

          return `<div class="${headerWrapperClass} brand-header" style="background: ${
            element.backgroundColor ||
            "linear-gradient(135deg, #1a1a1a 0%, #121212 100%)"
          }; ${paddingStyle} text-align: center; display: flex; align-items: center; justify-content: center; min-height: 60px; border-radius: 0; box-shadow: none; margin: 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
              <tr>
                <td align="center" style="padding: 0;">
                  <img src="${logoUrl}" alt="Cymasphere Logo" style="max-width: 300px; width: 100%; height: auto; object-fit: contain; display: block; margin: 0 auto; padding: 0; border: 0; outline: none;" />
                </td>
              </tr>
            </table>
          </div>`;

        default:
          return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; ${paddingStyle}">${
            element.content || ""
          }</div>`;
      }
    })
    .join("");

  // Base HTML template with Gmail-compatible structure
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    
    <!-- Google Fonts for custom typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Roboto:wght@100;300;400;500;700;900&family=Lato:wght@100;300;400;700;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Source+Sans+Pro:wght@200;300;400;600;700;900&family=Nunito:wght@200;300;400;500;600;700;800;900&family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Oswald:wght@200;300;400;500;600;700&family=PT+Sans:wght@400;700&family=Ubuntu:wght@300;400;500;700&family=Noto+Sans:wght@100;200;300;400;500;600;700;800;900&family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
        /* Body styles moved to inline for email client compatibility */
        
        /* Ensure emojis render in color */
        * {
            -webkit-text-fill-color: initial;
            color: inherit;
        }
        
        /* Force emoji color rendering - multiple approaches */
        emoji, span[role="img"], .emoji {
            -webkit-text-fill-color: initial !important;
            color: initial !important;
        }
        
        /* Remove any filters that might be making emojis grey */
        * {
            filter: none !important;
        }
        
        /* Ensure text rendering is optimal for emojis */
        body {
            text-rendering: optimizeLegibility;
            -webkit-font-feature-settings: "liga" 1, "kern" 1;
            font-feature-settings: "liga" 1, "kern" 1;
        }
        
        /* Force emoji color rendering with higher specificity */
        p, div, span, h1, h2, h3, h4, h5, h6 {
            -webkit-text-fill-color: initial;
            color: inherit;
        }
        
        /* Brand header specific styling - ensure it's not affected by resets */
        .brand-header {
            color: inherit !important;
            -webkit-text-fill-color: inherit !important;
        }
        
        .brand-header span {
            color: inherit !important;
            -webkit-text-fill-color: inherit !important;
        }
        
        /* Ensure emojis are not affected by any color overrides */
        ::-webkit-text-fill-color {
            -webkit-text-fill-color: initial !important;
        }
        
        /* Reset any inherited CSS variables that might affect colors */
        :root {
            --text: initial !important;
            --text-secondary: initial !important;
            --primary: initial !important;
            --accent: initial !important;
        }
        
        /* Force emoji rendering with system emoji font */
        @font-face {
            font-family: 'Apple Color Emoji';
            src: local('Apple Color Emoji');
        }
        
        @font-face {
            font-family: 'Segoe UI Emoji';
            src: local('Segoe UI Emoji');
        }
        
        /* Apply emoji fonts to all text except brand header */
        *:not(.brand-header):not(.brand-header *) {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif !important;
        }
        
        /* Brand header specific styles - override the reset */
        .brand-header {
            font-family: 'Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif !important;
        }
        
        .brand-header .cyma-text {
            background: linear-gradient(90deg, #6c63ff, #4ecdc4) !important;
            -webkit-background-clip: text !important;
            -webkit-text-fill-color: transparent !important;
            background-clip: text !important;
            color: transparent !important;
        }
        
        .brand-header .sphere-text {
            color: #ffffff !important;
            -webkit-text-fill-color: #ffffff !important;
        }
        
        /* Container styles moved to inline for email client compatibility */
        
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            background-color: #f8f9fa;
            color: #666666;
            border-top: 1px solid #e9ecef;
        }
        
        .footer a {
            color: #6c63ff;
            text-decoration: none;
        }
        
        .full-width {
            width: 100%;
            margin: 0;
            padding: 0;
            border-radius: 0;
        }
        
        /* Override parent padding for full-width elements */
        .full-width {
            margin-left: -30px;
            margin-right: -30px;
            padding-left: 30px;
            padding-right: 30px;
            width: calc(100% + 60px);
        }
        
        /* Footer specific styling to span full width of white container */
        .footer-full-width {
            width: 100%;
            margin: 0;
            padding: 2rem;
            box-sizing: border-box;
        }
        
        .constrained-width {
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            padding: 0 20px;
            box-sizing: border-box;
        }
    </style>
</head>
<body style="margin: 0; padding: 20px; background-color: #f7f7f7; font-family: Arial, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale;">
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        <!-- Preheader Section -->
        <div style="padding: 15px 20px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef;">
            <div style="display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #666;">
                <div style="color: #333; font-weight: 500;">
                    ${preheader || 'Cymasphere - Your Music Production Journey'}
                </div>
                <div style="text-align: right; margin-left: auto;">
                    <a href="${resolvedBaseUrl}/email-preview?c=${campaignId || 'preview'}" style="color: #6c63ff; text-decoration: underline; font-weight: 500;">View in browser</a>
                </div>
            </div>
        </div>
        
        ${elementHtml}
    </div>
</body>
</html>`;

  // Add tracking pixel if we have tracking parameters
  if (campaignId && subscriberId && sendId) {
    // Always use production URL for tracking pixels (even in development)
    // because localhost URLs won't work in external email clients
    const baseUrl =
      process.env.NODE_ENV === "production"
        ? process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com"
        : "https://cymasphere.com";
    const trackingPixel = `
    <!-- Email Open Tracking -->
    <img src="${baseUrl}/api/email-campaigns/track/open?c=${campaignId}&u=${subscriberId}&s=${sendId}" width="1" height="1" style="display:block;border:0;margin:0;padding:0;" alt="" />`;

    html += trackingPixel;
  }

  html += `
</body>
</html>`;

  // Rewrite links for click tracking
  html = rewriteLinksForTracking(html);

  return html;
}

// Helper function to generate text content from email elements
function generateTextFromElements(elements: any[]): string {
  const textContent = elements
    .map((element) => {
      switch (element.type) {
        case "header":
          return `${element.content}\n${"=".repeat(element.content.length)}\n`;
        case "text":
          return `${element.content}\n`;
        case "button":
          return `${element.content}: ${element.url || "#"}\n`;
        case "image":
          return `[Image: ${element.src}]\n`;
        case "divider":
          return `${"─".repeat(50)}\n`;
        case "spacer":
          return "\n";
        case "footer":
          const socialText = element.socialLinks && element.socialLinks.length > 0
            ? element.socialLinks
                .map((social: any) => `${social.platform}: ${social.url}`)
                .join(" | ")
            : "";
          return `\n${"─".repeat(50)}\n${socialText ? socialText + "\n" : ""}${
            element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`
          }\n${element.unsubscribeText || "Unsubscribe"}: ${
            element.unsubscribeUrl || "#unsubscribe"
          } | ${element.privacyText || "Privacy Policy"}: ${
            element.privacyUrl || "#privacy"
          } | ${element.termsText || "Terms of Service"}: ${
            element.termsUrl || "https://cymasphere.com/terms-of-service"
          }\n`;
        case "brand-header":
          return `[LOGO] Cymasphere\n${"=".repeat(10)}\n`;
        default:
          return `${element.content || ""}\n`;
      }
    })
    .join("\n");

  return textContent.trim();
}

// Helper function to personalize content with subscriber data
function personalizeContent(content: string, subscriber: any): string {
  const metadata = subscriber.metadata || {};
  const firstName =
    metadata.first_name ||
    subscriber.first_name ||
    subscriber.name?.split(" ")[0] ||
    "there";
  const lastName =
    metadata.last_name ||
    subscriber.last_name ||
    subscriber.name?.split(" ").slice(1).join(" ") ||
    "";
  const fullName =
    [firstName, lastName].filter(Boolean).join(" ") ||
    subscriber.name ||
    "there";

  return content
    .replace(/\{\{firstName\}\}/g, firstName)
    .replace(/\{\{lastName\}\}/g, lastName)
    .replace(/\{\{fullName\}\}/g, fullName)
    .replace(/\{\{email\}\}/g, subscriber.email)
    .replace(/\{\{subscription\}\}/g, metadata.subscription || "none")
    .replace(
      /\{\{lifetimePurchase\}\}/g,
      metadata.lifetime_purchase || metadata.lifetimePurchase || "false"
    )
    .replace(
      /\{\{companyName\}\}/g,
      metadata.company_name || metadata.companyName || ""
    )
    .replace(
      /\{\{unsubscribeUrl\}\}/g,
      `${
        process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com"
      }/unsubscribe?email=${encodeURIComponent(subscriber.email)}`
    )
    .replace(
      /\{\{currentDate\}\}/g,
      new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
}

/**
 * Send an email campaign (admin only)
 */
export async function sendCampaign(
  params: SendCampaignParams
): Promise<SendCampaignResponse> {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      throw new Error('Authentication required');
    }

    // Check if user is admin
    const { data: adminCheck } = await supabase
      .from('admins')
      .select('id')
      .eq('user', user.id)
      .single();

    if (!adminCheck) {
      throw new Error('Admin access required');
    }

    const {
      campaignId,
      name,
      subject,
      preheader,
      testEmail,
      brandHeader,
      audienceIds,
      excludedAudienceIds = [],
      emailElements,
      scheduleType,
      scheduleDate,
      scheduleTime,
    } = params;

    console.log("📧 Send campaign request:", {
      name,
      subject,
      audienceIds,
      excludedAudienceIds,
      scheduleType,
      emailElementsCount: emailElements?.length || 0,
      emailElementsPreview: emailElements?.slice(0, 2) || "undefined",
      developmentMode: DEVELOPMENT_MODE,
      testMode: TEST_MODE,
    });

    // 🔍 DEBUG: Check padding values in emailElements
    if (emailElements && emailElements.length > 0) {
      console.log("🎯 PADDING DEBUG - First element padding values:", {
        id: emailElements[0].id,
        type: emailElements[0].type,
        paddingTop: emailElements[0].paddingTop,
        paddingBottom: emailElements[0].paddingBottom,
        paddingLeft: emailElements[0].paddingLeft,
        paddingRight: emailElements[0].paddingRight,
        fullWidth: emailElements[0].fullWidth,
        allKeys: Object.keys(emailElements[0])
      });
    }

    // 🎯 TEST EMAIL MODE: If testEmail is provided, send a single email to that address (process FIRST)
    if (testEmail && typeof testEmail === 'string') {
      const emailTrimmed = testEmail.trim();
      const isValid = /.+@.+\..+/.test(emailTrimmed);
      if (!isValid) {
        throw new Error('Invalid test email address');
      }

      const subjectWithTest = subject.startsWith('[TEST]') ? subject : `[TEST] ${subject}`;
      // Ensure we have a real campaign id for proper view-in-browser links
      let realCampaignIdForTest = campaignId && /^[0-9a-f-]{36}$/i.test(campaignId) ? campaignId : undefined;

      if (!realCampaignIdForTest) {
        try {
          // Create a placeholder campaign to obtain a UUID (status draft)
          const { data: newCampaign, error: newCampErr } = await supabase
            .from("email_campaigns")
            .insert({
              name: name || "Test Campaign",
              subject: subjectWithTest,
              sender_name: "Cymasphere",
              sender_email: "support@cymasphere.com",
              status: "draft"
            })
            .select("id")
            .single();

          if (newCampErr) {
            console.warn("⚠️ Could not create placeholder campaign for test:", newCampErr.message);
          } else {
            realCampaignIdForTest = newCampaign.id;
          }
        } catch (e) {
          console.warn("⚠️ Exception creating placeholder campaign for test:", e);
        }
      }

      const textContentForTest = generateTextFromElements(emailElements);
      const baseHtmlContentForTest = generateHtmlFromElements(
        emailElements,
        subjectWithTest,
        realCampaignIdForTest,
        undefined,
        undefined,
        preheader
      );

      const result = await sendEmail({
        to: emailTrimmed,
        subject: subjectWithTest,
        html: baseHtmlContentForTest,
        text: textContentForTest,
        from: "support@cymasphere.com",
      });

      if (result.success) {
        // Test email sent successfully - don't overwrite the original campaign HTML
        // The original campaign data with embedded elements JSON should be preserved
        return {
          success: true,
          status: 'test-sent',
          message: `Test email sent to ${emailTrimmed}`,
          results: [{ email: emailTrimmed, status: 'sent', messageId: result.messageId }],
          campaignId: realCampaignIdForTest
        };
      }

      throw new Error(result.error || 'Failed to send test email');
    }

    // Validate required fields (skip when testEmail is used)
    if (
      !name ||
      !subject ||
      !audienceIds ||
      audienceIds.length === 0 ||
      !emailElements
    ) {
      console.error("❌ Missing required fields:", {
        name: !!name,
        subject: !!subject,
        audienceIds: !!audienceIds && audienceIds.length > 0,
        emailElements: !!emailElements,
      });
      throw new Error(
        "Missing required campaign fields (name, subject, audiences, content)"
      );
    }

    // 🔒 SAFETY WARNING for development mode
    if (DEVELOPMENT_MODE || TEST_MODE) {
      console.log(
        "🔒 SAFETY MODE ACTIVE - Emails restricted to whitelist:",
        SAFE_TEST_EMAILS
      );
    }

    // If it's a draft, just save and return
    if (scheduleType === "draft") {
      return {
        success: true,
        message: "Campaign saved as draft",
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "draft",
      };
    }

    // If scheduled for later, save schedule and return
    if (scheduleType === "scheduled" && scheduleDate && scheduleTime) {
      // If we have a campaignId, get the scheduled_at time from the already-saved campaign
      let scheduledDateTime;

      if (campaignId) {
        try {
          // Get the campaign's scheduled_at value (which includes proper timezone)
          const { data: campaign, error } = await supabase
            .from("email_campaigns")
            .select("scheduled_at")
            .eq("id", campaignId)
            .single();

          if (error) {
            console.error("Error fetching campaign scheduled_at:", error);
            // Fallback to reconstructing from date/time
            scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
          } else if (campaign.scheduled_at) {
            scheduledDateTime = new Date(campaign.scheduled_at);
            console.log("📅 Using saved scheduled_at from campaign:", {
              campaignId,
              savedScheduledAt: campaign.scheduled_at,
              parsedDateTime: scheduledDateTime.toString(),
            });
          } else {
            // No scheduled_at in campaign, fallback to reconstructing
            scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
          }
        } catch (error) {
          console.error("Error fetching campaign:", error);
          // Fallback to reconstructing from date/time
          scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
        }
      } else {
        // No campaignId, reconstruct from date/time
        scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}:00`);
      }

      const currentTime = new Date();

      console.log("📅 Validating scheduled time:", {
        scheduleDate,
        scheduleTime,
        scheduledDateTime: scheduledDateTime.toString(),
        scheduledUTC: scheduledDateTime.toISOString(),
        currentTime: currentTime.toString(),
        currentUTC: currentTime.toISOString(),
        timeDifference: scheduledDateTime.getTime() - currentTime.getTime(),
        isInFuture: scheduledDateTime > currentTime,
      });

      // Add a 1-minute buffer to account for processing time and minor clock differences
      const bufferTime = new Date(currentTime.getTime() + 60000); // 1 minute buffer

      if (scheduledDateTime <= bufferTime) {
        throw new Error("Scheduled time must be at least 1 minute in the future");
      }

      // ✅ Campaign is now stored and will be processed by the cron job at /api/email-campaigns/process-scheduled
      console.log(
        `📅 Campaign "${name}" scheduled for: ${scheduledDateTime.toLocaleString()}`
      );
      console.log(
        `📊 Target audiences: ${audienceIds.length} selected, ${
          excludedAudienceIds?.length || 0
        } excluded`
      );

      return {
        success: true,
        message: `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "scheduled",
        scheduledFor: scheduledDateTime.toISOString(),
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: "scheduled",
          scheduledDateTime: scheduledDateTime.toLocaleString(),
        },
      };
    }

    // If scheduled by timezone, handle timezone-based delivery
    if (scheduleType === "timezone" && scheduleTime) {
      const deliveryWindow = scheduleDate || "24hours"; // scheduleDate stores delivery window for timezone
      const sendTime = scheduleTime; // e.g., "09:00"

      console.log(
        `🌍 Campaign "${name}" scheduled for timezone-based delivery:`
      );
      console.log(
        `   ⏰ Send time: ${sendTime} (in each subscriber's timezone)`
      );
      console.log(`   📅 Delivery window: ${deliveryWindow}`);
      console.log(
        `   📊 Target audiences: ${audienceIds.length} selected, ${
          excludedAudienceIds?.length || 0
        } excluded`
      );

      return {
        success: true,
        message: `Campaign scheduled for timezone-based delivery at ${sendTime} in each subscriber's timezone`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: "scheduled",
        scheduleType: "timezone",
        stats: {
          audienceCount: audienceIds.length,
          excludedAudienceCount: excludedAudienceIds?.length || 0,
          scheduleType: "timezone",
          sendTime: sendTime,
          deliveryWindow: deliveryWindow,
          estimatedStartTime: new Date().toLocaleString(),
          estimatedCompletionTime: new Date(
            Date.now() +
              (deliveryWindow === "6hours"
                ? 6
                : deliveryWindow === "12hours"
                ? 12
                : 24) *
                60 *
                60 *
                1000
          ).toLocaleString(),
        },
      };
    }

    // Get real subscribers from database
    console.log("🔍 Fetching subscribers from database...");
    const targetSubscribers = await getSubscribersForAudiences(
      supabase,
      audienceIds,
      excludedAudienceIds
    );

    if (targetSubscribers.length === 0) {
      const errorMessage =
        DEVELOPMENT_MODE || TEST_MODE
          ? `No subscribers found for the selected audiences. In ${
              DEVELOPMENT_MODE ? "development" : "test"
            } mode, only whitelisted emails (${SAFE_TEST_EMAILS.join(
              ", "
            )}) are allowed.`
          : "No active subscribers found for the selected audience";

      throw new Error(errorMessage);
    }

    // Create a real campaign record for immediate sends (if not already provided)
    let realCampaignId = campaignId;

    // For immediate sends, create a campaign record to get a proper UUID
    if (
      scheduleType === "immediate" &&
      (!campaignId || !campaignId.match(/^[0-9a-f-]{36}$/i))
    ) {
      console.log("📝 Creating campaign record for immediate send...");

      // Use authenticated client (admin check already passed, RLS will allow access)
      const { data: newCampaign, error: campaignError } = await supabase
        .from("email_campaigns")
        .insert({
          name,
          subject,
          sender_name: "Cymasphere",
          sender_email: "support@cymasphere.com",
          html_content: generateHtmlFromElements(
            emailElements,
            subject,
            undefined,
            undefined,
            undefined,
            preheader
          ),
          text_content: generateTextFromElements(emailElements),
          status: "sending",
          // created_by omitted - will use default or null
        })
        .select("id")
        .single();

      if (campaignError) {
        console.error(
          "❌ Failed to create campaign record:",
          campaignError.message
        );
        throw new Error("Failed to create campaign record");
      }

      realCampaignId = newCampaign.id;
      console.log("✅ Created campaign record with UUID:", realCampaignId);
    }

    // Generate base HTML and text content (without tracking yet)
    const baseHtmlContent = generateHtmlFromElements(
      emailElements,
      subject,
      undefined,
      undefined,
      undefined,
      preheader
    );
    const textContent = generateTextFromElements(emailElements);

    console.log(
      `🚀 Starting to send campaign "${name}" to ${targetSubscribers.length} subscribers...`
    );

    // 🔒 FINAL SAFETY CHECK before sending
    if (DEVELOPMENT_MODE || TEST_MODE) {
      const unsafeEmails = targetSubscribers.filter(
        (sub) => !SAFE_TEST_EMAILS.includes(sub.email)
      );
      if (unsafeEmails.length > 0) {
        throw new Error(
          `SAFETY BLOCK: Found non-whitelisted emails: ${unsafeEmails
            .map((s) => s.email)
            .join(", ")}`
        );
      }
    }

    // Send emails to all subscribers
    const results: Array<{
      subscriberId?: string;
      email?: string;
      messageId?: string;
      sendId?: string;
      status?: string;
    }> = [];
    const errors: Array<{
      subscriberId?: string;
      email?: string;
      error?: string;
      sendId?: string;
      status?: string;
    }> = [];

    console.log(`\n🚀 Starting email send process...`);
    console.log(`📧 Target subscribers: ${targetSubscribers.length}`);
    targetSubscribers.forEach((sub, i) => {
      console.log(
        `   ${i + 1}. ${sub.email} (ID: ${sub.id}, Status: ${sub.status})`
      );
    });

    for (const subscriber of targetSubscribers) {
      try {
        // Create email_sends record first to get tracking ID
        // Use authenticated client (admin check already passed, RLS will allow access)
        const { data: sendRecord, error: sendError } = await supabase
          .from("email_sends")
          .insert({
            campaign_id: realCampaignId,
            subscriber_id: subscriber.id,
            email: subscriber.email,
            status: "pending",
          } as any)
          .select("id")
          .single();

        if (sendError || !sendRecord) {
          console.error(
            `❌ Error creating send record for ${subscriber.email}:`,
            sendError
          );
          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: "Failed to create send record",
            status: "failed",
          });
          continue;
        }

        const sendId = sendRecord.id;
        console.log(
          `📝 Created send record: ${sendId} for ${subscriber.email}`
        );

        // Generate tracking-enabled HTML content
        console.log(`🔧 Generating tracked HTML for ${subscriber.email}:`, {
          emailElementsCount: emailElements.length,
          campaignId: realCampaignId,
          subscriberId: subscriber.id,
          sendId,
          elementsPreview: emailElements.slice(0, 2),
        });

        const trackedHtmlContent = generateHtmlFromElements(
          emailElements,
          subject,
          realCampaignId,
          subscriber.id,
          sendId,
          preheader
        );

        console.log(`📧 Generated tracked HTML for ${subscriber.email}:`, {
          length: trackedHtmlContent.length,
          hasTrackingPixel: trackedHtmlContent.includes(
            "/api/email-campaigns/track/open"
          ),
          hasTrackingParams: trackedHtmlContent.includes(`c=${realCampaignId}`),
          lastChars: trackedHtmlContent.slice(-200),
        });

        // Personalize content
        const personalizedHtml = personalizeContent(
          trackedHtmlContent,
          subscriber
        );
        const personalizedText = personalizeContent(textContent, subscriber);
        const personalizedSubject = personalizeContent(subject, subscriber);

        console.log(`\n📧 Processing subscriber: ${subscriber.email}`);
        console.log(`   - Send ID: ${sendId}`);
        console.log(`   - Personalized subject: "${personalizedSubject}"`);
        console.log(
          `   - HTML content length: ${personalizedHtml.length} chars`
        );
        console.log(
          `   - Text content length: ${personalizedText.length} chars`
        );
        console.log(
          `   - Mode: ${DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION"}`
        );

        console.log(`📤 Calling sendEmail function...`);
        const result = await sendEmail({
          to: subscriber.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          from: "support@cymasphere.com",
        });

        console.log(`📬 sendEmail result:`, JSON.stringify(result, null, 2));

        if (result.success) {
          // Update send record to sent status with message_id
          await supabase
            .from("email_sends")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              message_id: result.messageId,
            })
            .eq("id", sendId);

          results.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            messageId: result.messageId,
            sendId: sendId,
            status: "sent",
          });
          console.log(`✅ SUCCESS: Email sent to ${subscriber.email}`);
          console.log(`   - Message ID: ${result.messageId}`);
          console.log(`   - Send ID: ${sendId}`);
        } else {
          // Update send record to failed status
          await supabase
            .from("email_sends")
            .update({
              status: "failed",
              error_message: result.error,
            })
            .eq("id", sendId);

          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: result.error,
            sendId: sendId,
            status: "failed",
          });
          console.error(`❌ FAILED: Could not send to ${subscriber.email}`);
          console.error(`   - Error: ${result.error}`);
          console.error(`   - Full result:`, result);
        }

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error";
        errors.push({
          subscriberId: subscriber.id,
          email: subscriber.email,
          error: errorMessage,
          status: "failed",
        });
        console.error(`❌ Exception sending to ${subscriber.email}:`, error);
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;
    const totalCount = targetSubscribers.length;

    // Update campaign statistics AND store the tracked HTML template
    if (realCampaignId) {
      try {
        // Generate a sample tracked HTML template
        const sampleSubscriber = targetSubscribers[0];
        let trackedHtmlTemplate = null;
        let sampleSendId = null;

        if (sampleSubscriber) {
          // Use existing send ID if available, otherwise generate a placeholder ID for template
          sampleSendId =
            results.find((r) => r.subscriberId === sampleSubscriber.id)
              ?.sendId || "template-placeholder-id";
          trackedHtmlTemplate = generateHtmlFromElements(
            emailElements,
            subject,
            realCampaignId,
            sampleSubscriber.id,
            sampleSendId,
            preheader
          );
        }

        if (trackedHtmlTemplate) {
          // Use authenticated client (admin check already passed, RLS will allow access)
          await supabase
            .from("email_campaigns")
            .update({
              emails_sent: successCount,
              total_recipients: totalCount,
              sent_at: successCount > 0 ? new Date().toISOString() : null,
              status: successCount > 0 ? "sent" : "draft",
              html_content: trackedHtmlTemplate, // Store the tracked HTML template
            })
            .eq("id", realCampaignId);

          console.log(
            `📊 Updated campaign stats: ${successCount} sent, ${totalCount} total`
          );
          console.log(
            `📧 Updated campaign with tracked HTML template (${trackedHtmlTemplate.length} chars)`
          );
        } else {
          // Fallback: update without HTML if we can't generate template
          // Use authenticated client (admin check already passed, RLS will allow access)
          await supabase
            .from("email_campaigns")
            .update({
              emails_sent: successCount,
              total_recipients: totalCount,
              sent_at: successCount > 0 ? new Date().toISOString() : null,
              status: successCount > 0 ? "sent" : "draft",
            })
            .eq("id", realCampaignId);

          console.log(
            `📊 Updated campaign stats: ${successCount} sent, ${totalCount} total (no HTML update)`
          );
        }
      } catch (error) {
        console.error("❌ Error updating campaign stats:", error);
      }
    }

    console.log(`📊 Campaign "${name}" completed:`);
    console.log(`   ✅ Successful: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${errorCount}/${totalCount}`);
    console.log(
      `   🔒 Mode: ${DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION"}`
    );

    return {
      success: true,
      message: `Campaign sent successfully to ${successCount} out of ${totalCount} subscribers`,
      campaignId: realCampaignId,
      stats: {
        total: totalCount,
        sent: successCount,
        failed: errorCount,
        successRate: ((successCount / totalCount) * 100).toFixed(1),
        mode: DEVELOPMENT_MODE ? "DEVELOPMENT" : "PRODUCTION",
        safetyEnabled: DEVELOPMENT_MODE || TEST_MODE,
      },
      results,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("❌ Error in send campaign:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error sending campaign";

    return {
      success: false,
      error: errorMessage,
    };
  }
}

