const PRODUCTION_CROWVO_APP_URL = "https://app.crow-vo.com";
const LOCAL_CROWVO_APP_URL = "http://localhost:3001";

function normalizeUrl(value: string) {
  return value.trim().replace(/\/+$/, "");
}

function isLocalUrl(value: string) {
  try {
    const hostname = new URL(value).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return value.includes("localhost");
  }
}

/** Public URL of the Crowvo web app (login, join, /app/*). */
export function getCrowvoAppUrl() {
  const isProduction = process.env.NODE_ENV === "production";
  const configured = process.env.NEXT_PUBLIC_CROWVO_APP_URL?.trim();
  if (configured) {
    const normalized = normalizeUrl(configured);
    if (!isProduction || !isLocalUrl(normalized)) return normalized;
  }

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site && !site.includes("localhost")) {
    try {
      const host = new URL(site).hostname;
      if (host === "crow-vo.com" || host.endsWith(".crow-vo.com")) {
        return PRODUCTION_CROWVO_APP_URL;
      }
    } catch {
      /* ignore */
    }
  }

  return isProduction ? PRODUCTION_CROWVO_APP_URL : LOCAL_CROWVO_APP_URL;
}

export const crowvoAppUrl = getCrowvoAppUrl();
