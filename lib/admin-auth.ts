import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";

class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryAfterSec?: number,
  ) {
    super(message);
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

function clientIp(request: NextRequest): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function rejectInvalidCredentials(request: NextRequest, message: string): Promise<never> {
  const rateLimit = await limitRequests(`admin-auth:${clientIp(request)}`, 5, 5 * 60_000);
  if (!rateLimit.success) {
    throw new AdminAuthError("Too many admin authentication attempts.", 429, rateLimit.retryAfterSec);
  }
  throw new AdminAuthError(message, 401);
}

export function adminAuthErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unauthorized";
  const status = error instanceof AdminAuthError ? error.status : 401;
  const headers =
    error instanceof AdminAuthError && (error.retryAfterSec ?? 0) > 0
      ? { "Retry-After": String(error.retryAfterSec) }
      : undefined;

  return NextResponse.json({ error: message }, { status, headers });
}

export async function requireAdmin(request: NextRequest) {
  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new Error("ADMIN_USERNAME / ADMIN_PASSWORD are not configured.");
  }

  const credentials = parseBasicAuth(request.headers.get("authorization"));
  if (!credentials) {
    await rejectInvalidCredentials(request, "Missing or invalid authorization. Use Basic auth (username + password).");
  }

  if (
    !constantTimeCompare(credentials.username, expectedUser) ||
    !constantTimeCompare(credentials.password, expectedPass)
  ) {
    await rejectInvalidCredentials(request, "Invalid admin credentials.");
  }
  return { ok: true };
}
