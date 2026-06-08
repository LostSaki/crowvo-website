/** Public URL of the Crowvo web app (login, join, /app/*). */
export function getCrowvoAppUrl() {
  const configured = process.env.NEXT_PUBLIC_CROWVO_APP_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");

  const site = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (site && !site.includes("localhost")) {
    try {
      const host = new URL(site).hostname;
      if (host === "crow-vo.com" || host.endsWith(".crow-vo.com")) {
        return "https://app.crow-vo.com";
      }
    } catch {
      /* ignore */
    }
  }

  return "http://localhost:3001";
}

export const crowvoAppUrl = getCrowvoAppUrl();
