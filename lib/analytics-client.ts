"use client";

import posthog from "posthog-js";

function getSessionId() {
  const key = "crowvo-session-id";
  const existing = localStorage.getItem(key);
  if (existing) {
    return existing;
  }
  const next = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(key, next);
  return next;
}

function getAttribution() {
  const params = new URLSearchParams(window.location.search);
  return {
    utmSource: params.get("utm_source") ?? undefined,
    utmMedium: params.get("utm_medium") ?? undefined,
    utmCampaign: params.get("utm_campaign") ?? undefined,
  };
}

export function trackEvent(eventName: string, metadata?: Record<string, string | number | boolean | null>) {
  const payload = {
    eventName,
    path: window.location.pathname,
    referrer: document.referrer || undefined,
    sessionId: getSessionId(),
    ...getAttribution(),
    metadata,
  };

  posthog.capture(eventName, payload);
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined);
}
