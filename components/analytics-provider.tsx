"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { trackEvent } from "@/lib/analytics-client";

export function AnalyticsProvider() {
  const pathname = usePathname();

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }

    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
      capture_pageview: false,
    });
  }, []);

  useEffect(() => {
    posthog.capture("$pageview", { pathname });
    trackEvent("page_view", { pathname });
  }, [pathname]);

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

  return null;
}
