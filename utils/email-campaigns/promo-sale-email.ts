/**
 * @fileoverview Production HTML/text builders for Cymasphere lifetime promo sale emails.
 * @module utils/email-campaigns/promo-sale-email
 * @description Table-based, email-client-safe templates with themed hero, price stack,
 * promo code callout, CymaSynth value props, and UTM’d CTAs. Used to populate draft
 * campaigns for the 2026–2027 promo calendar.
 * @note Lifetime buyers must be excluded at the audience layer, not in copy alone.
 * @example
 * ```ts
 * import { buildPromoSaleEmail } from "@/utils/email-campaigns/promo-sale-email";
 * const { html, text } = buildPromoSaleEmail(PROMO_SALE_EMAIL_SPECS[0]);
 * ```
 */

import { resolvePublicSiteUrlForEmail } from "./public-site-url";

/**
 * @brief Visual theme tokens for a promo email hero and accents.
 */
export interface PromoSaleEmailTheme {
  /** @brief Hero gradient CSS (inline-safe) */
  heroBackground: string;
  /** @brief Hero / accent text color */
  heroText: string;
  /** @brief Accent for price badge and highlights */
  accent: string;
  /** @brief CTA button background */
  ctaBackground: string;
  /** @brief CTA button text */
  ctaText: string;
}

/**
 * @brief Spec for one lifetime promo sale email.
 */
export interface PromoSaleEmailSpec {
  /** @brief Internal campaign key (matches promotions.name) */
  promoName: string;
  /** @brief Email campaign UUID to update when syncing */
  campaignId: string;
  /** @brief Subject line */
  subject: string;
  /** @brief Inbox preview text */
  preheader: string;
  /** @brief Hero eyebrow (short seasonal label) */
  eyebrow: string;
  /** @brief Hero headline */
  headline: string;
  /** @brief Opening paragraph after greeting */
  lead: string;
  /** @brief Supporting paragraphs */
  body: string[];
  /** @brief Customer-facing promo code */
  couponCode: string;
  /** @brief List / compare-at lifetime price */
  compareAtUsd: number;
  /** @brief Sale lifetime price */
  salePriceUsd: number;
  /** @brief Human end date for urgency copy */
  endsLabel: string;
  /** @brief CTA button label */
  ctaLabel: string;
  /** @brief Path + query for CTA (leading slash) */
  ctaPath: string;
  /** @brief UTM campaign slug */
  utmCampaign: string;
  /** @brief Theme tokens */
  theme: PromoSaleEmailTheme;
  /** @brief When true, emphasize “best price of the year” */
  isBestOfYear?: boolean;
}

const LOGO_URL =
  "https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/logos//cymasphere-logo.png";

/**
 * @brief Escapes text for HTML text nodes.
 * @param value Raw string
 * @returns Escaped string
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * @brief Builds HTML and plain-text bodies for a promo sale email.
 * @param spec Promo email content and theme
 * @returns Object with html and text multipart bodies
 */
