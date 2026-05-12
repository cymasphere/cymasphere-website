/**
 * @fileoverview Email templates for the affiliate program.
 *
 * Three lightweight HTML/text templates:
 *  - `generateAffiliateWelcomeEmail`: sent when an admin invites someone
 *  - `generateAffiliatePayoutEmail`: sent when a payout transfer succeeds
 *  - `generateAffiliateMonthlySummaryEmail`: monthly digest of earnings
 *
 * @module utils/email-campaigns/affiliate-emails
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cymasphere.com";
const LOGO_URL =
  "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/logos//cymasphere-logo.png";

function fmtMoney(cents: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

function emailShell(title: string, bodyInner: string): string {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${title}</title></head>
<body style="margin:0;padding:0;background-color:#f7f7f7;font-family:Arial,sans-serif;color:#111">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f7f7f7;padding:20px 0">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1)">
        <tr><td style="background:linear-gradient(135deg,#1a1a1a 0%,#121212 100%);padding:30px 24px;text-align:center">
          <img src="${LOGO_URL}" alt="Cymasphere" style="max-width:220px;height:auto;display:block;margin:0 auto" />
        </td></tr>
        <tr><td style="padding:32px 30px">${bodyInner}</td></tr>
        <tr><td style="padding:18px 30px;background:#fafafa;border-top:1px solid #eee;text-align:center;font-size:12px;color:#666">
          Cymasphere · <a href="${SITE_URL}" style="color:#666;text-decoration:underline">${SITE_URL}</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

/**
 * Welcome email sent when an affiliate is invited.
 */
export interface AffiliateWelcomeData {
  affiliateName?: string;
  affiliateEmail: string;
  code: string;
  customerDiscountPercent: number;
  commissionRateSubscription: number;
  commissionRateLifetime: number;
  recurringMonths: number;
}

export function generateAffiliateWelcomeEmail(
  data: AffiliateWelcomeData,
): { subject: string; html: string; text: string } {
  const firstName = data.affiliateName?.split(" ")[0] || "there";
  const shareLink = `${SITE_URL}/?ref=${encodeURIComponent(data.code)}`;
  const dashLink = `${SITE_URL}/affiliate`;
  const discount = data.customerDiscountPercent.toFixed(0);
  const subRate = (data.commissionRateSubscription * 100).toFixed(0);
  const lifetimeRate = (data.commissionRateLifetime * 100).toFixed(0);

  const subject = `You're a Cymasphere affiliate — code ${data.code}`;

  const inner = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#111">Welcome aboard, ${firstName} 🎉</h1>
    <p style="font-size:15px;line-height:1.55;color:#333;margin:0 0 16px">
      You've been invited to the Cymasphere affiliate program. Anyone who uses your code <strong style="color:#5b54d6">${data.code}</strong> at checkout gets <strong>${discount}% off for ${data.recurringMonths} months</strong>, and you earn ${subRate}% of every subscription invoice for that same window (or ${lifetimeRate}% on a lifetime purchase).
    </p>
    <p style="font-size:15px;line-height:1.55;color:#333;margin:0 0 16px">Your share link:</p>
    <p style="font-size:15px;line-height:1.4;margin:0 0 16px"><a href="${shareLink}" style="font-family:monospace;background:#f3f0ff;padding:8px 12px;border-radius:6px;color:#5b54d6;text-decoration:none;display:inline-block;word-break:break-all">${shareLink}</a></p>
    <p style="font-size:15px;line-height:1.55;color:#333;margin:0 0 24px">
      To receive payouts, sign in and complete Stripe Connect onboarding from your affiliate dashboard.
    </p>
    <p style="margin:0 0 24px">
      <a href="${dashLink}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#4ecdc4);color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">Open my dashboard</a>
    </p>
    <p style="font-size:13px;color:#666;margin:24px 0 0">
      Commissions are held for 30 days to absorb refunds, then automatically marked available for payout. Questions? Reply to this email.
    </p>
  `;

  const text = `Welcome aboard, ${firstName}!\n\nYou've been invited to the Cymasphere affiliate program.\n\nYour code: ${data.code}\nCustomer discount: ${discount}% off for ${data.recurringMonths} months\nYour commission: ${subRate}% on subscriptions / ${lifetimeRate}% on lifetime\n\nShare link: ${shareLink}\nDashboard: ${dashLink}\n\nComplete Stripe Connect onboarding from your dashboard to receive payouts. Commissions are held for 30 days to absorb refunds, then automatically marked available for payout.`;

  return {
    subject,
    html: emailShell(subject, inner),
    text,
  };
}

/**
 * Payout-sent notification.
 */
