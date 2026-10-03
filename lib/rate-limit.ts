import { createRatelimit } from "@/lib/upstash";
import { execute, queryOne } from "@/lib/sql";

export type RateLimitResult = { success: boolean; remaining: number; retryAfterSec: number };

/**
 * Last-resort limiter. On Cloudflare Workers each isolate has its own memory and isolates
 * are created and discarded freely, so this counter resets unpredictably and a determined
 * caller can simply keep landing on fresh ones. It exists so a database outage degrades
 * to "weakly limited" rather than "unlimited", and must not be the normal path.
 */
const localHits = new Map<string, number[]>();

function memoryRateLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;
  const validHits = (localHits.get(key) ?? []).filter((t) => t > windowStart);

  if (validHits.length >= maxRequests) {
    return { success: false, remaining: 0, retryAfterSec: Math.ceil((validHits[0]! + windowMs - now) / 1000) };
  }
  validHits.push(now);
  localHits.set(key, validHits);
  return { success: true, remaining: maxRequests - validHits.length, retryAfterSec: 0 };
}

/**
 * Shared counter in Postgres, which every isolate sees.
 *
 * One statement, so two isolates racing the same key cannot interleave a read and a write
 * and undercount. The window is opened and compared with the database clock rather than
 * any isolate's, so clock differences cannot stretch it.
 */
async function postgresRateLimit(key: string, maxRequests: number, windowMs: number): Promise<RateLimitResult> {
  const seconds = windowMs / 1000;
  const row = await queryOne<{ count: number; expiresAt: Date }>(
    `INSERT INTO "RateLimitBucket" ("key", "count", "expiresAt")
     VALUES ($1, 1, now() + make_interval(secs => $2::double precision))
     ON CONFLICT ("key") DO UPDATE SET
       "count" = CASE WHEN "RateLimitBucket"."expiresAt" <= now()
                      THEN 1 ELSE "RateLimitBucket"."count" + 1 END,
       "expiresAt" = CASE WHEN "RateLimitBucket"."expiresAt" <= now()
                          THEN now() + make_interval(secs => $2::double precision)
                          ELSE "RateLimitBucket"."expiresAt" END
     RETURNING "count", "expiresAt"`,
    [`web:${key}`, seconds],
  );

  if (!row) throw new Error("rate-limit upsert returned no row");
  const retryAfterSec = Math.max(0, Math.ceil((new Date(row.expiresAt).getTime() - Date.now()) / 1000));

  // Expired rows are dead weight and nothing else removes them. Swept on roughly 1 in 50
  // calls rather than on a timer, since a Worker has no process to hang a timer on.
  if (Math.random() < 0.02) {
    void execute(`DELETE FROM "RateLimitBucket" WHERE "expiresAt" <= now()`).catch(() => undefined);
  }

  if (row.count > maxRequests) return { success: false, remaining: 0, retryAfterSec };
  return { success: true, remaining: maxRequests - row.count, retryAfterSec: 0 };
}

export async function limitRequests(
  key: string,
  maxRequests = 8,
  windowMs = 60_000,
): Promise<RateLimitResult> {
  // Upstash first when it is configured: it is purpose-built and costs no database round trip.
  const ratelimit = createRatelimit("crowvo-ratelimit", maxRequests, `${Math.ceil(windowMs / 1000)} s`);
  if (ratelimit) {
    try {
      const result = await ratelimit.limit(key);
      return {
        success: result.success,
        remaining: result.remaining,
        retryAfterSec: result.reset ? Math.max(0, Math.ceil((result.reset - Date.now()) / 1000)) : 0,
      };
    } catch (error) {
      console.error("Upstash rate limit failed; falling through to Postgres.", error);
    }
  }

  try {
    return await postgresRateLimit(key, maxRequests, windowMs);
  } catch (error) {
    // Both shared stores unreachable. Log loudly: this path does not really limit anything
    // on Workers, so it should be visible rather than silently assumed to be working.
    console.error("Postgres rate limit failed; falling back to per-isolate memory.", error);
    return memoryRateLimit(key, maxRequests, windowMs);
  }
}
