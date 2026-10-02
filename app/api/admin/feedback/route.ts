import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { crowvoAdminFetch } from "@/lib/crowvo-admin-api";

async function guard(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }
  return null;
}

export async function GET(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const params = new URLSearchParams();
  const status = request.nextUrl.searchParams.get("status");
  const type = request.nextUrl.searchParams.get("type");
  const q = request.nextUrl.searchParams.get("q");
  if (status) params.set("status", status);
  if (type) params.set("type", type);
  if (q) params.set("q", q);
  const query = params.toString();
  try {
    const res = await crowvoAdminFetch(`/feedback${query ? `?${query}` : ""}`);
    const payload = await res.json();
    if (!res.ok) return NextResponse.json(payload, { status: res.status });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load feedback." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  const id = request.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required." }, { status: 400 });
  try {
    const body = await request.json();
    const res = await crowvoAdminFetch(`/feedback/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    const payload = await res.json();
    if (!res.ok) return NextResponse.json(payload, { status: res.status });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update feedback." },
      { status: 503 },
    );
  }
}
