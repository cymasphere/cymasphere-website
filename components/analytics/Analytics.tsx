"use client";

import Script from "next/script";
import { GoogleAnalytics, MetaPixel } from "@/components/common/NextScript";

/**
 * Analytics Component
 * 
 * Conditionally loads all tracking scripts based on environment variables:
 * - Google Tag Manager (GTM) - Required for Meta cAPI via Stape.io
 * - Google Analytics - Can be loaded directly or through GTM
 * - Meta Pixel - Facebook/Instagram tracking
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_GTM_ID: Google Tag Manager Container ID (e.g., GTM-XXXXXXX)
 * - NEXT_PUBLIC_GA_ID: Google Analytics Measurement ID (e.g., G-XXXXXXXXXX) - Optional if using GTM
 * - NEXT_PUBLIC_META_PIXEL_ID: Meta Pixel ID (e.g., 123456789012345) - Optional
 * 
 * Updated: Environment variables configured in Vercel
 * NOTE: GTM DataLayer now uses 'afterInteractive' to not block FCP
 */
export default function Analytics() {
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const metaPixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID;

  return (
    <>
      {/* Google Tag Manager - Initialize dataLayer first */}
      {gtmId && (
        <>
          {/* GTM DataLayer initialization - use afterInteractive to not block FCP */}
          <Script
            id="gtm-datalayer"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
              `,
            }}
          />
          {/* GTM Container Script - use afterInteractive to not block FCP */}
          <Script
            id="gtm-container"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                })(window,document,'script','dataLayer','${gtmId}');
              `,
            }}
          />
          {/* GTM NoScript fallback */}
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        </>
      )}

      {/* Google Analytics - Only load directly if GTM is not used */}
      {gaId && !gtmId && <GoogleAnalytics id={gaId} />}

      {/* Meta Pixel - Loads independently */}
      {metaPixelId && <MetaPixel pixelId={metaPixelId} />}
    </>
  );
}

