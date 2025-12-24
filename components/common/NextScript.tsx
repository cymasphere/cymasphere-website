/**
 * @fileoverview NextScript Component and Third-Party Script Utilities
 * @module components/common/NextScript
 * 
 * Provides a wrapper for Next.js Script component with optimized default settings,
 * and pre-configured components for common third-party scripts including Google Analytics,
 * Google Tag Manager, Meta Pixel, and Intercom.
 * 
 * @example
 * // Basic NextScript usage
 * <NextScript 
 *   id="my-script" 
 *   src="https://example.com/script.js" 
 *   strategy="afterInteractive" 
 * />
 * 
 * @example
 * // Google Analytics
 * <GoogleAnalytics id="G-XXXXXXXXXX" />
 * 
 * @example
 * // Meta Pixel
 * <MetaPixel pixelId="123456789" />
 */

import Script, { ScriptProps } from "next/script";

/**
 * @brief Props for NextScript component
 */
interface NextScriptProps extends Omit<ScriptProps, "src" | "id" | "strategy"> {
  /** @param {string} [src] - URL of the script to load */
  src?: string;
  /** @param {string} id - Unique identifier for the script */
  id: string;
  /** @param {"beforeInteractive"|"afterInteractive"|"lazyOnload"|"worker"} [strategy="afterInteractive"] - Loading strategy */
  strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";
  /** @param {() => void} [onLoad] - Callback when script loads successfully */
  onLoad?: () => void;
  /** @param {() => void} [onError] - Callback when script fails to load */
  onError?: () => void;
  /** @param {{ __html: string }} [dangerouslySetInnerHTML] - Inline script content */
  dangerouslySetInnerHTML?: { __html: string };
  /** @param {React.ReactNode} [children] - Child elements */
  children?: React.ReactNode;
}

/**
 * @brief NextScript component
 * 
 * Wrapper for Next.js Script component with optimized default settings.
 * Helps ensure proper script loading strategies for performance.
 * 
 * @param {NextScriptProps} props - Component props
 * @returns {JSX.Element} The rendered script component
 * 
 * @note Default strategy is "afterInteractive" for optimal performance
 * @note All Next.js Script props are supported except src, id, and strategy (which are explicitly typed)
 */
const NextScript: React.FC<NextScriptProps> = ({
  src,
  id,
  strategy = "afterInteractive", // Options: beforeInteractive, afterInteractive, lazyOnload, worker
  onLoad,
  onError,
  ...props
}) => {
  return (
    <Script
      id={id}
      src={src}
      strategy={strategy}
      onLoad={onLoad}
      onError={onError}
      {...props}
    />
  );
};

/**
 * @brief Props for GoogleAnalytics component
 */
interface GoogleAnalyticsProps {
  /** @param {string} id - Google Analytics measurement ID (e.g., "G-XXXXXXXXXX") */
  id: string;
}

/**
 * @brief GoogleAnalytics component
 * 
 * Pre-configured component for loading Google Analytics 4 (GA4).
 * Loads both the gtag.js library and initialization script.
 * 
 * @param {GoogleAnalyticsProps} props - Component props
 * @returns {JSX.Element} Two script components for GA4
 * 
 * @note Uses "afterInteractive" strategy for optimal performance
 * @note Automatically initializes dataLayer and configures tracking
 */
