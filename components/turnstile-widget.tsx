"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; theme?: "dark" | "light" },
      ) => string;
      remove?: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onTokenRef = useRef(onToken);

  useEffect(() => {
    onTokenRef.current = onToken;
  }, [onToken]);

  useEffect(() => {
    let pollId: number | undefined;
    let widgetId: string | undefined;
    let isUnmounted = false;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      return;
    }

    const renderWidget = () => {
      if (isUnmounted || widgetId || !containerRef.current || !window.turnstile) {
        return Boolean(widgetId);
      }

      widgetId = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (token) => onTokenRef.current(token),
        theme: "dark",
      });
      return true;
    };

    if (!renderWidget()) {
      pollId = window.setInterval(() => {
        if (renderWidget() && pollId !== undefined) {
          window.clearInterval(pollId);
          pollId = undefined;
        }
      }, 100);
    }

    return () => {
      isUnmounted = true;
      if (pollId !== undefined) {
        window.clearInterval(pollId);
      }
      if (widgetId && window.turnstile?.remove) {
        window.turnstile.remove(widgetId);
      }
    };
  }, []);

  return <div ref={containerRef} className="min-h-16" />;
}
