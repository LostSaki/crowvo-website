import { NextResponse } from "next/server";
import { z } from "zod";
import { limitRequests } from "@/lib/rate-limit";

/**
 * Checks an invite code so /download can unlock the install buttons.
 *
 * This is deliberately a proxy rather than a browser-to-backend call:
 *  - the backend origin and any future shared secret stay out of the client bundle
 *  - we can rate limit at the edge, before the backend is touched at all
 *  - we return { valid } and nothing else. The backend also sends label, tier,
 *    remainingUses and expiresAt; none of that is needed to unlock a button and all
 *    of it is free intelligence for someone working through codes.
 *
 * Every failure — bad code, rate limited, backend down — returns the same body, so
 * the response cannot be used to tell those cases apart.
 */

const bodySchema = z.object({ code: z.string().trim().min(4).max(64) });

const DENY = { valid: false as const, error: "That code is not valid." };

function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return req.headers.get("cf-connecting-ip") ?? "unknown";
}

export async function POST(req: Request) {
  let parsed;
  try {
    parsed = bodySchema.safeParse(await req.json());
  } catch {
    return NextResponse.json(DENY, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json(DENY, { status: 400 });

  // 5 attempts per 10 minutes per IP. Codes are long enough that a human types one
  // or two; anything beyond that is someone working through the space.
  const limit = await limitRequests(`invite-check:${clientIp(req)}`, 5, 10 * 60_000);
  if (!limit.success) {
    return NextResponse.json(DENY, {
      status: 429,
      headers: { "Retry-After": String(Math.max(1, limit.retryAfterSec)) },
    });
  }

  // Same convention as lib/crowvo-admin-api.ts — the base already carries /v1.
  const apiUrl = (process.env.CROWVO_API_URL?.trim() || "http://localhost:4000/v1").replace(/\/$/, "");

  try {
    const res = await fetch(`${apiUrl}/auth/validate-access-code`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: parsed.data.code }),
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    const payload = (await res.json().catch(() => null)) as { valid?: boolean } | null;
    if (!res.ok || !payload?.valid) return NextResponse.json(DENY, { status: 400 });
    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error("invite check failed", err);
    return NextResponse.json(DENY, { status: 400 });
  }
}
