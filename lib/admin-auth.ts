import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";

export class AdminAuthError extends Error {
  readonly status: number;
  readonly retryAfterSec?: number;

  constructor(message: string, status = 401, retryAfterSec?: number) {
    super(message);
    this.name = "AdminAuthError";
    this.status = status;
    this.retryAfterSec = retryAfterSec;
  }
}

function parseBasicAuth(header: string | null): { username: string; password: string } | null {
  if (!header?.startsWith("Basic ")) {
    return null;
  }
  const encoded = header.slice("Basic ".length).trim();
  let decoded: string;
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
  const colonIndex = decoded.indexOf(":");
  if (colonIndex < 0) {
    return null;
  }
  return {
    username: decoded.slice(0, colonIndex),
    password: decoded.slice(colonIndex + 1),
  };
}

function constantTimeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) {
    return false;
  }
  return timingSafeEqual(bufA, bufB);
}

function adminClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export function adminAuthErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";
  const status = error instanceof AdminAuthError ? error.status : 401;
  const retryAfterSec = error instanceof AdminAuthError ? error.retryAfterSec : undefined;

  return NextResponse.json(
    { error: message },
    {
      status,
      headers: retryAfterSec ? { "Retry-After": String(retryAfterSec) } : undefined,
    },
  );
}

export async function requireAdmin(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new AdminAuthError("ADMIN_USERNAME / ADMIN_PASSWORD are not configured.");
  }

  const rateLimit = await limitRequests(`admin:${adminClientIp(request)}`, 20, 60_000);
  if (!rateLimit.success) {
    throw new AdminAuthError(`Too many admin attempts. Retry in ${rateLimit.retryAfterSec}s.`, 429, rateLimit.retryAfterSec);
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));
  if (!credentials) {
    throw new AdminAuthError("Missing or invalid authorization. Use Basic auth (username + password).");
  }

  if (
    !constantTimeCompare(credentials.username, expectedUser) ||
    !constantTimeCompare(credentials.password, expectedPass)
  ) {
    throw new AdminAuthError("Invalid admin credentials.");
  }
  return { ok: true };
}
