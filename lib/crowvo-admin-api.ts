const ADMIN_KEY = process.env.CROWVO_ADMIN_API_KEY ?? "";

function getApiBase() {
  const configured = process.env.CROWVO_API_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.NODE_ENV !== "production") return "http://localhost:4000/v1";
  throw new Error("CROWVO_API_URL is not configured on the website.");
}

export function crowvoAdminFetch(path: string, init?: RequestInit) {
  if (!ADMIN_KEY) {
    throw new Error("CROWVO_ADMIN_API_KEY is not configured on the website.");
  }
  const apiBase = getApiBase();
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-admin-key", ADMIN_KEY);
  return fetch(`${apiBase}/admin${path}`, { ...init, headers });
}
