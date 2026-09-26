"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (
        target: HTMLElement,
        options: { sitekey: string; callback: (token: string) => void; theme?: "dark" | "light" },
      ) => string;
    };
  }
}

export function TurnstileWidget({ onToken }: { onToken: (token: string) => void }) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);
  const [scriptReady, setScriptReady] = useState(false);

  useEffect(() => {
    if (!siteKey || !scriptReady || renderedRef.current || !containerRef.current || !window.turnstile) {
      return;
    }

    window.turnstile.render(containerRef.current, {
      sitekey: siteKey,
      callback: onToken,
      theme: "dark",
    });
    renderedRef.current = true;
  }, [onToken, scriptReady, siteKey]);

  if (!siteKey) {
    return null;
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
        strategy="afterInteractive"
        onLoad={() => setScriptReady(true)}
      />
      <div ref={containerRef} className="min-h-16" />
    </>
  );
}
