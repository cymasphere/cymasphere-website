/**
 * @fileoverview Email and Meta creative briefs for the 2027 full-year promotion calendar.
 * @module config/promo-channels-2027
 * @description Aligns banner, email, and Meta messaging to seven lifetime promotions:
 * New Year, Spring Sessions, Summer of Harmony, Back to the Studio, Treat of a
 * Lifetime, BFCM, and Christmas. Mid-season and holiday offers stay at $149; only
 * BFCM goes to $99.
 * @note Promotions live in the `promotions` table; this file is the channel playbook.
 * @example
 * ```ts
 * import { PROMO_CHANNELS_2027 } from "@/config/promo-channels-2027";
 * const bfcm = PROMO_CHANNELS_2027.find((c) => c.promoName === "bfcm_2027");
 * ```
 */

import type { PromoChannelCreative } from "@/config/promo-channels-2026";

/**
 * @brief 2027 full-year channel creatives.
 * @note Lifetime-only; protect $199 list with one $99 BFCM deep cut.
 */
export const PROMO_CHANNELS_2027: PromoChannelCreative[] = [
  {
    promoName: "new_year_2027",
    title: "New Year, New Workflow",
    couponCode: "NEWYEAR27",
    lifetimePriceUsd: 149,
    windowPst: { start: "2027-01-08", end: "2027-01-25" },
    email: {
      subject: "New Year, New Workflow — Lifetime $149",
      preheader: "Start 2027 with Lifetime harmony tools. Code NEWYEAR27.",
      bodyLines: [
        "New year. New sessions. Same Lifetime deal that sticks.",
        "Cymasphere Lifetime (with CymaSynth) for $149 — normally $199.",
        "Code NEWYEAR27. Ends January 25.",
      ],
      ctaLabel: "Start Lifetime for $149",
      ctaPath: "/?promo=NEWYEAR27",
    },
    meta: {
      primaryText:
        "New Year, New Workflow: Lifetime Cymasphere for $149 (was $199). Code NEWYEAR27. Includes CymaSynth.",
      headline: "New Year Lifetime — $149",
      description: "Limited time. Ends Jan 25.",
      callToAction: "SHOP_NOW",
      utmCampaign: "new_year_2027",
    },
  },
  {
    promoName: "spring_sessions_2027",
    title: "Spring Sessions",
    couponCode: "SPRING27",
    lifetimePriceUsd: 149,
    windowPst: { start: "2027-04-08", end: "2027-04-18" },
    email: {
      subject: "Spring Sessions — Lifetime $149",
      preheader: "Tax-season studio upgrade. Code SPRING27.",
      bodyLines: [
        "Tax refund season is creator gear season.",
        "Lifetime Cymasphere for $149 (was $199) — code SPRING27.",
        "Offer ends April 18.",
      ],
      ctaLabel: "Upgrade for Spring — $149",
      ctaPath: "/?promo=SPRING27",
    },
    meta: {
      primaryText:
        "Spring Sessions: Lifetime Cymasphere $149 (was $199). Tax-season studio upgrade — code SPRING27 through Apr 18.",
      headline: "Spring Sessions — $149 Lifetime",
      description: "Ends Apr 18.",
      callToAction: "SHOP_NOW",
      utmCampaign: "spring_sessions_2027",
    },
  },
  {
    promoName: "summer_harmony_2027",
    title: "Summer of Harmony",
    couponCode: "SUMMER27",
    lifetimePriceUsd: 149,
    windowPst: { start: "2027-06-15", end: "2027-06-29" },
    email: {
      subject: "Summer of Harmony — Lifetime $149",
      preheader: "Midyear creator sale. Code SUMMER27.",
      bodyLines: [
        "While the industry runs summer sales, keep the focus on harmony.",
        "Lifetime Cymasphere for $149 (was $199) — code SUMMER27.",
        "Ends June 29.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=SUMMER27",
    },
    meta: {
      primaryText:
        "Summer of Harmony: Lifetime Cymasphere $149 (was $199). Code SUMMER27 through June 29. Includes CymaSynth.",
      headline: "Summer of Harmony — $149",
      description: "Midyear sale. Ends Jun 29.",
      callToAction: "SHOP_NOW",
      utmCampaign: "summer_harmony_2027",
    },
  },
  {
    promoName: "studio_season_2027",
    title: "Back to the Studio",
    couponCode: "STUDIO27",
    lifetimePriceUsd: 149,
    windowPst: { start: "2027-08-27", end: "2027-09-06" },
    email: {
      subject: "Back to the Studio — Lifetime $149",
      preheader: "Fall creative season starts now. Code STUDIO27.",
      bodyLines: [
        "Summer’s over. The sessions are back.",
        "Lifetime Cymasphere for $149 (was $199) — code STUDIO27.",
        "Offer ends September 6.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=STUDIO27",
    },
    meta: {
      primaryText:
        "Back to the Studio: Lifetime harmony workflow for $149 — use STUDIO27. Includes CymaSynth. Ends Sep 6.",
      headline: "Back to the Studio — $149",
      description: "Limited time. Ends Sep 6.",
      callToAction: "SHOP_NOW",
      utmCampaign: "studio_season_2027",
    },
  },
  {
    promoName: "treat_lifetime_2027",
    title: "Treat of a Lifetime",
    couponCode: "TREAT27",
    lifetimePriceUsd: 149,
    windowPst: { start: "2027-10-22", end: "2027-10-31" },
    email: {
      subject: "Treat of a Lifetime — $149",
      preheader: "Halloween treat: Lifetime for $149. Code TREAT27.",
      bodyLines: [
        "Halloween treat for your studio — not a costume sale.",
        "Lifetime Cymasphere (with CymaSynth) for $149 — normally $199.",
        "Code TREAT27. No tricks. Ends October 31 — then Black Friday.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=TREAT27",
    },
    meta: {
      primaryText:
        "Treat of a Lifetime: Cymasphere Lifetime $149 (was $199). Halloween studio treat — code TREAT27 through Oct 31. Includes CymaSynth.",
      headline: "Treat of a Lifetime — $149",
      description: "No tricks. Ends Oct 31.",
      callToAction: "SHOP_NOW",
      utmCampaign: "treat_lifetime_2027",
    },
  },
  {
    promoName: "bfcm_2027",
    title: "Black Friday — Best Price of the Year",
    couponCode: "BFCM2027",
    lifetimePriceUsd: 99,
    windowPst: { start: "2027-11-26", end: "2027-12-03" },
    email: {
      subject: "Best price of 2027: Lifetime $99",
      preheader: "Black Friday / Cyber Week — code BFCM2027. Was $199.",
      bodyLines: [
        "This is the lowest Lifetime price all year.",
        "Cymasphere Lifetime — $99 (was $199). Includes CymaSynth.",
        "Code BFCM2027. Ends Cyber Week (December 3).",
      ],
      ctaLabel: "Get Lifetime for $99",
      ctaPath: "/?promo=BFCM2027",
    },
    meta: {
      primaryText:
        "Best price of 2027: Cymasphere Lifetime $99 (was $199). Code BFCM2027. Ends Cyber Week.",
      headline: "Black Friday: Lifetime $99",
      description: "Lowest price of the year. Ends Dec 3.",
      callToAction: "BUY_NOW",
      utmCampaign: "bfcm_2027",
    },
  },
  {
    promoName: "christmas_2027",
    title: "Christmas Lifetime Sale",
    couponCode: "XMAS27",
    lifetimePriceUsd: 149,
    windowPst: { start: "2027-12-12", end: "2027-12-31" },
    email: {
      subject: "Christmas Lifetime Sale — $149",
      preheader: "Put a studio under the tree. Code XMAS27 through Dec 31.",
      bodyLines: [
        "Put a studio under the tree.",
        "Lifetime Cymasphere (with CymaSynth) for $149 — normally $199.",
        "Code XMAS27. Last chance of 2027 — ends December 31.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=XMAS27",
    },
    meta: {
      primaryText:
        "Christmas Lifetime Sale: Cymasphere for $149 (was $199). Code XMAS27 through Dec 31. Includes CymaSynth.",
      headline: "Christmas Sale — Lifetime $149",
      description: "Last chance of 2027. Ends Dec 31.",
      callToAction: "SHOP_NOW",
      utmCampaign: "christmas_2027",
    },
  },
];

/**
 * @brief Looks up 2027 channel creative by promotions.name.
 * @param promoName Internal promotion name
 * @returns Matching creative or undefined
 */
export function getPromoChannelCreative2027(
  promoName: string,
): PromoChannelCreative | undefined {
  return PROMO_CHANNELS_2027.find((c) => c.promoName === promoName);
}
