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
  const renderedRef = useRef(false);

  useEffect(() => {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) {
      return;
    }
    const render = () => {
      if (!containerRef.current || !window.turnstile || renderedRef.current) {
        return;
      }
      renderedRef.current = true;
      window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: onToken,
        theme: "dark",
      });
      window.clearInterval(interval);
    };

    const interval = window.setInterval(render, 250);
    render();
    return () => window.clearInterval(interval);
  }, [onToken]);

  return <div ref={containerRef} className="min-h-16" />;
}
