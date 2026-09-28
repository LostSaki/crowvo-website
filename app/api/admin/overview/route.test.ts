import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Mock } from "vitest";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

vi.mock("@/lib/admin-auth", () => ({
  requireAdmin: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analyticsEvent: {
      findMany: vi.fn(),
    },
  },
}));

const requireAdminMock = requireAdmin as unknown as Mock;
const findManyMock = prisma.analyticsEvent.findMany as unknown as Mock;

function request() {
  return new NextRequest("https://crow-vo.com/api/admin/overview");
}

describe("GET /api/admin/overview", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requireAdminMock.mockResolvedValue({ ok: true });
  });

  it("rejects unauthorized admin requests before querying analytics", async () => {
    requireAdminMock.mockRejectedValue(new Error("Invalid admin credentials."));

    const response = await GET(request());

    await expect(response.json()).resolves.toEqual({ error: "Invalid admin credentials." });
    expect(response.status).toBe(401);
    expect(findManyMock).not.toHaveBeenCalled();
  });

  it("summarizes recent analytics events for the admin dashboard", async () => {
    const createdAt = new Date("2026-09-28T10:00:00.000Z");
    findManyMock.mockResolvedValue([
      { eventName: "page_view", utmSource: "google", createdAt },
      { eventName: "page_view", utmSource: null, createdAt },
      { eventName: "page_view", utmSource: null, createdAt },
      { eventName: "cta_start_hub_click", utmSource: "google", createdAt },
      { eventName: "cta_start_hub_click", utmSource: "newsletter", createdAt },
      { eventName: "cta_launch_app_click", utmSource: "newsletter", createdAt },
      { eventName: "cta_request_deck_click", utmSource: "partner", createdAt },
      { eventName: "cta_request_deck_click", utmSource: "partner", createdAt },
      { eventName: "cta_request_deck_click", utmSource: "referral", createdAt },
      { eventName: "cta_request_deck_click", utmSource: "social", createdAt },
      { eventName: "custom_event", utmSource: "affiliate", createdAt },
    ]);

    const response = await GET(request());

    expect(findManyMock).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        eventName: true,
        utmSource: true,
        createdAt: true,
      },
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      analytics: {
        pageViews: 3,
        startHubClicks: 2,
        launchAppClicks: 1,
        requestDeckClicks: 4,
        topTrafficSources: [
          { source: "google", count: 2 },
          { source: "direct", count: 2 },
          { source: "newsletter", count: 2 },
          { source: "partner", count: 2 },
          { source: "referral", count: 1 },
        ],
      },
    });
  });

  it("returns a stable error payload when the analytics query fails", async () => {
    findManyMock.mockRejectedValue(new Error("database unavailable"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const response = await GET(request());

    await expect(response.json()).resolves.toEqual({ error: "Analytics query failed." });
    expect(response.status).toBe(500);
    expect(consoleError).toHaveBeenCalledWith("Admin analytics query failed.", expect.any(Error));

    consoleError.mockRestore();
  });
});
