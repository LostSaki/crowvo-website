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
  try {
    const res = await crowvoAdminFetch("/access-codes");
    const payload = await res.json();
    if (!res.ok) return NextResponse.json(payload, { status: res.status });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not load access codes." },
      { status: 503 },
    );
  }
}

export async function POST(request: NextRequest) {
  const denied = await guard(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    const res = await crowvoAdminFetch("/access-codes", { method: "POST", body: JSON.stringify(body) });
    const payload = await res.json();
    if (!res.ok) return NextResponse.json(payload, { status: res.status });
    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create access code." },
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
    const res = await crowvoAdminFetch(`/access-codes/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    const payload = await res.json();
    if (!res.ok) return NextResponse.json(payload, { status: res.status });
    return NextResponse.json(payload);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update access code." },
      { status: 503 },
    );
  }
}
