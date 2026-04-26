"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import { usePathname } from "next/navigation";

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
    if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      return;
    }
    posthog.capture("$pageview", { pathname });
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
        }
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return null;
}
