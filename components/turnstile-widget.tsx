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
    if (!siteKey) {
      return;
    }

    let timeout: number | undefined;
    let rendered = false;

    const renderWhenReady = () => {
      if (!containerRef.current || rendered) {
        return;
      }

      if (!window.turnstile) {
        timeout = window.setTimeout(renderWhenReady, 100);
        return;
      }

      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        theme: "dark",
      });
      rendered = true;
    };

    renderWhenReady();

    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [onToken]);

  return <div ref={containerRef} className="min-h-16" />;
}
