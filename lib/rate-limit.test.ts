import { afterEach, describe, expect, test, vi } from "vitest";

async function importLimitRequests(ratelimit: unknown) {
  const createRatelimit = vi.fn(() => ratelimit);
  vi.doMock("@/lib/upstash", () => ({ createRatelimit }));

  const { limitRequests } = await import("./rate-limit");
  return { createRatelimit, limitRequests };
}

describe("limitRequests", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.resetModules();
    vi.doUnmock("@/lib/upstash");
  });

  test("uses the distributed limiter result when Upstash is configured", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const limit = vi.fn().mockResolvedValue({
      success: false,
      remaining: 2,
      reset: Date.now() + 2_500,
    });
    const { createRatelimit, limitRequests } = await importLimitRequests({ limit });

    await expect(limitRequests("analytics:203.0.113.5", 5, 2_500)).resolves.toEqual({
      success: false,
      remaining: 2,
      retryAfterSec: 3,
    });
    expect(createRatelimit).toHaveBeenCalledWith("hubly-ratelimit", 5, "3 s");
    expect(limit).toHaveBeenCalledWith("analytics:203.0.113.5");
  });

  test("falls back locally when Upstash is not configured", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const { limitRequests } = await importLimitRequests(null);

    await expect(limitRequests("analytics:203.0.113.5", 2, 60_000)).resolves.toEqual({
      success: true,
      remaining: 1,
      retryAfterSec: 0,
    });
    await expect(limitRequests("analytics:203.0.113.5", 2, 60_000)).resolves.toEqual({
      success: true,
      remaining: 0,
      retryAfterSec: 0,
    });
    await expect(limitRequests("analytics:203.0.113.5", 2, 60_000)).resolves.toEqual({
      success: false,
      remaining: 0,
      retryAfterSec: 60,
    });
    await expect(limitRequests("analytics:198.51.100.10", 2, 60_000)).resolves.toMatchObject({
      success: true,
      remaining: 1,
    });
  });

  test("expires local fallback hits after the configured window", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));

    const { limitRequests } = await importLimitRequests(null);

    await limitRequests("analytics:203.0.113.5", 2, 60_000);
    await limitRequests("analytics:203.0.113.5", 2, 60_000);
    await expect(limitRequests("analytics:203.0.113.5", 2, 60_000)).resolves.toMatchObject({
      success: false,
      retryAfterSec: 60,
    });

    vi.advanceTimersByTime(60_001);

    await expect(limitRequests("analytics:203.0.113.5", 2, 60_000)).resolves.toEqual({
      success: true,
      remaining: 1,
      retryAfterSec: 0,
    });
  });

  test("falls back locally if the distributed limiter throws", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const limit = vi.fn().mockRejectedValue(new Error("redis unavailable"));
    const { limitRequests } = await importLimitRequests({ limit });

    await expect(limitRequests("analytics:203.0.113.5", 2, 60_000)).resolves.toEqual({
      success: true,
      remaining: 1,
      retryAfterSec: 0,
    });
    expect(consoleError).toHaveBeenCalledWith(
      "Distributed rate-limit failed; falling back to local limiter.",
      expect.any(Error),
    );
  });
});
