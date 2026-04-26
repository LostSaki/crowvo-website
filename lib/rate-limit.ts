import { createRatelimit } from "@/lib/upstash";

const localHits = new Map<string, number[]>();

const fallbackRateLimit = (
  key: string,
  maxRequests = 8,
  windowMs = 60_000,
): { success: boolean; remaining: number; retryAfterSec: number } => {
  const now = Date.now();
  const windowStart = now - windowMs;
  const previous = localHits.get(key) ?? [];
  const validHits = previous.filter((timestamp) => timestamp > windowStart);

  if (validHits.length >= maxRequests) {
    const retryAfterSec = Math.ceil((validHits[0] + windowMs - now) / 1000);
    return { success: false, remaining: 0, retryAfterSec };
  }

  validHits.push(now);
  localHits.set(key, validHits);
  return { success: true, remaining: maxRequests - validHits.length, retryAfterSec: 0 };
};

export async function limitRequests(
  key: string,
  maxRequests = 8,
  windowMs = 60_000,
): Promise<{ success: boolean; remaining: number; retryAfterSec: number }> {
  const ratelimit = createRatelimit("hubly-ratelimit", maxRequests, `${Math.ceil(windowMs / 1000)} s`);
  if (!ratelimit) {
    return fallbackRateLimit(key, maxRequests, windowMs);
  }

  try {
    const result = await ratelimit.limit(key);
    return {
      success: result.success,
      remaining: result.remaining,
      retryAfterSec: result.reset ? Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)) : 0,
    };
  } catch (error) {
    console.error("Distributed rate-limit failed; falling back to local limiter.", error);
    return fallbackRateLimit(key, maxRequests, windowMs);
  }
}
