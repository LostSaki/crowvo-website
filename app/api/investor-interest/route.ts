import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/cloudflare";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { investorSchema } from "@/lib/validators";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  const rateLimit = await limitRequests(`investor:${ip}`, 4, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = investorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid contact payload." }, { status: 400 });
    }

    const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json({ error: "Bot verification failed." }, { status: 400 });
    }

    await prisma.investorInterest.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        company: parsed.data.company,
        checkSize: parsed.data.checkSize,
        message: parsed.data.message,
      },
    });

    return NextResponse.json({ message: "Thanks — we'll be in touch soon." }, { status: 201 });
  } catch (error) {
    console.error("Investor/contact submission failed.", error);
    return NextResponse.json({ error: "Could not submit contact request." }, { status: 500 });
  }
}
