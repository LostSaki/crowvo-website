import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { investorInterestSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`investor-interest:${clientIp(request)}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many contact attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = investorInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact payload." }, { status: 400 });
  }

  try {
    await prisma.investorInterest.create({ data: parsed.data });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Investor interest submission failed.", error);
    return NextResponse.json({ error: "Failed to save contact submission." }, { status: 500 });
  }
}
