"use client";

import { useEffect, useState } from "react";
import { readConsent, writeConsent } from "@/lib/consent";

/**
 * Shown until the visitor answers. Both buttons are a real answer — there is no
 * dismiss, because dismissing would leave the question open while they keep
 * browsing, and "unanswered" is the state that denies analytics.
 */
export function ConsentBanner() {
  // Render nothing on the server and on first paint: localStorage is not
  // readable during SSR, so assuming "needs a banner" would flash one at
  // everyone who has already answered.
  const [decided, setDecided] = useState(true);

  useEffect(() => {
    setDecided(readConsent() !== null);
  }, []);

  if (decided) return null;

  const choose = (choice: "all" | "essential") => {
    writeConsent(choice);
    setDecided(true);
  };

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-labelledby="consent-title"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-surface px-4 py-4 sm:px-6"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p id="consent-title" className="font-semibold">
            Cookies and analytics
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted">
            We use analytics to understand which pages help people and which do not. Choose Essential
            only and we will not load them or record anything about your visit. You can change this by
            clearing site data.{" "}
            <a href="/privacy" className="text-accent-soft hover:underline">
              Privacy policy
            </a>
          </p>
        </div>
        <div className="flex shrink-0 gap-3">
          <button
            type="button"
            onClick={() => choose("essential")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border px-4 py-2 text-sm text-muted transition hover:border-border-strong hover:text-foreground"
          >
            Essential only
          </button>
          <button
            type="button"
            onClick={() => choose("all")}
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-hover"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
