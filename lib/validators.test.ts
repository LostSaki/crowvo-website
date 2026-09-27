import { describe, expect, it } from "vitest";
import { analyticsTrackSchema } from "@/lib/validators";

describe("analyticsTrackSchema", () => {
  it("normalizes bounded string fields and accepts flat metadata values", () => {
    const parsed = analyticsTrackSchema.parse({
      eventName: "  page_view  ",
      path: "  /pricing  ",
      referrer: "  https://example.com  ",
      utmSource: "  newsletter  ",
      sessionId: "  session-123  ",
      metadata: {
        cta: "hero",
        depth: 75,
        converted: true,
        experiment: null,
      },
    });

    expect(parsed).toEqual({
      eventName: "page_view",
      path: "/pricing",
      referrer: "https://example.com",
      utmSource: "newsletter",
      sessionId: "session-123",
      metadata: {
        cta: "hero",
        depth: 75,
        converted: true,
        experiment: null,
      },
    });
  });

  it("rejects empty event names after trimming", () => {
    const parsed = analyticsTrackSchema.safeParse({
      eventName: "  ",
    });

    expect(parsed.success).toBe(false);
  });

  it("rejects nested metadata that cannot be persisted as scalar analytics data", () => {
    const parsed = analyticsTrackSchema.safeParse({
      eventName: "cta_click",
      metadata: {
        nested: { value: "unexpected" },
      },
    });

    expect(parsed.success).toBe(false);
  });
});
