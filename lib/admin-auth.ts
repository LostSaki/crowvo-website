import { NextRequest } from "next/server";
import { verifyAdminIdToken } from "@/lib/firebase-admin";

export async function requireAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing bearer token.");
  }
  const token = authHeader.slice("Bearer ".length);
  return verifyAdminIdToken(token);
}
