/**
 * @fileoverview Trial ending reminder email template
 * 
 * This module generates HTML and plain text versions of the trial ending reminder email.
 * Matches the formatting and style of the welcome email template.
 * 
 * @module utils/email-campaigns/trial-ending-reminder
 */

export interface TrialEndingReminderData {
  customerName?: string;
  customerEmail: string;
  trialEndDate: string; // ISO date string
  trialDays: number; // 7 or 14
  planName: string; // e.g., "Monthly Subscription"
  monthlyPrice: number; // e.g., 6.00
  updatePaymentMethodUrl: string; // Stripe billing portal URL
}

/**
 * @brief Generate trial ending reminder email HTML
 * 
 * Creates an HTML email matching the welcome email style, informing users
 * that their trial is ending soon and prompting them to add a payment method.
 * 
 * @param data Trial ending reminder email data
 * @returns HTML email content
 * @note Matches welcome email formatting and styling
 * 
 * @example
 * ```typescript
 * const html = generateTrialEndingReminderHtml({
 *   customerEmail: "user@example.com",
 *   trialEndDate: "2026-01-16T00:00:00Z",
 *   trialDays: 7,
 *   planName: "Monthly Subscription",
 *   monthlyPrice: 6.00,
 *   updatePaymentMethodUrl: "https://billing.stripe.com/..."
 * });
 * ```
 */
export function generateTrialEndingReminderHtml(data: TrialEndingReminderData): string {
  const { customerName, customerEmail, trialEndDate, trialDays, planName, monthlyPrice, updatePaymentMethodUrl } = data;
  const firstName = customerName?.split(' ')[0] || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com';
  const logoUrlSupabase = 'https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/logos//cymasphere-logo.png';

  // Format trial end date
  const trialDate = new Date(trialEndDate);
  const trialEndDateFormatted = trialDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format price
  const formattedPrice = monthlyPrice.toFixed(2);

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your free trial ends soon</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7f7; font-family: Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f7f7; padding: 20px 0;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%); padding: 30px 24px; text-align: center;">
              <img src="${logoUrlSupabase}" alt="Cymasphere" style="max-width: 220px; height: auto; display: block; margin: 0 auto;" />
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 30px 24px;">
              <h1 style="font-size: 1.5rem; color: #333; margin: 0 0 20px 0; font-weight: 600;">
                Don't lose access to your creative tools
              </h1>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
                Hi ${firstName}! We hope you've been enjoying Cymasphere Pro. Your free trial ends on <strong>${trialEndDateFormatted}</strong>, and we'd love to keep you creating with all the premium features you've been using.
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f9f9f9; border-radius: 8px; border-left: 4px solid #6c63ff;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #6c63ff; text-transform: uppercase; letter-spacing: 0.5px;">
                  Your Subscription
                </p>
                <p style="margin: 0 0 8px 0; font-size: 18px; font-weight: 600; color: #333;">
                  ${planName}
                </p>
                <p style="margin: 8px 0 0 0; font-size: 14px; color: #666; line-height: 1.6;">
                  Just $${formattedPrice} per ${planName.toLowerCase().includes('annual') ? 'year' : 'month'} to keep all your premium features active. No commitment—cancel anytime.
                </p>
              </div>
              
              <div style="background-color: #fff7ed; border: 1px solid #fed7aa; border-radius: 8px; padding: 16px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px; color: #9a3412; line-height: 1.6;">
                  <strong>⏰ Quick action needed:</strong> Add your payment method before ${trialEndDateFormatted} to continue seamlessly without any interruption to your workflow.
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${updatePaymentMethodUrl}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 1rem;">
                  Continue Your Journey →
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 0.9em; text-align: center;">
                Takes less than 2 minutes • Secure payment • Cancel anytime
              </p>
              
              <div style="margin: 30px 0; padding: 20px; background-color: #f9fafb; border-radius: 8px;">
                <p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #333;">
                  💡 Why continue?
                </p>
                <ul style="margin: 0; padding-left: 20px; color: #666; line-height: 1.8; font-size: 14px;">
                  <li>Keep all the premium features you've been using</li>
                  <li>No interruption to your creative workflow</li>
                  <li>Cancel anytime—no long-term commitment</li>
                  <li>Join thousands of musicians creating with Cymasphere</li>
                </ul>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin: 30px 0 0 0; font-size: 0.9em;">
                Questions? We're here to help! Visit our <a href="${siteUrl}/support" style="color: #6c63ff; text-decoration: none;">support site</a> or reply to this email.
              </p>
              
              <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 0.9em;">
                Best regards,<br>
                <strong style="color: #333;">The Cymasphere Team</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 24px; background-color: #f8f9fa; border-top: 1px solid #e9ecef; text-align: center; font-size: 0.85em; color: #666;">
              <p style="margin: 0 0 10px 0;">
                © ${new Date().getFullYear()} Cymasphere. All rights reserved.
              </p>
              <p style="margin: 0;">
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
 * @brief Generate trial ending reminder email plain text version
 * 
 * Creates a plain text version of the trial ending reminder email.
 * 
 * @param data Trial ending reminder email data
 * @returns Plain text email content
 * 
 * @example
 * ```typescript
 * const text = generateTrialEndingReminderText({
 *   customerEmail: "user@example.com",
 *   trialEndDate: "2026-01-16T00:00:00Z",
 *   trialDays: 7,
 *   planName: "Monthly Subscription",
 *   monthlyPrice: 6.00,
 *   updatePaymentMethodUrl: "https://billing.stripe.com/..."
 * });
 * ```
 */
export function generateTrialEndingReminderText(data: TrialEndingReminderData): string {
  const { customerName, trialEndDate, planName, monthlyPrice, updatePaymentMethodUrl } = data;
  const firstName = customerName?.split(' ')[0] || 'there';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cymasphere.com';

  // Format trial end date
  const trialDate = new Date(trialEndDate);
  const trialEndDateFormatted = trialDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format price
  const formattedPrice = monthlyPrice.toFixed(2);

  return `
Don't lose access to your creative tools

Hi ${firstName}! We hope you've been enjoying Cymasphere Pro. Your free trial ends on ${trialEndDateFormatted}, and we'd love to keep you creating with all the premium features you've been using.

Your Subscription
${planName}
Just $${formattedPrice} per ${planName.toLowerCase().includes('annual') ? 'year' : 'month'} to keep all your premium features active. No commitment—cancel anytime.

⏰ Quick action needed: Add your payment method before ${trialEndDateFormatted} to continue seamlessly without any interruption to your workflow.

Continue Your Journey: ${updatePaymentMethodUrl}
Takes less than 2 minutes • Secure payment • Cancel anytime

💡 Why continue?
• Keep all the premium features you've been using
• No interruption to your creative workflow
• Cancel anytime—no long-term commitment
• Join thousands of musicians creating with Cymasphere

Questions? We're here to help! Visit our support site: ${siteUrl}/support
Or reply to this email.

Best regards,
The Cymasphere Team

© ${new Date().getFullYear()} Cymasphere. All rights reserved.
${siteUrl}/support | ${siteUrl}/terms-of-service | ${siteUrl}/privacy-policy
  `.trim();
}
