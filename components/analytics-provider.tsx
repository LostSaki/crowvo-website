"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { trackEvent } from "@/lib/analytics-client";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  const hotjarId = process.env.NEXT_PUBLIC_HOTJAR_ID;

  useEffect(() => {
    if (isAdminRoute || !posthogKey) {
      return;
    }

    posthog.init(posthogKey, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false,
    });
  }, [isAdminRoute, posthogKey]);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    if (posthogKey) {
      posthog.capture("$pageview", { pathname });
    }
    trackEvent("page_view", { pathname });
  }, [isAdminRoute, pathname, posthogKey]);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    const marks = [25, 50, 75, 100];
    const seen = new Set<number>();

    const onScroll = () => {
      const fullHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (fullHeight <= 0) {
        return;
      }
      const percentage = Math.round((window.scrollY / fullHeight) * 100);
      for (const mark of marks) {
        if (percentage >= mark && !seen.has(mark)) {
          seen.add(mark);
          posthog.capture("scroll_depth", { mark, pathname: window.location.pathname });
          trackEvent("scroll_depth", { mark, pathname: window.location.pathname });
        }
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [isAdminRoute]);

  useEffect(() => {
    if (isAdminRoute) {
      return;
    }

    const handler = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const tracked = target?.closest("[data-analytics-event]") as HTMLElement | null;
      if (!tracked) {
        return;
      }
      const eventName = tracked.getAttribute("data-analytics-event");
      if (!eventName) {
        return;
      }
      const cta = tracked.getAttribute("data-analytics-cta");
      trackEvent(eventName, { cta: cta ?? "unknown" });
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [isAdminRoute]);

  if (isAdminRoute) {
    return null;
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
    </>
  );
}
