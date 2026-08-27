import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/cloudflare";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { contactSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = requestIp(request);
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
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }

    const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json({ error: "Bot verification failed." }, { status: 400 });
    }

    await prisma.investorInterest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email.toLowerCase(),
        company: "Contact form",
        checkSize: null,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ message: "Thanks - we'll be in touch soon." }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not submit contact request." }, { status: 500 });
  }
}
