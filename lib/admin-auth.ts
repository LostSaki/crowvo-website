import { NextRequest } from "next/server";

export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }
  const token = authHeader.slice("Bearer ".length).trim();
  const expected = process.env.ADMIN_TOKEN;
  if (!expected) {
    throw new Error("ADMIN_TOKEN is not configured.");
  }
  if (token !== expected) {
    throw new Error("Invalid admin token.");
  }
  return { ok: true };
}
