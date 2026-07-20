import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { contactRequestSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rateLimit = await limitRequests(`contact:${ip}`, 4, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  try {
    const parsed = contactRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact request." }, { status: 400 });
    }

    await prisma.investorInterest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: "Website contact",
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ message: "Thanks - we'll be in touch soon." }, { status: 201 });
  } catch (error) {
    console.error("Contact submission failed.", error);
    return NextResponse.json({ error: "Could not send your message." }, { status: 500 });
  }
}
