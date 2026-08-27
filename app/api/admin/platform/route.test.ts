import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireAdmin } from "@/lib/admin-auth";
import { crowvoAdminFetch } from "@/lib/crowvo-admin-api";
import { GET } from "./route";

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/crowvo-admin-api", () => ({
  crowvoAdminFetch: vi.fn(),
}));

const requireAdminMock = vi.mocked(requireAdmin);
const crowvoAdminFetchMock = vi.mocked(crowvoAdminFetch);

function adminRequest(url = "https://crowvo.test/api/admin/platform") {
  return new NextRequest(url);
}

function jsonResponse(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GET /api/admin/platform", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ ok: true });
    crowvoAdminFetchMock.mockResolvedValue(jsonResponse({ ok: true }));
  });

  it("blocks unauthenticated admin proxy requests before calling the platform API", async () => {
    requireAdminMock.mockRejectedValue(new Error("Invalid admin credentials."));

    const response = await GET(adminRequest());

    await expect(response.json()).resolves.toEqual({ error: "Invalid admin credentials." });
    expect(response.status).toBe(401);
    expect(crowvoAdminFetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["stats", "/stats"],
    ["users", "/users"],
    ["audit", "/audit-logs"],
    ["unexpected", "/stats"],
  ])("maps section=%s to the %s platform endpoint", async (section, expectedPath) => {
    const response = await GET(adminRequest(`https://crowvo.test/api/admin/platform?section=${section}`));

    expect(response.status).toBe(200);
    expect(crowvoAdminFetchMock).toHaveBeenCalledWith(expectedPath);
  });

  it("forwards platform API error payloads and status codes", async () => {
    crowvoAdminFetchMock.mockResolvedValue(jsonResponse({ error: "upstream unavailable" }, 502));

    const response = await GET(adminRequest("https://crowvo.test/api/admin/platform?section=users"));

    await expect(response.json()).resolves.toEqual({ error: "upstream unavailable" });
    expect(response.status).toBe(502);
  });
});
