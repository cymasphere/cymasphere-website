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

export default NextScript;
