/**
 * Welcome email template for new subscriptions and lifetime purchases
 */

export interface WelcomeEmailData {
  customerName?: string;
  customerEmail: string;
  purchaseType: 'subscription' | 'lifetime';
  subscriptionType?: 'monthly' | 'annual';
  planName: string;
  isTrial?: boolean;
  trialEndDate?: string; // ISO date string
  trialDays?: number;
}

/**
 * Generate welcome email HTML
 */
export function generateWelcomeEmailHtml(data: WelcomeEmailData): string {
  const { customerName, customerEmail, purchaseType, subscriptionType, planName } = data;
  const firstName = customerName?.split(' ')[0] || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com';
  const logoUrl = 'https://cymasphere.com/images/cm-logo.png';
  
  // Format plan name for display
  let planDisplayName = '';
  if (purchaseType === 'lifetime') {
    planDisplayName = 'Lifetime License';
  } else if (subscriptionType === 'monthly') {
    planDisplayName = 'Monthly Subscription';
  } else if (subscriptionType === 'annual') {
    planDisplayName = 'Annual Subscription';
  } else {
    planDisplayName = planName;
  }

  // Format trial end date if provided
  let trialEndDateFormatted = '';
  if (data.isTrial && data.trialEndDate) {
    const trialDate = new Date(data.trialEndDate);
    trialEndDateFormatted = trialDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Cymasphere</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #1a1a1a; border-radius: 12px; overflow: hidden;">
          
          <!-- Header with Logo -->
          <tr>
            <td align="center" style="padding: 40px 20px 30px 20px; background: linear-gradient(135deg, rgba(108, 99, 255, 0.1) 0%, rgba(78, 205, 196, 0.1) 100%);">
              <img src="${logoUrl}" alt="Cymasphere" style="max-width: 200px; height: auto; display: block;" />
            </td>
          </tr>
          
          <!-- Main Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; font-size: 28px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                Welcome to Cymasphere, ${firstName}!
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
                Thank you for joining Cymasphere! We're thrilled to have you as part of our community of musicians, composers, and creators.
              </p>
              
              <div style="background: linear-gradient(135deg, rgba(108, 99, 255, 0.15) 0%, rgba(78, 205, 196, 0.15) 100%); border-left: 4px solid #6c63ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #6c63ff; text-transform: uppercase; letter-spacing: 0.5px;">
                  ${data.isTrial ? 'Your Free Trial' : 'Your Purchase'}
                </p>
                <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #ffffff;">
                  ${planDisplayName}
                </p>
                ${data.isTrial ? `
                  <p style="margin: 8px 0 0 0; font-size: 14px; color: #4eccd4; font-weight: 500;">
                    🎉 You're starting a free trial! No charges will be made until ${trialEndDateFormatted}.
                  </p>
                ` : ''}
              </div>
              
              ${data.isTrial ? `
                <div style="background: rgba(78, 205, 196, 0.1); border: 1px solid rgba(78, 205, 196, 0.3); padding: 16px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0 0 8px 0; font-size: 14px; font-weight: 600; color: #4eccd4;">
                    ⏰ Trial Information
                  </p>
                  <p style="margin: 0; font-size: 14px; line-height: 1.6; color: #e0e0e0;">
                    Your ${data.trialDays || 'free'} day trial gives you full access to all premium features. You won't be charged until ${trialEndDateFormatted}. You can cancel anytime during your trial with no charges.
                  </p>
                </div>
              ` : ''}
              
              <p style="margin: 20px 0; font-size: 16px; line-height: 1.6; color: #e0e0e0;">
                You now have full access to all premium features of Cymasphere. Whether you're composing, learning music theory, or exploring new harmonic possibilities, we're here to support your creative journey.
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${siteUrl}/getting-started" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #6c63ff 0%, #4eccd4 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; text-align: center;">
                      Get Started
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 14px; line-height: 1.6; color: #b0b0b0;">
                If you have any questions or need assistance, our support team is here to help. Simply reply to this email or visit our support center.
              </p>
              
              <p style="margin: 20px 0 0 0; font-size: 14px; line-height: 1.6; color: #b0b0b0;">
                Happy creating!<br>
                <strong style="color: #ffffff;">The Cymasphere Team</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #0f0f0f; border-top: 1px solid rgba(255, 255, 255, 0.1);">
              <p style="margin: 0 0 10px 0; font-size: 12px; color: #888888; text-align: center;">
                © ${new Date().getFullYear()} Cymasphere. All rights reserved.
              </p>
              <p style="margin: 0; font-size: 12px; color: #888888; text-align: center;">
                <a href="${siteUrl}/support" style="color: #6c63ff; text-decoration: none;">Support</a> | 
                <a href="${siteUrl}/terms-of-service" style="color: #6c63ff; text-decoration: none;">Terms</a> | 
                <a href="${siteUrl}/privacy-policy" style="color: #6c63ff; text-decoration: none;">Privacy</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Generate welcome email plain text version
 */
export function generateWelcomeEmailText(data: WelcomeEmailData): string {
  const { customerName, purchaseType, subscriptionType, planName, isTrial, trialEndDate, trialDays } = data;
  const firstName = customerName?.split(' ')[0] || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com';
  
  let planDisplayName = '';
  if (purchaseType === 'lifetime') {
    planDisplayName = 'Lifetime License';
  } else if (subscriptionType === 'monthly') {
    planDisplayName = 'Monthly Subscription';
  } else if (subscriptionType === 'annual') {
    planDisplayName = 'Annual Subscription';
  } else {
    planDisplayName = planName;
  }

  let trialEndDateFormatted = '';
  if (isTrial && trialEndDate) {
    const trialDate = new Date(trialEndDate);
    trialEndDateFormatted = trialDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  return `
Welcome to Cymasphere, ${firstName}!

Thank you for joining Cymasphere! We're thrilled to have you as part of our community of musicians, composers, and creators.

${isTrial ? 'Your Free Trial' : 'Your Purchase'}: ${planDisplayName}
${isTrial ? `
🎉 You're starting a free trial! No charges will be made until ${trialEndDateFormatted}.

⏰ Trial Information:
Your ${trialDays || 'free'} day trial gives you full access to all premium features. You won't be charged until ${trialEndDateFormatted}. You can cancel anytime during your trial with no charges.
` : ''}

You now have full access to all premium features of Cymasphere. Whether you're composing, learning music theory, or exploring new harmonic possibilities, we're here to support your creative journey.

Get started: ${siteUrl}/getting-started

If you have any questions or need assistance, our support team is here to help. Simply reply to this email or visit our support center.

Happy creating!
The Cymasphere Team

© ${new Date().getFullYear()} Cymasphere. All rights reserved.
${siteUrl}/support | ${siteUrl}/terms-of-service | ${siteUrl}/privacy-policy
  `.trim();
}

