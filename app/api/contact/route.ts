import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validators";

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
    const body = await request.json();
    const parsed = contactSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact request." }, { status: 400 });
    }

    await prisma.investorInterest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company || "General contact",
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ message: "Thanks - we'll be in touch soon." }, { status: 201 });
  } catch {
    console.error("Contact submission failed.");
    return NextResponse.json({ error: "Could not submit your message." }, { status: 500 });
  }
}
