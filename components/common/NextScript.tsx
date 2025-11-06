import Script, { ScriptProps } from "next/script";

/**
 * NextScript - A wrapper for Next.js Script component with default settings
 * Helps to optimize third-party script loading
 */
interface NextScriptProps extends Omit<ScriptProps, "src" | "id" | "strategy"> {
  src?: string;
  id: string;
  strategy?: "beforeInteractive" | "afterInteractive" | "lazyOnload" | "worker";
  onLoad?: () => void;
  onError?: () => void;
  dangerouslySetInnerHTML?: { __html: string };
  children?: React.ReactNode;
}

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

interface GoogleAnalyticsProps {
  id: string;
}

// Predefined script for Google Analytics
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

interface IntercomProps {
  appId: string;
}

// Predefined script for Intercom
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

interface GoogleTagManagerProps {
  gtmId: string;
}

/**
 * Google Tag Manager - Must be loaded in the <head> section
 * This initializes the dataLayer and loads GTM container
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
 * Google Tag Manager Container Script
 * This loads the actual GTM container - should be placed right after opening <body> tag
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

interface MetaPixelProps {
  pixelId: string;
}

/**
 * Meta (Facebook) Pixel
 * Tracks page views and custom events for Facebook/Instagram ads
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