export interface AffiliatePayoutData {
  affiliateName?: string;
  affiliateEmail: string;
  code: string;
  amountCents: number;
  currency: string;
  commissionCount: number;
}

export function generateAffiliatePayoutEmail(
  data: AffiliatePayoutData,
): { subject: string; html: string; text: string } {
  const firstName = data.affiliateName?.split(" ")[0] || "there";
  const amount = fmtMoney(data.amountCents, data.currency);
  const dashLink = `${SITE_URL}/affiliate`;
  const subject = `Affiliate payout sent: ${amount}`;

  const inner = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#111">Your payout is on its way 💸</h1>
    <p style="font-size:15px;line-height:1.55;color:#333;margin:0 0 16px">
      ${firstName}, we just sent <strong>${amount}</strong> to your Stripe Connect account, covering ${data.commissionCount} commission${data.commissionCount === 1 ? "" : "s"} earned from code <strong style="color:#5b54d6">${data.code}</strong>.
    </p>
    <p style="font-size:15px;line-height:1.55;color:#333;margin:0 0 24px">
      Stripe will deposit the funds to your bank within a few business days. You can review the breakdown anytime in your affiliate dashboard.
    </p>
    <p style="margin:0 0 24px">
      <a href="${dashLink}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#4ecdc4);color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">View payouts</a>
    </p>
  `;

  const text = `Hi ${firstName},\n\nWe just sent ${amount} to your Stripe Connect account, covering ${data.commissionCount} commission(s) earned from code ${data.code}.\n\nStripe will deposit the funds to your bank within a few business days.\n\nReview: ${dashLink}`;

  return { subject, html: emailShell(subject, inner), text };
}

/**
 * Monthly earnings summary.
 */
export interface AffiliateMonthlySummaryData {
  affiliateName?: string;
  affiliateEmail: string;
  code: string;
  periodLabel: string; // e.g., "March 2026"
  conversionsCount: number;
  newPendingCents: number;
  newApprovedCents: number;
  paidThisPeriodCents: number;
  availableCents: number;
  currency: string;
}

export function generateAffiliateMonthlySummaryEmail(
  data: AffiliateMonthlySummaryData,
): { subject: string; html: string; text: string } {
  const firstName = data.affiliateName?.split(" ")[0] || "there";
  const dashLink = `${SITE_URL}/affiliate`;
  const subject = `Your Cymasphere affiliate summary — ${data.periodLabel}`;

  const inner = `
    <h1 style="font-size:22px;margin:0 0 16px;color:#111">Affiliate report · ${data.periodLabel}</h1>
    <p style="font-size:15px;line-height:1.55;color:#333;margin:0 0 16px">
      Hi ${firstName}, here's your activity for code <strong style="color:#5b54d6">${data.code}</strong>:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;border-collapse:collapse">
      <tr><td style="padding:10px 14px;border:1px solid #eee">New conversions</td><td style="padding:10px 14px;border:1px solid #eee;text-align:right;font-weight:600">${data.conversionsCount}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #eee">New pending</td><td style="padding:10px 14px;border:1px solid #eee;text-align:right;font-weight:600">${fmtMoney(data.newPendingCents, data.currency)}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #eee">New approved</td><td style="padding:10px 14px;border:1px solid #eee;text-align:right;font-weight:600">${fmtMoney(data.newApprovedCents, data.currency)}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #eee">Paid this period</td><td style="padding:10px 14px;border:1px solid #eee;text-align:right;font-weight:600">${fmtMoney(data.paidThisPeriodCents, data.currency)}</td></tr>
      <tr><td style="padding:10px 14px;border:1px solid #eee;background:#fafafa">Currently available</td><td style="padding:10px 14px;border:1px solid #eee;background:#fafafa;text-align:right;font-weight:700">${fmtMoney(data.availableCents, data.currency)}</td></tr>
    </table>
    <p style="margin:0 0 24px">
      <a href="${dashLink}" style="display:inline-block;background:linear-gradient(135deg,#6c63ff,#4ecdc4);color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:600">View dashboard</a>
    </p>
  `;

  const text = `Affiliate report · ${data.periodLabel}\n\nCode: ${data.code}\n\nNew conversions: ${data.conversionsCount}\nNew pending: ${fmtMoney(data.newPendingCents, data.currency)}\nNew approved: ${fmtMoney(data.newApprovedCents, data.currency)}\nPaid this period: ${fmtMoney(data.paidThisPeriodCents, data.currency)}\nCurrently available: ${fmtMoney(data.availableCents, data.currency)}\n\nDashboard: ${dashLink}`;

  return { subject, html: emailShell(subject, inner), text };
}
