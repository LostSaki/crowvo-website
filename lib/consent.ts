"use client";

/**
 * Analytics consent.
 *
 * Nothing on this site used to gate analytics — Google Analytics, Hotjar, PostHog
 * and the first-party event stream all started on page load, gated only on their
 * environment variable being set. This module is the single gate they now share.
 *
 * The default is the important part: with no choice stored, `analyticsAllowed()`
 * is false. Consent has to be given, never assumed.
 */

export const CONSENT_KEY = "crowvo-consent";
export const CONSENT_EVENT = "crowvo-consent-change";

export type ConsentChoice = "all" | "essential";

function isChoice(value: unknown): value is ConsentChoice {
  return value === "all" || value === "essential";
}

/** The stored choice, or null if the visitor has not answered yet. */
export function readConsent(): ConsentChoice | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CONSENT_KEY);
    return isChoice(raw) ? raw : null;
  } catch {
    // Private windows and blocked site data throw on access. Treat an
    // unreadable store as "no choice given", which denies analytics.
    return null;
  }
}

/** True only when the visitor actively accepted. Unanswered means no. */
export function analyticsAllowed(): boolean {
  return readConsent() === "all";
}

export function writeConsent(choice: ConsentChoice) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // Still dispatch below: the choice holds for this page view even if it
    // cannot be persisted, which is better than silently ignoring the click.
  }
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: choice }));
}

/** Subscribe to consent changes, including from another tab. */
export function onConsentChange(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const storage = (e: StorageEvent) => {
    if (e.key === CONSENT_KEY) handler();
  };
  window.addEventListener(CONSENT_EVENT, handler);
  window.addEventListener("storage", storage);
  return () => {
    window.removeEventListener(CONSENT_EVENT, handler);
    window.removeEventListener("storage", storage);
  };
}
