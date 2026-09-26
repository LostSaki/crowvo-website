"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; theme?: "dark" | "light" },
      ) => void;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const container = containerRef.current;
    if (!siteKey || !container) {
      return;
    }

    let cancelled = false;
    let rendered = false;
    let timeout: number | undefined;

    const renderWhenReady = () => {
      if (cancelled || rendered) {
        return;
      }
      if (!window.turnstile) {
        timeout = window.setTimeout(renderWhenReady, 100);
        return;
      }
      window.turnstile.render(container, {
        sitekey: siteKey,
        callback: onToken,
        theme: "dark",
      });
      rendered = true;
    };

    renderWhenReady();

    return () => {
      cancelled = true;
      if (timeout) {
        window.clearTimeout(timeout);
      }
      container.innerHTML = "";
    };
  }, [onToken]);

  return <div ref={containerRef} className="min-h-16" />;
}
