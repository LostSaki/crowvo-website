import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function generateInviteCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => (byte % 36).toString(36))
    .join("")
    .toUpperCase();
}

export async function POST(request: NextRequest) {
  const ip = requestIp(request);
  const rateLimit = await limitRequests(`waitlist:${ip}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` }, { status: 429 });
  }

  try {
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the invite list.",
        inviteCode: existing.inviteCode,
      });
    }

    let inviteCode = generateInviteCode();
    while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
      inviteCode = generateInviteCode();
    }

    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        source: parsed.data.source,
      },
    });

    return NextResponse.json(
      {
        message: "You're on the invite list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not save waitlist submission." }, { status: 500 });
  }
}
