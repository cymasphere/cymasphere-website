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
      return NextResponse.json(
        { success: false, error: 'Campaign not found' },
        { status: 404 }
      );
    }

    // Parse email elements
    let emailElements = [];
    try {
      emailElements = JSON.parse(campaign.email_elements || '[]');
    } catch (parseError) {
      return NextResponse.json(
        { success: false, error: 'Invalid email elements format' },
        { status: 400 }
      );
    }

    // Generate HTML from elements (similar to send route but without tracking)
    const elementHtml = emailElements
      .map((element: any) => {
        const wrapperClass = element.fullWidth ? 'full-width' : 'container';
        const containerStyle = element.fullWidth ? '' : 'max-width: 600px; margin: 0 auto;';

        switch (element.type) {
          case 'text':
            return `<div class="${wrapperClass}" style="color: #555; margin: 1rem 0; text-align: ${element.textAlign || 'left'}; font-size: ${element.fontSize || '16px'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.6'}; padding: ${element.fullWidth ? '0' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">${
              element.content || ""
            }</div>`;

          case 'button':
            return `<div class="${wrapperClass}" style="text-align: ${element.textAlign || 'center'}; margin: 1rem 0; padding: ${element.fullWidth ? '0 30px' : '0 30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px;">
              <a href="${element.url || '#'}" style="
                display: ${element.fullWidth ? 'block' : 'inline-block'};
                padding: ${element.fullWidth ? '1.25rem 2.5rem' : '1.25rem 2.5rem'};
                background: ${element.backgroundColor || 'linear-gradient(135deg, #6c63ff 0%, #4ecdc4 100%)'};
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
            // Generate social links HTML with PNG icons
            const socialLinksHtml = element.socialLinks && element.socialLinks.length > 0
              ? element.socialLinks
                  .map((social: any) => {
                    const icons = {
                      facebook: `<img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/social-icons/fb.png" alt="Facebook" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;" />`,
                      twitter: `<img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/social-icons/x.png" alt="Twitter" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;" />`,
                      instagram: `<img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/social-icons/insta.png" alt="Instagram" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;" />`,
                      youtube: `<img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/social-icons/youtube.png" alt="YouTube" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;" />`,
                      discord: `<img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/social-icons/discord.png" alt="Discord" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 5px;" />`
                    };
                    return `<a href="${social.url}" style="text-decoration: none; margin: 0 0.5rem; padding: 0.5rem; display: inline-block;">${icons[social.platform as keyof typeof icons] || "🔗"}</a>`;
                  })
                  .join("")
              : "";

            return `
            <div style="text-align: center; font-size: ${element.fontSize || '0.8rem'}; color: ${element.textColor || '#ffffff'}; background: ${element.backgroundColor || 'linear-gradient(135deg, #6c757d 0%, #495057 100%)'}; font-weight: ${element.fontWeight || 'normal'}; font-family: ${element.fontFamily || 'Arial, sans-serif'}; line-height: ${element.lineHeight || '1.4'}; border-top: 1px solid #dee2e6; margin-top: 2rem; padding: ${element.paddingTop || 32}px 30px ${element.paddingBottom || 32}px 30px;">
              ${socialLinksHtml ? `<div style="margin-bottom: 0.5rem; text-align: center;">${socialLinksHtml}</div>` : ""}
              <div style="margin-bottom: 0.5rem; text-align: center;">${element.footerText || `© ${new Date().getFullYear()} Cymasphere Inc. All rights reserved.`}</div>
              <div style="text-align: center;">
                <a href="${element.unsubscribeUrl || "#unsubscribe"}" style="color: #ffffff; text-decoration: none;">${element.unsubscribeText || "Unsubscribe"}</a>
                | 
                <a href="${element.privacyUrl || "https://cymasphere.com/privacy-policy"}" style="color: #ffffff; text-decoration: none;">${element.privacyText || "Privacy Policy"}</a>
                | 
                <a href="${element.termsUrl || "https://cymasphere.com/terms-of-service"}" style="color: #ffffff; text-decoration: none;">${element.termsText || "Terms of Service"}</a>
              </div>
            </div>`;

          case 'brand-header':
            // Use Supabase storage URL for the logo (accessible from anywhere)
            const logoUrl = "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/email-assets/cm-logo.png";

            return `<div class="${wrapperClass} brand-header" style="background: ${
              element.backgroundColor ||
              "linear-gradient(135deg, #1a1a1a 0%, #121212 100%)"
            }; padding: ${element.fullWidth ? '0 30px' : '30px'}; padding-top: ${element.paddingTop || 0}px; padding-bottom: ${element.paddingBottom || 0}px; text-align: center; display: flex; align-items: center; justify-content: center; min-height: 80px; border-radius: 0; box-shadow: none; margin: 0;">
              <img src="${logoUrl}" alt="Cymasphere Logo" style="max-width: 300px; width: 100%; height: auto; object-fit: contain; display: block; margin: 0 auto; padding: 0;" />
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
    </style>
</head>
<body>
    <div style="background-color: #ffffff; max-width: 600px; margin: 0 auto; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
        ${elementHtml}
    </div>
</body>
</html>`;

    return NextResponse.json({
      success: true,
      html: html,
      campaign: {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject
      }
    });

  } catch (error) {
    console.error('Email preview error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to generate email preview' },
      { status: 500 }
    );
  }
}
