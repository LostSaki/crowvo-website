"use client";

import posthog from "posthog-js";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";
import { analyticsAllowed, onConsentChange } from "@/lib/consent";

export function AnalyticsProvider() {
  const pathname = usePathname();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const sync = () => setAllowed(analyticsAllowed());
    sync();
    return onConsentChange(sync);
  }, []);

  // Only initialise once consent is given. `started` keeps a second render from
  // re-initialising an already-running client.
  const started = useRef(false);
  useEffect(() => {
    if (!allowed || started.current) return;
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) return;

    started.current = true;
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false,
    });
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    if (started.current) posthog.capture("$pageview", { pathname });
    trackEvent("page_view", { pathname });
  }, [allowed, pathname]);

  useEffect(() => {
    if (!allowed) return;
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
          if (started.current) posthog.capture("scroll_depth", { mark, pathname: window.location.pathname });
          trackEvent("scroll_depth", { mark, pathname: window.location.pathname });
        }
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
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
  }, [allowed]);

  return null;
}
