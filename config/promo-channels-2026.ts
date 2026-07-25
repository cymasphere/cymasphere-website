/**
 * @fileoverview Email and Meta creative briefs aligned to the 2026 H2 promotion calendar.
 * @module config/promo-channels-2026
 * @description Keeps banner, email, and Meta messaging on the same windows, prices, and
 * coupon codes so BFCM and seasonal sales are not banner-only.
 * @note Promotions live in the `promotions` table; this file is the channel playbook.
 * @example
 * ```ts
 * import { PROMO_CHANNELS_2026_H2 } from "@/config/promo-channels-2026";
 * const bfcm = PROMO_CHANNELS_2026_H2.find((c) => c.promoName === "bfcm_2026");
 * ```
 */

/**
 * @brief Channel creative package for one lifetime promotion window.
 */
export interface PromoChannelCreative {
  /** @brief Internal `promotions.name` key */
  promoName: string;
  /** @brief Public banner / campaign title */
  title: string;
  /** @brief Customer-facing promo code */
  couponCode: string;
  /** @brief Lifetime sale price in USD */
  lifetimePriceUsd: number;
  /** @brief PST calendar window (inclusive) */
  windowPst: { start: string; end: string };
  /** @brief Email subject, preheader, and body outline */
  email: {
    subject: string;
    preheader: string;
    bodyLines: string[];
    ctaLabel: string;
    ctaPath: string;
  };
  /** @brief Meta ads primary text, headline, description, CTA */
  meta: {
    primaryText: string;
    headline: string;
    description: string;
    callToAction: "SHOP_NOW" | "LEARN_MORE" | "BUY_NOW";
    utmCampaign: string;
  };
}

/**
 * @brief 2026 H2 channel creatives (Studio, Treat, BFCM, Christmas).
 * @note Mid-season and Christmas stay at $149; only BFCM goes to $99.
 */
export const PROMO_CHANNELS_2026_H2: PromoChannelCreative[] = [
  {
    promoName: "studio_season_2026",
    title: "Back to the Studio",
    couponCode: "STUDIO26",
    lifetimePriceUsd: 149,
    windowPst: { start: "2026-08-28", end: "2026-09-07" },
    email: {
      subject: "Back to the Studio — Lifetime for $149",
      preheader: "Fall creative season starts now. Code STUDIO26.",
      bodyLines: [
        "Summer’s over. The sessions are back.",
        "Lock in Lifetime access to Cymasphere (and CymaSynth) for $149 — normally $199.",
        "Use code STUDIO26 at checkout. Offer ends September 7.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=STUDIO26",
    },
    meta: {
      primaryText:
        "Fall creative season starts now. Lifetime harmony workflow for $149 — use STUDIO26. Includes CymaSynth.",
      headline: "Back to the Studio — $149 Lifetime",
      description: "Limited time. Ends Sep 7.",
      callToAction: "SHOP_NOW",
      utmCampaign: "studio_season_2026",
    },
  },
  {
    promoName: "treat_lifetime_2026",
    title: "Treat of a Lifetime",
    couponCode: "TREAT26",
    lifetimePriceUsd: 149,
    windowPst: { start: "2026-10-24", end: "2026-11-02" },
    email: {
      subject: "Treat of a Lifetime — $149",
      preheader: "Halloween treat: Lifetime for $149. Code TREAT26.",
      bodyLines: [
        "Halloween treat for your studio — not a costume sale.",
        "Lifetime Cymasphere (with CymaSynth) for $149 — normally $199.",
        "Code TREAT26. No tricks. Ends November 2 — then Black Friday.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=TREAT26",
    },
    meta: {
      primaryText:
        "Treat of a Lifetime: Cymasphere Lifetime $149 (was $199). Halloween studio treat — code TREAT26 through Nov 2. Includes CymaSynth.",
      headline: "Treat of a Lifetime — $149",
      description: "No tricks. Ends Nov 2.",
      callToAction: "SHOP_NOW",
      utmCampaign: "treat_lifetime_2026",
    },
  },
  {
    promoName: "bfcm_2026",
    title: "Black Friday — Best Price of the Year",
    couponCode: "BFCM2026",
    lifetimePriceUsd: 99,
    windowPst: { start: "2026-11-24", end: "2026-12-02" },
    email: {
      subject: "Best price of 2026: Lifetime $99",
      preheader: "Black Friday / Cyber Week — code BFCM2026. Was $199.",
      bodyLines: [
        "This is the lowest Lifetime price all year.",
        "Cymasphere Lifetime — $99 (was $199). Includes CymaSynth.",
        "Code BFCM2026. Ends Cyber Week (December 2).",
      ],
      ctaLabel: "Get Lifetime for $99",
      ctaPath: "/?promo=BFCM2026",
    },
    meta: {
      primaryText:
        "Best price of 2026: Cymasphere Lifetime $99 (was $199). Code BFCM2026. Ends Cyber Week.",
      headline: "Black Friday: Lifetime $99",
      description: "Lowest price of the year. Ends Dec 2.",
      callToAction: "BUY_NOW",
      utmCampaign: "bfcm_2026",
    },
  },
  {
    promoName: "christmas_2026",
    title: "Christmas Lifetime Sale",
    couponCode: "XMAS26",
    lifetimePriceUsd: 149,
    windowPst: { start: "2026-12-12", end: "2026-12-31" },
    email: {
      subject: "Christmas Lifetime Sale — $149",
      preheader: "Put a studio under the tree. Code XMAS26 through Dec 31.",
      bodyLines: [
        "Put a studio under the tree.",
        "Lifetime Cymasphere (with CymaSynth) for $149 — normally $199.",
        "Code XMAS26. Last chance of 2026 — ends December 31.",
      ],
      ctaLabel: "Get Lifetime for $149",
      ctaPath: "/?promo=XMAS26",
    },
    meta: {
      primaryText:
        "Christmas Lifetime Sale: Cymasphere for $149 (was $199). Put a studio under the tree — code XMAS26 through Dec 31. Includes CymaSynth.",
      headline: "Christmas Sale — Lifetime $149",
      description: "Last chance of 2026. Ends Dec 31.",
      callToAction: "SHOP_NOW",
      utmCampaign: "christmas_2026",
    },
  },
];

/**
 * @brief Looks up channel creative by promotions.name.
 * @param promoName Internal promotion name
 * @returns Matching creative or undefined
 */
export function getPromoChannelCreative(
  promoName: string,
): PromoChannelCreative | undefined {
  return PROMO_CHANNELS_2026_H2.find((c) => c.promoName === promoName);
}
