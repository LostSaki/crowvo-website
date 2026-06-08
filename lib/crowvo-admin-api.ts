const API_BASE = process.env.CROWVO_API_URL ?? "http://localhost:4000/v1";
const ADMIN_KEY = process.env.CROWVO_ADMIN_API_KEY ?? "";

export function crowvoAdminFetch(path: string, init?: RequestInit) {
  if (!ADMIN_KEY) {
    throw new Error("CROWVO_ADMIN_API_KEY is not configured on the website.");
  }
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  headers.set("x-admin-key", ADMIN_KEY);
  return fetch(`${API_BASE}/admin${path}`, { ...init, headers });
}
