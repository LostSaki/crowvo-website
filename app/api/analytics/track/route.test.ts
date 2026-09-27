import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAnalyticsEvent: vi.fn(),
  limitRequests: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    analyticsEvent: {
      create: mocks.createAnalyticsEvent,
    },
  },
}));

vi.mock("@/lib/rate-limit", () => ({
  limitRequests: mocks.limitRequests,
}));

import { POST } from "./route";

function analyticsRequest(body: unknown, headers: Record<string, string> = {}) {
  return new NextRequest("https://crowvo.test/api/analytics/track", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/analytics/track", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.limitRequests.mockResolvedValue({ success: true, remaining: 79, retryAfterSec: 0 });
    mocks.createAnalyticsEvent.mockResolvedValue({ id: "analytics-event-1" });
  });

  it("persists a validated analytics event using the first forwarded IP for rate limiting", async () => {
    const response = await POST(
      analyticsRequest(
        {
          eventName: "  cta_click  ",
          path: "  /pricing  ",
          utmSource: "newsletter",
          sessionId: "session-123",
          metadata: { cta: "hero", aboveFold: true },
        },
        { "x-forwarded-for": "203.0.113.9, 198.51.100.7" },
      ),
    );

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual({ ok: true });
    expect(mocks.limitRequests).toHaveBeenCalledWith("analytics:203.0.113.9", 80, 60_000);
    expect(mocks.createAnalyticsEvent).toHaveBeenCalledWith({
      data: {
        eventName: "cta_click",
        path: "/pricing",
        referrer: undefined,
        utmSource: "newsletter",
        utmMedium: undefined,
        utmCampaign: undefined,
        sessionId: "session-123",
        metadata: { cta: "hero", aboveFold: true },
      },
    });
  });

  it("rejects invalid analytics payloads without writing to the database", async () => {
    const response = await POST(
      analyticsRequest({
        eventName: "x",
        metadata: { nested: { value: "not allowed" } },
      }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid analytics payload." });
    expect(mocks.createAnalyticsEvent).not.toHaveBeenCalled();
  });

  it("returns a throttled response before persistence when the rate limit is exceeded", async () => {
    mocks.limitRequests.mockResolvedValue({ success: false, remaining: 0, retryAfterSec: 12 });

    const response = await POST(
      analyticsRequest(
        {
          eventName: "page_view",
        },
        {
          "cf-connecting-ip": "198.51.100.42",
          "x-forwarded-for": "203.0.113.9",
        },
      ),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({ error: "Too many events." });
    expect(mocks.limitRequests).toHaveBeenCalledWith("analytics:198.51.100.42", 80, 60_000);
    expect(mocks.createAnalyticsEvent).not.toHaveBeenCalled();
  });
});
