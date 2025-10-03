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

        switch (element.type) {
          case 'header':
            return `<div class="${wrapperClass}" style="color: #333; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || (element.headerType === 'h1' ? '32px' : element.headerType === 'h2' ? '28px' : element.headerType === 'h3' ? '24px' : '20px')}; font-weight: ${element.fontWeight || 'bold'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.2'}; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">${
              element.content || "Enter header text..."
            }</div>`;

          case 'text':
            return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">${
              element.content || ""
            }</div>`;

          case 'button':
            return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1rem 0; padding: ${element.fullWidth ? '0 30px' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">
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
            return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1rem 0; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">
              <img src="${element.src || 'https://via.placeholder.com/600x300'}" 
                   alt="${element.alt || 'Image'}" 
                   style="max-width: 100%; height: auto; border-radius: ${element.borderRadius || '0'}px;" />
            </div>`;

          case 'divider':
            return `<div class="${wrapperClass}" style="margin: 1rem 0; padding: ${element.fullWidth ? '0 30px' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">
              <hr style="border: none; height: ${element.thickness || 2}px; background: ${element.color || 'linear-gradient(90deg, #6c63ff, #4ecdc4)'}; margin: 16px 0;" />
            </div>`;

          case 'spacer':
            return `<div class="${wrapperClass}" style="height: ${element.height || 20}px; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;"></div>`;

          case 'footer':
            // Generate social links HTML using inline, non-image badges (avoid external image loads)
            const socialLinksHtml = element.socialLinks && element.socialLinks.length > 0
              ? element.socialLinks
                  .map((social: any) => {
                    const badges: Record<string, string> = {
                      facebook: `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#1877F2;color:#fff;font-size:12px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">f</span>`,
                      twitter: `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#000;color:#fff;font-size:12px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">X</span>`,
                      instagram: `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:4px;background:#E1306C;color:#fff;font-size:10px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">IG</span>`,
                      youtube: `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:16px;border-radius:3px;background:#FF0000;color:#fff;font-size:10px;line-height:16px;font-weight:700;vertical-align:middle;margin-right:6px;">▶</span>`,
                      discord: `<span style="display:inline-flex;align-items:center;justify-content:center;width:22px;height:16px;border-radius:3px;background:#5865F2;color:#fff;font-size:10px;line-height:16px;font-weight:700;vertical-align:middle;margin-right:6px;">DC</span>`
                    };
                    const badge = badges[(social.platform || '').toLowerCase()] || `<span style="display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:50%;background:#6c63ff;color:#fff;font-size:12px;line-height:20px;font-weight:700;vertical-align:middle;margin-right:6px;">🔗</span>`;
                    return `<a href="${social.url}" style="text-decoration:none; margin:0 0.5rem; padding:0.5rem; display:inline-flex; align-items:center; color:#ffffff;">${badge}</a>`;
                  })
                  .join("")
              : "";

            return `
            <div style="text-align: center; font-size: ${element.fontSize || '0.8rem'}; color: ${element.textColor || '#ffffff'}; background: ${element.backgroundColor || 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.4'}; border-top: 1px solid #dee2e6; margin-top: 2rem; padding: ${element.paddingTop || 32}px 30px ${element.paddingBottom || 32}px 30px;">
              ${socialLinksHtml ? `<div style="margin-bottom: 0.5rem; text-align: center;">${socialLinksHtml}</div>` : ""}
              <div style="margin-bottom: 0.5rem; text-align: center;">${element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`}</div>
              <div style="text-align: center;">
                <a href="${element.unsubscribeUrl || "/unsubscribe?email={{email}}"}" style="color: #ffffff; text-decoration: none;">${element.unsubscribeText || "Unsubscribe"}</a>
                | 
                <a href="${element.privacyUrl || "https://cymasphere.com/privacy-policy"}" style="color: #ffffff; text-decoration: none;">${element.privacyText || "Privacy Policy"}</a>
                | 
                <a href="${element.termsUrl || "https://cymasphere.com/terms-of-service"}" style="color: #ffffff; text-decoration: none;">${element.termsText || "Terms of Service"}</a>
              </div>
            </div>`;

          case 'brand-header':
            // Use a more reliable image source and Gmail-compatible structure
            const logoUrl = "https://cymasphere.com/images/cm-logo.png";

            return `<div class="${wrapperClass} brand-header" style="background: ${
              element.backgroundColor ||
              "linear-gradient(135deg, #1a1a1a 0%, #121212 100%)"
            }; padding: ${element.fullWidth ? '0 30px' : '30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px; text-align: center; display: flex; align-items: center; justify-content: center; min-height: 80px; border-radius: 0; box-shadow: none; margin: 0;">
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
                <tr>
                  <td align="center" style="padding: 0;">
                    <img src="${logoUrl}" alt="Cymasphere Logo" style="max-width: 300px; width: 100%; height: auto; object-fit: contain; display: block; margin: 0 auto; padding: 0; border: 0; outline: none;" />
                  </td>
                </tr>
              </table>
            </div>`;

          default:
            return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">${
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
