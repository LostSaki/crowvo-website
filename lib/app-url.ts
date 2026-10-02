const PRODUCTION_APP_URL = "https://app.crow-vo.com";
const LOCAL_APP_URL = "http://localhost:3001";

function isLocalHostname(hostname?: string | null) {
  if (!hostname) return false;
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return host === "localhost" || host.endsWith(".localhost") || host === "127.0.0.1" || host === "::1";
}

function hostnameOf(value?: string | null) {
  if (!value) return "";
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

/** Hostname this page is actually being served from, when we can tell. */
function resolveServingHostname(hostname?: string) {
  if (hostname) return hostname.toLowerCase();
  if (typeof window !== "undefined") return window.location.hostname.toLowerCase();
  return hostnameOf(process.env.NEXT_PUBLIC_SITE_URL);
}

/**
 * Public URL of the Crowvo web app (login, join, /app/*).
 *
 * The target is decided by where this page is being served from, not by NODE_ENV:
 * served locally, you get the local app; served from any real hostname, you get the
 * production app. A localhost value can never be emitted from a real hostname.
 */
export function getCrowvoAppUrl(hostname?: string) {
  const configured = process.env.NEXT_PUBLIC_CROWVO_APP_URL?.trim().replace(/\/$/, "");
  const servingHost = resolveServingHostname(hostname);

  // Served from a local hostname — the local app is the correct target.
  if (isLocalHostname(servingHost)) {
    return configured || LOCAL_APP_URL;
  }

  // Hostname unknown (server render with no request host). Only a dev server may fall
  // back to localhost; anything else resolves to production.
  if (!servingHost && process.env.NODE_ENV !== "production") {
    return configured || LOCAL_APP_URL;
  }

  // Served from a real hostname. Honour a configured non-local URL (staging, previews),
  // but never emit localhost from here.
  if (configured && !isLocalHostname(hostnameOf(configured))) {
    return configured;
  }

  return PRODUCTION_APP_URL;
}

/** Server / static fallback — prefer getCrowvoAppUrl() in client components. */
export const crowvoAppUrl = getCrowvoAppUrl();
