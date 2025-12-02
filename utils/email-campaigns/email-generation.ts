/**
 * Shared utility functions for generating email HTML and text content
 * Extracted from app/api/email-campaigns/send/route.ts
 */

/**
 * Generate HTML from email elements with tracking
 */
export function generateHtmlFromElements(
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
      // Use both inline style and table cell padding for maximum email client compatibility
      // Gmail often strips !important, so we use table cells as a fallback
      const paddingStyle = `padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px !important;`;
      const cellPaddingStyle = `padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;`;

      switch (element.type) {
        case "header":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="${cellPaddingStyle}">
                <h1 style="font-size: ${element.fontSize || '2.5rem'}; color: ${element.textColor || '#333'}; margin: 0; text-align: ${element.textAlign || 'center'}; font-weight: ${element.fontWeight || '800'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; padding: 0;">${element.content}</h1>
              </td>
            </tr>
          </table>`;

        case "text":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="${cellPaddingStyle}">
                <p style="font-size: ${element.fontSize || '1rem'}; color: ${element.textColor || '#555'}; line-height: ${element.lineHeight || '1.6'}; margin: 0; text-align: ${element.textAlign || 'left'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; padding: 0;">${element.content}</p>
              </td>
            </tr>
          </table>`;

        case "button":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="text-align: ${element.fullWidth ? 'left' : (element.textAlign || 'center')}; ${cellPaddingStyle}">
                <a href="${element.url || "#"}" style="display: ${element.fullWidth ? 'block' : 'inline-block'}; padding: ${element.fullWidth ? '1.25rem 2.5rem' : '1.25rem 2.5rem'}; background: ${element.gradient || element.backgroundColor || 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)'}; color: ${element.textColor || 'white'}; text-decoration: none; border-radius: ${element.fullWidth ? '0' : '50px'}; font-weight: ${element.fontWeight || '700'}; font-size: ${element.fontSize || '1rem'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); text-transform: uppercase; letter-spacing: 1px; box-shadow: ${element.fullWidth ? 'none' : '0 8px 25px rgba(108, 99, 255, 0.3)'}; min-height: 1em; width: ${element.fullWidth ? '100%' : 'auto'}; text-align: ${element.textAlign || 'center'}; margin: 0;">${
            element.content
          }</a>
              </td>
            </tr>
          </table>`;

        case "image":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; ${cellPaddingStyle}">
                <img src="${element.src}" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: ${
            element.fullWidth ? "0" : "8px"
          }; display: block; margin: 0;" />
              </td>
            </tr>
          </table>`;

        case "divider":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; ${cellPaddingStyle}">
                <hr style="border: none; height: 2px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); margin: 0;" />
              </td>
            </tr>
          </table>`;

        case "spacer":
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="height: ${element.height || "20px"}; ${cellPaddingStyle} line-height: ${element.height || "20px"}; font-size: 1px;">&nbsp;</td>
            </tr>
          </table>`;

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

        // Footer font size should default to 0.8rem to match editor, but allow override
        const footerFontSize = element.fontSize || '0.8rem';
        return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; background: ${element.backgroundColor || '#363636'}; border-top: ${element.fullWidth ? 'none' : '1px solid #dee2e6'};">
          <tr>
            <td style="font-size: ${footerFontSize}; color: ${element.textColor || '#ffffff'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.4'}; ${cellPaddingStyle}">
              ${socialLinksHtml ? `<div style="margin-bottom: 16px; text-align: center; font-size: ${footerFontSize};">${socialLinksHtml}</div>` : ""}
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0 0 8px 0; text-align: center; color: ${element.textColor || '#ffffff'}; font-size: ${footerFontSize};">${element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`}</td>
                </tr>
              </table>
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0; text-align: center; color: ${element.textColor || '#ffffff'}; font-size: ${footerFontSize};">
                    <a href="${element.unsubscribeUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com'}/unsubscribe?email={{email}}`}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none; font-size: ${footerFontSize};">${element.unsubscribeText || "Unsubscribe"}</a>
                    &nbsp;|&nbsp;
                    <a href="${element.privacyUrl || "https://cymasphere.com/privacy-policy"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none; font-size: ${footerFontSize};">${element.privacyText || "Privacy Policy"}</a>
                    &nbsp;|&nbsp;
                    <a href="${element.termsUrl || "https://cymasphere.com/terms-of-service"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none; font-size: ${footerFontSize};">${element.termsText || "Terms of Service"}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;

        case "brand-header":
          // Use a more reliable image source and Gmail-compatible structure
          const logoUrl = "https://cymasphere.com/images/cm-logo.png";
          // Force brand header to align with content width
          const headerWrapperClass = "constrained-width";

          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; background: ${
            element.backgroundColor ||
            "linear-gradient(135deg, #1a1a1a 0%, #121212 100%)"
          };">
            <tr>
              <td class="${headerWrapperClass} brand-header" style="${cellPaddingStyle} text-align: center; min-height: 60px; vertical-align: middle;">
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                  <tr>
                    <td align="center" style="padding: 0;">
                      <img src="${logoUrl}" alt="Cymasphere Logo" style="max-width: 300px; width: 100%; height: auto; object-fit: contain; display: block; margin: 0 auto; padding: 0; border: 0; outline: none;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>`;

        default:
          return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
            <tr>
              <td class="${wrapperClass}" style="color: #555; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; ${cellPaddingStyle}">
                ${element.content || ""}
              </td>
            </tr>
          </table>`;
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
            border-radius: 0;
        }
        
        /* Override parent padding for full-width elements - but don't override top/bottom padding */
        .full-width {
            margin-left: -30px;
            margin-right: -30px;
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

/**
 * Generate text content from email elements
 */
export function generateTextFromElements(elements: any[]): string {
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

/**
 * Personalize content with subscriber data
 */
export function personalizeContent(content: string, subscriber: any): string {
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

