"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <main className="flex-1">{children}</main>;
  }

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
      <AnalyticsProvider />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
