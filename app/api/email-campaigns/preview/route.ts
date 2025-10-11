import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('c');
    console.log('[PreviewAPI] Request received', { url: request.url, campaignId });

    if (!campaignId) {
      return NextResponse.json(
        { success: false, error: 'Campaign ID is required' },
        { status: 400 }
      );
    }

    // Fetch campaign data
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .select('*')
      .eq('id', campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error('[PreviewAPI] Campaign fetch failed', { campaignId, campaignError });
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }
    console.log('[PreviewAPI] Campaign fetched', { id: campaign.id, subject: campaign.subject });

    // Parse email elements from html_content (embedded base64 JSON)
    let emailElements = [];
    try {
      // First try to get elements from email_elements field
      if (campaign.email_elements) {
        emailElements = JSON.parse(campaign.email_elements);
      } else if (campaign.html_content) {
        // Extract embedded elements from html_content
        const match = campaign.html_content.match(/<!--ELEMENTS_B64:([^>]*)-->/);
        if (match && match[1]) {
          const decoded = Buffer.from(match[1], 'base64').toString('utf8');
          emailElements = JSON.parse(decoded);
        }
      }
    } catch (parseError) {
      console.error('[PreviewAPI] email_elements parse error', { campaignId, parseError });
      return NextResponse.json(
        { success: false, error: 'Invalid email elements format' },
        { status: 400 }
      );
    }
    console.log('[PreviewAPI] Parsed elements', { count: Array.isArray(emailElements) ? emailElements.length : 0 });
    
    // Debug: Log first element's padding values
    if (Array.isArray(emailElements) && emailElements.length > 0) {
      console.log('[PreviewAPI] First element padding values:', {
        id: emailElements[0].id,
        type: emailElements[0].type,
        paddingTop: emailElements[0].paddingTop,
        paddingBottom: emailElements[0].paddingBottom,
        paddingLeft: emailElements[0].paddingLeft,
        paddingRight: emailElements[0].paddingRight,
        fullWidth: emailElements[0].fullWidth
      });
    }

    // Generate HTML from elements (similar to send route but without tracking)
    const elementHtml = emailElements
      .map((element: any) => {
        // Debug logging to see element properties
        console.log('🎨 Preview: Generating HTML for element:', {
          id: element.id,
          type: element.type,
          fontFamily: element.fontFamily,
          fontSize: element.fontSize,
          textColor: element.textColor,
          backgroundColor: element.backgroundColor,
          fontWeight: element.fontWeight,
          lineHeight: element.lineHeight,
          textAlign: element.textAlign
        });
        
        const wrapperClass = element.fullWidth ? 'full-width' : 'container';
        const containerStyle = element.fullWidth ? '' : 'max-width: 600px; margin: 0 auto;';

        // Align padding logic with send route: compute per-side with nullish coalescing
        const lrDefault = (() => {
          switch (element.type) {
            case 'button':
            case 'image':
              return 0;
            case 'footer':
              return 0;
            case 'brand-header':
              return 0;
            default:
              return element.fullWidth ? 24 : 32;
          }
        })();

        const defaultTop = (() => {
          switch (element.type) {
            case 'brand-header':
              return 0;
            case 'footer':
              return 0;
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
          case 'header':
            return `<div class="${wrapperClass}" style="color: #333; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || (element.headerType === 'h1' ? '32px' : element.headerType === 'h2' ? '28px' : element.headerType === 'h3' ? '24px' : '20px')}; font-weight: ${element.fontWeight || 'bold'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; ${paddingStyle}">${
              element.content || "Enter header text..."
            }</div>`;

          case 'text':
            return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; ${paddingStyle}">${
              element.content || ""
            }</div>`;

          case 'button':
            return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1rem 0; ${paddingStyle}">
              <a href="${element.url || '#'}" style="
                display: ${element.fullWidth ? 'block' : 'inline-block'};
                padding: ${element.fullWidth ? '1.25rem 2.5rem' : '1.25rem 2.5rem'};
                background: ${element.gradient || element.backgroundColor || 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)'};
                color: ${element.textColor || 'white'};
                text-decoration: none;
                border-radius: ${element.fullWidth ? '0' : '50px'};
                font-weight: ${element.fontWeight || '700'};
                font-size: ${element.fontSize || '1rem'};
                text-transform: uppercase;
                letter-spacing: 1px;
                box-shadow: ${element.fullWidth ? 'none' : '0 8px 25px rgba(108, 99, 255, 0.3)'};
                width: ${element.fullWidth ? '100%' : 'auto'};
                text-align: ${element.textAlign || 'center'};
                font-family: ${element.fontFamily || 'Arial, sans-serif'};
                line-height: ${element.lineHeight || '1.2'};
              ">${element.content || 'Click here'}</a>
            </div>`;

          case 'image':
            return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1rem 0; ${paddingStyle}">
              <img src="${element.src || 'https://via.placeholder.com/600x300'}" 
                   alt="${element.alt || 'Image'}" 
                   style="max-width: 100%; height: auto; border-radius: ${element.borderRadius || '0'}px;" />
            </div>`;

          case 'divider':
            return `<div class="${wrapperClass}" style="margin: 1rem 0; ${paddingStyle}">
              <hr style="border: none; height: ${element.thickness || 2}px; background: ${element.color || 'linear-gradient(90deg, #6c63ff, #4ecdc4)'}; margin: 16px 0;" />
            </div>`;

          case 'spacer':
            return `<div class="${wrapperClass}" style="height: ${element.height || 20}px; ${paddingStyle}"></div>`;

          case 'footer':
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
                    <a href="${element.unsubscribeUrl || "/unsubscribe?email={{email}}"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none;">${element.unsubscribeText || "Unsubscribe"}</a>
                    &nbsp;|&nbsp;
                    <a href="${element.privacyUrl || "https://cymasphere.com/privacy-policy"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none;">${element.privacyText || "Privacy Policy"}</a>
                    &nbsp;|&nbsp;
                    <a href="${element.termsUrl || "https://cymasphere.com/terms-of-service"}" style="color: ${element.textColor || '#ffffff'}; text-decoration: none;">${element.termsText || "Terms of Service"}</a>
                  </td>
                </tr>
              </table>
            </div>`;

          case 'brand-header':
            // Use a more reliable image source and Gmail-compatible structure
            const logoUrl = "https://cymasphere.com/images/cm-logo.png";

            // Force brand-header to align like send route: use constrained width container and 0 side padding
            const headerWrapperClass = 'container';
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
            return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; padding: ${element.paddingTop ?? 16}px ${element.fullWidth ? 24 : 32}px ${element.paddingBottom ?? 16}px ${element.fullWidth ? 24 : 32}px;">${
              element.content || ""
            }</div>`;
        }
      })
      .join("");

    // Generate the full HTML
    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${campaign.subject || 'Email Preview'} - Cymasphere</title>
    
    <!-- Google Fonts for custom typography -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Open+Sans:wght@300;400;500;600;700;800&family=Roboto:wght@100;300;400;500;700;900&family=Lato:wght@100;300;400;700;900&family=Poppins:wght@100;200;300;400;500;600;700;800;900&family=Source+Sans+Pro:wght@200;300;400;600;700;900&family=Nunito:wght@200;300;400;500;600;700;800;900&family=Work+Sans:wght@100;200;300;400;500;600;700;800;900&family=Montserrat:wght@100;200;300;400;500;600;700;800;900&family=Merriweather:wght@300;400;700;900&family=Playfair+Display:wght@400;500;600;700;800;900&family=Oswald:wght@200;300;400;500;600;700&family=PT+Sans:wght@400;700&family=Ubuntu:wght@300;400;500;700&family=Noto+Sans:wght@100;200;300;400;500;600;700;800;900&family=Source+Code+Pro:wght@200;300;400;500;600;700;800;900&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f7f7f7;
        }
        
        .full-width {
            width: 100%;
        }
        
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        
        /* Brand header specific styling */
        .brand-header {
            color: inherit !important;
            -webkit-text-fill-color: inherit !important;
        }
        
        .brand-header span {
            color: inherit !important;
            -webkit-text-fill-color: inherit !important;
        }
        
        /* Ensure element styles take precedence over body styles */
        div[style*="font-family"] {
            font-family: inherit !important;
        }
        
        div[style*="font-size"] {
            font-size: inherit !important;
        }
        
        div[style*="font-weight"] {
            font-weight: inherit !important;
        }
        
        div[style*="color"] {
            color: inherit !important;
        }
        
        div[style*="line-height"] {
            line-height: inherit !important;
        }
        
        div[style*="text-align"] {
            text-align: inherit !important;
        }
    </style>
</head>
<body>
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        ${elementHtml}
    </div>
</body>
</html>`;

    console.log('[PreviewAPI] HTML generated', { campaignId, htmlLength: html.length });

    return NextResponse.json({
      success: true,
      html: html,
      elements: emailElements,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject
      }
    });

  } catch (error) {
    console.error('[PreviewAPI] Email preview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}
