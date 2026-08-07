import { timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { limitRequests } from "@/lib/rate-limit";

class AdminAuthError extends Error {
  constructor(
    message: string,
    readonly status = 401,
  ) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export function adminAuthErrorStatus(error: unknown) {
  return error instanceof AdminAuthError ? error.status : 401;
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

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function requireAdmin(request: NextRequest) {
  const rateLimit = await limitRequests(`admin-auth:${clientIp(request)}`, 10, 60_000);
  if (!rateLimit.success) {
    throw new AdminAuthError("Too many admin authentication attempts. Try again later.", 429);
  }

  const expectedUser = process.env.ADMIN_USERNAME;
  const expectedPass = process.env.ADMIN_PASSWORD;
  if (!expectedUser || !expectedPass) {
    throw new AdminAuthError("ADMIN_USERNAME / ADMIN_PASSWORD are not configured.", 503);
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
