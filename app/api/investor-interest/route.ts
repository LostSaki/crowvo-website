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
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = investorInterestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact submission." }, { status: 400 });
    }

    await prisma.investorInterest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company ?? "Website inquiry",
        checkSize: parsed.data.checkSize,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Investor/contact submission failed.", error);
    return NextResponse.json({ error: "Could not save contact submission." }, { status: 500 });
  }
}
