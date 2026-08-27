import { NextRequest, NextResponse } from "next/server";
import { adminAuthResponse, requireAdmin } from "@/lib/admin-auth";
import { crowvoAdminFetch } from "@/lib/crowvo-admin-api";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return adminAuthResponse(error);
  }

  const section = request.nextUrl.searchParams.get("section") ?? "stats";
  const path = section === "users" ? "/users" : section === "audit" ? "/audit-logs" : "/stats";

  try {
    const res = await crowvoAdminFetch(path);
    const payload = await res.json();
    if (!res.ok) return NextResponse.json(payload, { status: res.status });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Platform API unavailable." },
      { status: 503 },
    );
  }
}
