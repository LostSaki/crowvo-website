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
    if (!siteKey || !containerRef.current || renderedRef.current) {
      return;
    }

    let cancelled = false;
    const scriptSrc = "https://challenges.cloudflare.com/turnstile/v0/api.js";

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

    if (window.turnstile) {
      renderWidget();
      return;
    }

    let script = document.querySelector<HTMLScriptElement>(`script[src="${scriptSrc}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = scriptSrc;
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    }
    script.addEventListener("load", renderWidget);

    return () => {
      cancelled = true;
      script?.removeEventListener("load", renderWidget);
    };
  }, [onToken]);

  return <div ref={containerRef} className="min-h-16" />;
}