export function buildPromoSaleEmail(spec: PromoSaleEmailSpec): {
  html: string;
  text: string;
} {
  const siteUrl = resolvePublicSiteUrlForEmail();
  const ctaUrl = `${siteUrl}${spec.ctaPath}${
    spec.ctaPath.includes("?") ? "&" : "?"
  }utm_source=email&utm_medium=campaign&utm_campaign=${encodeURIComponent(
    spec.utmCampaign,
  )}`;
  const savings = spec.compareAtUsd - spec.salePriceUsd;
  const year = new Date().getFullYear();

  const featureRows = [
    "Build progressions, voicings, and melodies that stay in key",
    "CymaSynth included — wavetable synth as app + VST3/AU",
    "Run standalone or inside your DAW",
    "Pay once. Lifetime access and updates.",
  ];

  const bodyHtml = spec.body
    .map(
      (p) =>
        `<p style="margin:0 0 16px 0;color:#444;font-size:16px;line-height:1.65;">${escapeHtml(p)}</p>`,
    )
    .join("\n");

  const featuresHtml = featureRows
    .map(
      (f) => `
                <tr>
                  <td style="padding:8px 0;color:#333;font-size:15px;line-height:1.5;">
                    <span style="color:${spec.theme.accent};font-weight:700;padding-right:8px;">✓</span>${escapeHtml(f)}
                  </td>
                </tr>`,
    )
    .join("");

  const bestBadge = spec.isBestOfYear
    ? `<p style="margin:0 0 12px 0;display:inline-block;padding:6px 12px;border-radius:999px;background:${spec.theme.accent};color:#111;font-size:12px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase;">Best price of the year</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
  <title>${escapeHtml(spec.subject)}</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f0f0f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    ${escapeHtml(spec.preheader)}
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0f0f0;padding:24px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 28px rgba(0,0,0,0.08);">
          <!-- Brand bar -->
          <tr>
            <td style="background:#111111;padding:22px 28px;text-align:center;">
              <img src="${LOGO_URL}" alt="Cymasphere" width="200" style="max-width:200px;height:auto;display:block;margin:0 auto;border:0;" />
            </td>
          </tr>
          <!-- Hero -->
          <tr>
            <td style="background:${spec.theme.heroBackground};padding:36px 28px 32px;text-align:center;color:${spec.theme.heroText};">
              <p style="margin:0 0 10px 0;font-size:12px;font-weight:700;letter-spacing:0.14em;text-transform:uppercase;opacity:0.92;">${escapeHtml(spec.eyebrow)}</p>
              <h1 style="margin:0 0 14px 0;font-size:32px;line-height:1.2;font-weight:800;color:${spec.theme.heroText};">${escapeHtml(spec.headline)}</h1>
              <p style="margin:0;font-size:17px;line-height:1.5;opacity:0.95;max-width:460px;margin-left:auto;margin-right:auto;">${escapeHtml(spec.lead)}</p>
            </td>
          </tr>
          <!-- Deal card -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#111111;border-radius:12px;">
                <tr>
                  <td style="padding:28px 24px;text-align:center;color:#ffffff;">
                    ${bestBadge}
                    <p style="margin:0 0 6px 0;font-size:13px;letter-spacing:0.08em;text-transform:uppercase;color:#aaaaaa;">Lifetime license</p>
                    <p style="margin:0 0 4px 0;font-size:18px;color:#888888;text-decoration:line-through;">$${spec.compareAtUsd}</p>
                    <p style="margin:0 0 8px 0;font-size:48px;line-height:1;font-weight:800;color:${spec.theme.accent};">$${spec.salePriceUsd}</p>
                    <p style="margin:0 0 18px 0;font-size:15px;color:#dddddd;">Save $${savings} · Includes CymaSynth</p>
                    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto 18px;">
                      <tr>
                        <td style="background:#1f1f1f;border:1px dashed ${spec.theme.accent};border-radius:8px;padding:12px 18px;">
                          <p style="margin:0 0 4px 0;font-size:11px;letter-spacing:0.1em;text-transform:uppercase;color:#999999;">Promo code</p>
                          <p style="margin:0;font-size:22px;font-weight:800;letter-spacing:0.08em;color:#ffffff;">${escapeHtml(spec.couponCode)}</p>
                        </td>
                      </tr>
                    </table>
                    <p style="margin:0 0 20px 0;font-size:14px;color:#cccccc;">Ends ${escapeHtml(spec.endsLabel)}</p>
                    <a href="${ctaUrl}" style="display:inline-block;padding:16px 34px;background:${spec.theme.ctaBackground};color:${spec.theme.ctaText};text-decoration:none;border-radius:8px;font-weight:800;font-size:16px;letter-spacing:0.02em;">${escapeHtml(spec.ctaLabel)}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Copy -->
          <tr>
            <td style="padding:28px 28px 8px;">
              <p style="margin:0 0 16px 0;color:#333;font-size:16px;line-height:1.65;">Hey {{firstName}},</p>
              ${bodyHtml}
            </td>
          </tr>
          <!-- Features -->
          <tr>
            <td style="padding:8px 28px 8px;">
              <p style="margin:0 0 12px 0;font-size:13px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#888888;">What you unlock</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                ${featuresHtml}
              </table>
            </td>
          </tr>
          <!-- Secondary CTA -->
          <tr>
            <td style="padding:24px 28px 8px;text-align:center;">
              <a href="${ctaUrl}" style="display:inline-block;padding:14px 28px;background:${spec.theme.ctaBackground};color:${spec.theme.ctaText};text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">${escapeHtml(spec.ctaLabel)}</a>
              <p style="margin:14px 0 0 0;font-size:13px;color:#888888;">On monthly or annual? Use this code to upgrade to Lifetime.</p>
            </td>
          </tr>
          <!-- Signoff -->
          <tr>
            <td style="padding:16px 28px 32px;">
              <p style="margin:0;color:#555;font-size:15px;line-height:1.6;">
                Happy creating,<br />
                <strong style="color:#222;">The Cymasphere Team</strong>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#1a1a1a;padding:24px 28px;text-align:center;color:#999999;font-size:12px;line-height:1.6;">
              <p style="margin:0 0 8px 0;color:#cccccc;font-weight:600;">Cymasphere</p>
              <p style="margin:0 0 12px 0;">Write better music from harmony out.</p>
              <p style="margin:0 0 12px 0;">
                <a href="${siteUrl}/pricing" style="color:${spec.theme.accent};text-decoration:none;">Pricing</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl}/support" style="color:${spec.theme.accent};text-decoration:none;">Support</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl}/privacy-policy" style="color:${spec.theme.accent};text-decoration:none;">Privacy</a>
              </p>
              <p style="margin:0 0 8px 0;">&copy; ${year} Cymasphere. All rights reserved.</p>
              <p style="margin:0;">
                <a href="{{unsubscribeUrl}}" style="color:#888888;text-decoration:underline;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = `${spec.headline}

${spec.lead}

Lifetime: $${spec.salePriceUsd} (was $${spec.compareAtUsd}) — save $${savings}
Promo code: ${spec.couponCode}
Ends ${spec.endsLabel}

${spec.body.join("\n\n")}

What you unlock:
${featureRows.map((f) => `- ${f}`).join("\n")}

${spec.ctaLabel}:
${ctaUrl}

Happy creating,
The Cymasphere Team

Unsubscribe: {{unsubscribeUrl}}
`;

  return { html, text };
}

/**
 * @brief Full 2026 H2 + 2027 promo email specs keyed to draft campaign IDs.
 */
export const PROMO_SALE_EMAIL_SPECS: PromoSaleEmailSpec[] = [
  {
    promoName: "studio_season_2026",
    campaignId: "eb16001a-0725-48cd-904b-7bd907a6e0fe",
    subject: "Lifetime $149 — back to the studio (save $50)",
    preheader: "Code STUDIO26. Ends Sep 7. CymaSynth included.",
    eyebrow: "Fall studio sale",
    headline: "Own Lifetime for $149",
    lead: "Summer’s over. Lock in Lifetime before fall sessions fill up.",
    body: [
      "You don’t need another monthly bill. You need tools that stay when the project gets serious.",
      "Get Lifetime Cymasphere for $149 (was $199). CymaSynth is included — no second purchase.",
      "Use code STUDIO26 at checkout. Ends September 7.",
    ],
    couponCode: "STUDIO26",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "September 7, 2026",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=STUDIO26",
    utmCampaign: "studio_season_2026",
    theme: {
      heroBackground: "linear-gradient(135deg,#C47B3A 0%,#8B4513 100%)",
      heroText: "#FFFFFF",
      accent: "#F5D76E",
      ctaBackground: "linear-gradient(90deg,#C47B3A,#8B4513)",
      ctaText: "#FFFFFF",
    },
  },
  {
    promoName: "treat_lifetime_2026",
    campaignId: "5644c0d6-fe7e-4c8e-80f1-09e7ef1ebc9d",
    subject: "Lifetime $149 before Black Friday (TREAT26)",
    preheader: "Save $50. CymaSynth included. Ends Nov 2.",
    eyebrow: "Limited Halloween offer",
    headline: "Lifetime for $149. No tricks.",
    lead: "A clean $50 cut on Lifetime — before the Black Friday rush.",
    body: [
      "Skip the gimmicks. Here’s the offer: Lifetime Cymasphere for $149 (was $199).",
      "CymaSynth is included. Use code TREAT26. Ends November 2.",
      "Miss it and wait for Black Friday — or grab Lifetime now and write through the holidays.",
    ],
    couponCode: "TREAT26",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "November 2, 2026",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=TREAT26",
    utmCampaign: "treat_lifetime_2026",
    theme: {
      heroBackground: "linear-gradient(135deg,#B45309 0%,#7C2D12 100%)",
      heroText: "#FFF7ED",
      accent: "#FBBF24",
      ctaBackground: "linear-gradient(90deg,#EA580C,#9A3412)",
      ctaText: "#FFF7ED",
    },
  },
  {
    promoName: "bfcm_2026",
    campaignId: "5f0b902c-cf8b-4828-89d5-7287f8b72cac",
    subject: "Lifetime $99 — lowest price of 2026",
    preheader: "Code BFCM2026. Was $199. Ends Dec 2.",
    eyebrow: "Black Friday · Cyber Week",
    headline: "Lifetime for $99",
    lead: "This is the lowest Lifetime price we run all year. Save $100.",
    body: [
      "Pay once. Keep Cymasphere and CymaSynth. No renewals.",
      "Use code BFCM2026 at checkout. Offer ends December 2.",
      "If Lifetime has been on your list, this is the week.",
    ],
    couponCode: "BFCM2026",
    compareAtUsd: 199,
    salePriceUsd: 99,
    endsLabel: "December 2, 2026",
    ctaLabel: "Get Lifetime for $99",
    ctaPath: "/?promo=BFCM2026",
    utmCampaign: "bfcm_2026",
    isBestOfYear: true,
    theme: {
      heroBackground: "linear-gradient(135deg,#FF6B6B 0%,#B30000 100%)",
      heroText: "#FFFFFF",
      accent: "#FFD700",
      ctaBackground: "linear-gradient(90deg,#FFD700,#F59E0B)",
      ctaText: "#1A0000",
    },
  },
  {
    promoName: "christmas_2026",
    campaignId: "b8da71d6-bcd9-4060-b453-619bc44bc5fc",
    subject: "Christmas Lifetime $149 — last chance of 2026",
    preheader: "Code XMAS26. Save $50. Ends Dec 31.",
    eyebrow: "Christmas sale",
    headline: "Gift yourself Lifetime for $149",
    lead: "One purchase. Tools that don’t expire with the year.",
    body: [
      "Buy yourself the studio upgrade you’ll open in January — not another gadget you’ll ignore.",
      "Lifetime Cymasphere is $149 (was $199). CymaSynth is included.",
      "Use code XMAS26. Last chance of 2026. Ends December 31.",
    ],
    couponCode: "XMAS26",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "December 31, 2026",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=XMAS26",
    utmCampaign: "christmas_2026",
    theme: {
      heroBackground: "linear-gradient(135deg,#0B3D2E 0%,#8B1E1E 100%)",
      heroText: "#FFFFFF",
      accent: "#D4AF37",
      ctaBackground: "linear-gradient(90deg,#D4AF37,#B8860B)",
      ctaText: "#0B3D2E",
    },
  },
  {
    promoName: "new_year_2027",
    campaignId: "8162456b-cc03-43dd-9602-c12e4c5d8121",
    subject: "Start 2027 with Lifetime — $149",
    preheader: "Code NEWYEAR27. Save $50. Ends Jan 25.",
    eyebrow: "New Year sale",
    headline: "Start the year owning your tools",
    lead: "Stop renting your studio stack. Lifetime is $149 through January 25.",
    body: [
      "Empty project files don’t write themselves. Give yourself the harmony tools that stick.",
      "Lifetime Cymasphere for $149 (was $199). CymaSynth included.",
      "Use code NEWYEAR27. Ends January 25.",
    ],
    couponCode: "NEWYEAR27",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "January 25, 2027",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=NEWYEAR27",
    utmCampaign: "new_year_2027",
    theme: {
      heroBackground: "linear-gradient(135deg,#1B3A4B 0%,#2E86AB 100%)",
      heroText: "#FFFFFF",
      accent: "#F6C90E",
      ctaBackground: "linear-gradient(90deg,#2E86AB,#1B3A4B)",
      ctaText: "#FFFFFF",
    },
  },
  {
    promoName: "spring_sessions_2027",
    campaignId: "1aaed4b6-6874-45fb-8ca4-09cab4ff8387",
    subject: "Lifetime $149 — put the refund into your studio",
    preheader: "Code SPRING27. Save $50. Ends Apr 18.",
    eyebrow: "Spring Sessions",
    headline: "Lifetime for $149 this spring",
    lead: "Tax refund season is gear season. Spend it on tools you’ll open every week.",
    body: [
      "Skip another impulse plugin. Get Lifetime Cymasphere for $149 (was $199).",
      "CymaSynth is included. Use code SPRING27. Ends April 18.",
    ],
    couponCode: "SPRING27",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "April 18, 2027",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=SPRING27",
    utmCampaign: "spring_sessions_2027",
    theme: {
      heroBackground: "linear-gradient(135deg,#2D6A4F 0%,#52B788 100%)",
      heroText: "#FFFFFF",
      accent: "#D8F3DC",
      ctaBackground: "linear-gradient(90deg,#40916C,#1B4332)",
      ctaText: "#FFFFFF",
    },
  },
  {
    promoName: "summer_harmony_2027",
    campaignId: "fc733536-9bde-4355-9ec7-79a5c899cd6b",
    subject: "Lifetime $149 — summer sale (save $50)",
    preheader: "Code SUMMER27. CymaSynth included. Ends Jun 29.",
    eyebrow: "Summer of Harmony",
    headline: "Finish the project. Own the tools.",
    lead: "One Lifetime offer this summer — $149 instead of $199.",
    body: [
      "While other brands dump random plugin deals, we’re keeping it simple: Lifetime Cymasphere for $149.",
      "CymaSynth is included. Use code SUMMER27. Ends June 29.",
    ],
    couponCode: "SUMMER27",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "June 29, 2027",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=SUMMER27",
    utmCampaign: "summer_harmony_2027",
    theme: {
      heroBackground: "linear-gradient(135deg,#E85D04 0%,#F48C06 100%)",
      heroText: "#FFFFFF",
      accent: "#FFBA08",
      ctaBackground: "linear-gradient(90deg,#F48C06,#DC2F02)",
      ctaText: "#FFFFFF",
    },
  },
  {
    promoName: "studio_season_2027",
    campaignId: "4aceff68-5adf-4234-9bc6-c70d1a4b9171",
    subject: "Lifetime $149 — back to the studio (save $50)",
    preheader: "Code STUDIO27. Ends Sep 6. CymaSynth included.",
    eyebrow: "Fall studio sale",
    headline: "Own Lifetime for $149",
    lead: "Fall sessions are back. Lock in Lifetime before the semester rush.",
    body: [
      "Get Lifetime Cymasphere for $149 (was $199). CymaSynth is included.",
      "Use code STUDIO27 at checkout. Ends September 6.",
    ],
    couponCode: "STUDIO27",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "September 6, 2027",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=STUDIO27",
    utmCampaign: "studio_season_2027",
    theme: {
      heroBackground: "linear-gradient(135deg,#C47B3A 0%,#8B4513 100%)",
      heroText: "#FFFFFF",
      accent: "#F5D76E",
      ctaBackground: "linear-gradient(90deg,#C47B3A,#8B4513)",
      ctaText: "#FFFFFF",
    },
  },
  {
    promoName: "treat_lifetime_2027",
    campaignId: "7716d2ff-d1c7-4f5b-b4ed-790925f1f660",
    subject: "Lifetime $149 before Black Friday (TREAT27)",
    preheader: "Save $50. CymaSynth included. Ends Oct 31.",
    eyebrow: "Limited Halloween offer",
    headline: "Lifetime for $149. No tricks.",
    lead: "A clean $50 cut on Lifetime — before Black Friday.",
    body: [
      "Lifetime Cymasphere for $149 (was $199). CymaSynth included.",
      "Use code TREAT27. Ends October 31.",
      "Black Friday brings the $99 floor. Grab $149 Lifetime now if you don’t want to wait.",
    ],
    couponCode: "TREAT27",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "October 31, 2027",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=TREAT27",
    utmCampaign: "treat_lifetime_2027",
    theme: {
      heroBackground: "linear-gradient(135deg,#B45309 0%,#7C2D12 100%)",
      heroText: "#FFF7ED",
      accent: "#FBBF24",
      ctaBackground: "linear-gradient(90deg,#EA580C,#9A3412)",
      ctaText: "#FFF7ED",
    },
  },
  {
    promoName: "bfcm_2027",
    campaignId: "fc9bea5c-babb-47ab-b629-c815199e6051",
    subject: "Lifetime $99 — lowest price of 2027",
    preheader: "Code BFCM2027. Was $199. Ends Dec 3.",
    eyebrow: "Black Friday · Cyber Week",
    headline: "Lifetime for $99",
    lead: "Lowest Lifetime price of 2027. Save $100.",
    body: [
      "Pay once. Keep Cymasphere and CymaSynth.",
      "Use code BFCM2027. Ends December 3.",
      "This is the floor for the year. Don’t wait for a lower number — there isn’t one.",
    ],
    couponCode: "BFCM2027",
    compareAtUsd: 199,
    salePriceUsd: 99,
    endsLabel: "December 3, 2027",
    ctaLabel: "Get Lifetime for $99",
    ctaPath: "/?promo=BFCM2027",
    utmCampaign: "bfcm_2027",
    isBestOfYear: true,
    theme: {
      heroBackground: "linear-gradient(135deg,#FF6B6B 0%,#B30000 100%)",
      heroText: "#FFFFFF",
      accent: "#FFD700",
      ctaBackground: "linear-gradient(90deg,#FFD700,#F59E0B)",
      ctaText: "#1A0000",
    },
  },
  {
    promoName: "christmas_2027",
    campaignId: "b8407f8a-1b84-4faa-9960-cf3366edac6d",
    subject: "Christmas Lifetime $149 — last chance of 2027",
    preheader: "Code XMAS27. Save $50. Ends Dec 31.",
    eyebrow: "Christmas sale",
    headline: "Gift yourself Lifetime for $149",
    lead: "Close the year owning your tools — not renting them.",
    body: [
      "Lifetime Cymasphere for $149 (was $199). CymaSynth included.",
      "Use code XMAS27. Last chance of 2027. Ends December 31.",
    ],
    couponCode: "XMAS27",
    compareAtUsd: 199,
    salePriceUsd: 149,
    endsLabel: "December 31, 2027",
    ctaLabel: "Get Lifetime for $149",
    ctaPath: "/?promo=XMAS27",
    utmCampaign: "christmas_2027",
    theme: {
      heroBackground: "linear-gradient(135deg,#0B3D2E 0%,#8B1E1E 100%)",
      heroText: "#FFFFFF",
      accent: "#D4AF37",
      ctaBackground: "linear-gradient(90deg,#D4AF37,#B8860B)",
      ctaText: "#0B3D2E",
    },
  },
];
