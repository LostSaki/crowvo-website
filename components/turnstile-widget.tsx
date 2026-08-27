"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; theme?: "dark" | "light" },
      ) => string | undefined;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      return;
    }

    let cancelled = false;
    const renderWidget = () => {
      if (cancelled || renderedRef.current || !containerRef.current || !window.turnstile) {
        return;
      }
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        theme: "dark",
      });
      renderedRef.current = true;
    };

    renderWidget();
    const intervalId = window.setInterval(renderWidget, 100);
    const timeoutId = window.setTimeout(() => window.clearInterval(intervalId), 5_000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [onToken]);

  return <div ref={containerRef} className="min-h-16" />;
}
