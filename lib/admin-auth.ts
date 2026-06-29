import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { limitRequests } from "@/lib/rate-limit";

export class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
  ) {
    super(message);
    this.name = "AdminAuthError";
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

async function enforceAdminRateLimit(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rateLimit = await limitRequests(`admin:${ip}`, 20, 60_000);
  if (!rateLimit.success) {
    throw new AdminAuthError(
      `Too many admin authentication attempts. Retry in ${rateLimit.retryAfterSec}s.`,
      429,
    );
  }
}

export async function requireAdmin(request: NextRequest) {
  await enforceAdminRateLimit(request);

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new AdminAuthError("ADMIN_USERNAME / ADMIN_PASSWORD are not configured.");
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
