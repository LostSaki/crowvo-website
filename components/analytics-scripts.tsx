"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

export function AnalyticsScripts() {
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const isAdmin = pathname?.startsWith("/admin") ?? false;

  if (isAdmin) {
    return null;
  }

  const numericHotjarId = hotjarId && /^\d+$/.test(hotjarId) ? hotjarId : null;

  return (
    <>
      {gaId ? (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(gaId)}`} strategy="afterInteractive" />
          <Script id="ga-init" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', ${JSON.stringify(gaId)});`}
          </Script>
        </>
      ) : null}
      {numericHotjarId ? (
        <Script id="hotjar-init" strategy="afterInteractive">
          {`(function(h,o,t,j,a,r){h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
            h._hjSettings={hjid:${numericHotjarId},hjsv:6};
            a=o.getElementsByTagName('head')[0];r=o.createElement('script');r.async=1;
            r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;a.appendChild(r);
          })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');`}
        </Script>
      ) : null}
    </>
  );
}
