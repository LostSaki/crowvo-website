"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import { analyticsAllowed, onConsentChange } from "@/lib/consent";

/**
 * Google Analytics and Hotjar, behind consent.
 *
 * These used to live directly in the server layout, gated only on their env var,
 * so they loaded for every visitor on first paint. Consent is a client-side fact,
 * so the tags have to be mounted from the client — rendering nothing until the
 * visitor has accepted means the third-party script is never fetched at all,
 * rather than fetched and then asked to behave.
 */
export function AnalyticsScripts({ gaId, hotjarId }: { gaId?: string; hotjarId?: string }) {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(analyticsAllowed());
    sync();
    return onConsentChange(sync);
  }, []);

  if (!allowed) return null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');`}
          </Script>
        </>
      ) : null}
      {hotjarId ? (
        <Script id="hotjar-init" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${hotjarId},hjsv:6};
            a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      ) : null}
    </>
  );
}