export const GoogleAnalytics = ({ id }: GoogleAnalyticsProps) => (
  <>
    <NextScript
      id="ga-script-1"
      strategy="afterInteractive"
      src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
    />
    <NextScript
      id="ga-script-2"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${id}');
        `,
      }}
    />
  </>
);

/**
 * @brief Props for Intercom component
 */
interface IntercomProps {
  /** @param {string} appId - Intercom application ID */
  appId: string;
}

/**
 * @brief Intercom component
 * 
 * Pre-configured component for loading Intercom chat widget.
 * 
 * @param {IntercomProps} props - Component props
 * @returns {JSX.Element} The Intercom script component
 * 
 * @note Uses "lazyOnload" strategy to minimize impact on page load
 * @note Automatically handles widget initialization and settings
 */
export const Intercom = ({ appId }: IntercomProps) => (
  <NextScript
    id="intercom-script"
    strategy="lazyOnload"
    dangerouslySetInnerHTML={{
      __html: `
        window.intercomSettings = {
          app_id: "${appId}"
        };
        (function(){var w=window;var ic=w.Intercom;if(typeof ic==="function"){ic('reattach_activator');ic('update',w.intercomSettings);}else{var d=document;var i=function(){i.c(arguments);};i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;var l=function(){var s=d.createElement('script');s.type='text/javascript';s.async=true;s.src='https://widget.intercom.io/widget/' + appId;var x=d.getElementsByTagName('script')[0];x.parentNode.insertBefore(s,x);};if(document.readyState==='complete'){l();}else if(w.attachEvent){w.attachEvent('onload',l);}else{w.addEventListener('load',l,false);}}})();
      `,
    }}
  />
);

/**
 * @brief Props for GoogleTagManager components
 */
interface GoogleTagManagerProps {
  /** @param {string} gtmId - Google Tag Manager container ID */
  gtmId: string;
}

/**
 * @brief GoogleTagManager component
 * 
 * Initializes Google Tag Manager dataLayer. Must be placed in the <head> section.
 * This component only initializes the dataLayer - use GoogleTagManagerContainer
 * to load the actual GTM container script.
 * 
 * @param {GoogleTagManagerProps} props - Component props
 * @returns {JSX.Element} GTM initialization script and noscript fallback
 * 
 * @note Must be placed in <head> section
 * @note Includes noscript fallback for users with JavaScript disabled
 */
export const GoogleTagManager = ({ gtmId }: GoogleTagManagerProps) => (
  <>
    {/* GTM Script - Must be in <head> */}
    <NextScript
      id="gtm-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
        `,
      }}
    />
    {/* GTM NoScript - Must be in <body> immediately after opening tag */}
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
        height="0"
        width="0"
        style={{ display: 'none', visibility: 'hidden' }}
      />
    </noscript>
  </>
);

/**
 * @brief GoogleTagManagerContainer component
 * 
 * Loads the actual Google Tag Manager container script.
 * Should be placed immediately after the opening <body> tag.
 * 
 * @param {GoogleTagManagerProps} props - Component props
 * @returns {JSX.Element} The GTM container script
 * 
 * @note Should be placed right after opening <body> tag
 * @note Works in conjunction with GoogleTagManager component in <head>
 */
export const GoogleTagManagerContainer = ({ gtmId }: GoogleTagManagerProps) => (
  <NextScript
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
);

/**
 * @brief Props for MetaPixel component
 */
interface MetaPixelProps {
  /** @param {string} pixelId - Meta (Facebook) Pixel ID */
  pixelId: string;
}

/**
 * @brief MetaPixel component
 * 
 * Pre-configured component for loading Meta (Facebook) Pixel.
 * Automatically tracks page views and enables custom event tracking
 * for Facebook and Instagram advertising campaigns.
 * 
 * @param {MetaPixelProps} props - Component props
 * @returns {JSX.Element} Meta Pixel script and noscript fallback
 * 
 * @note Uses "afterInteractive" strategy
 * @note Automatically fires PageView event on load
 * @note Includes noscript fallback for users with JavaScript disabled
 */
export const MetaPixel = ({ pixelId }: MetaPixelProps) => (
  <>
    <NextScript
      id="meta-pixel-script"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          !function(f,b,e,v,n,t,s)
          {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};
          if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
          n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t,s)}(window, document,'script',
          'https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${pixelId}');
          fbq('track', 'PageView');
        `,
      }}
    />
    <noscript>
      <img
        height="1"
        width="1"
        style={{ display: 'none' }}
        src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
        alt=""
      />
    </noscript>
  </>
);

export default NextScript;
