import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { investorInterestSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`investor-interest:${requestIp(request)}`, 8, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many contact requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = investorInterestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid contact payload." }, { status: 400 });
  }

  try {
    await prisma.investorInterest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
        checkSize: parsed.data.checkSize,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Contact submission failed.", error);
    return NextResponse.json({ error: "Could not save contact request." }, { status: 500 });
  }
}
