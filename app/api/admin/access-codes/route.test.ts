import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "@/lib/admin-auth";
import { crowvoAdminFetch } from "@/lib/crowvo-admin-api";
import { GET, PATCH, POST } from "./route";

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/crowvo-admin-api", () => ({
  crowvoAdminFetch: vi.fn(),
}));

const requireAdminMock = vi.mocked(requireAdmin);
const crowvoAdminFetchMock = vi.mocked(crowvoAdminFetch);

function adminRequest(url = "https://crowvo.test/api/admin/access-codes", body?: unknown, method = "GET") {
  return new NextRequest(url, {
    body: body === undefined ? undefined : JSON.stringify(body),
    method,
  });
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("/api/admin/access-codes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ ok: true });
    crowvoAdminFetchMock.mockResolvedValue(jsonResponse({ ok: true }));
  });

  it("blocks unauthenticated reads before calling the admin API", async () => {
    requireAdminMock.mockRejectedValue(new Error("Missing or invalid authorization."));

    const response = await GET(adminRequest());

    await expect(response.json()).resolves.toEqual({ error: "Missing or invalid authorization." });
    expect(response.status).toBe(401);
    expect(crowvoAdminFetchMock).not.toHaveBeenCalled();
  });

  it("proxies access-code creation payloads and returns a created response", async () => {
    const payload = { code: "FOUNDERS100", maxRedemptions: 100 };
    crowvoAdminFetchMock.mockResolvedValue(jsonResponse({ id: "code_1", ...payload }));

    const response = await POST(adminRequest("https://crowvo.test/api/admin/access-codes", payload, "POST"));

    await expect(response.json()).resolves.toEqual({ id: "code_1", ...payload });
    expect(response.status).toBe(201);
    expect(crowvoAdminFetchMock).toHaveBeenCalledWith("/access-codes", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  });

  it("rejects updates without an id before calling the admin API", async () => {
    const response = await PATCH(adminRequest("https://crowvo.test/api/admin/access-codes", { active: false }, "PATCH"));

    await expect(response.json()).resolves.toEqual({ error: "id required." });
    expect(response.status).toBe(400);
    expect(crowvoAdminFetchMock).not.toHaveBeenCalled();
  });

  it("proxies access-code updates to the selected id", async () => {
    const payload = { active: false };
    crowvoAdminFetchMock.mockResolvedValue(jsonResponse({ id: "code_1", active: false }));

    const response = await PATCH(
      adminRequest("https://crowvo.test/api/admin/access-codes?id=code_1", payload, "PATCH"),
    );

    await expect(response.json()).resolves.toEqual({ id: "code_1", active: false });
    expect(response.status).toBe(200);
    expect(crowvoAdminFetchMock).toHaveBeenCalledWith("/access-codes/code_1", {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
  });
});
