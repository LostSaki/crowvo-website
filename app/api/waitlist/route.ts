import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function generateInviteCode() {
  return `crowvo-${crypto.randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${requestIp(request)}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  try {
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const { email, communityType, source } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: normalizedEmail },
      select: { inviteCode: true },
    });

    if (existing) {
      return NextResponse.json({
        message: "You're already on the list.",
        inviteCode: existing.inviteCode,
      });
    }

    let inviteCode = generateInviteCode();
    while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
      inviteCode = generateInviteCode();
    }

    const sourceParts = [source, communityType ? `community:${communityType}` : undefined].filter(Boolean);
    const created = await prisma.waitlistSignup.create({
      data: {
        email: normalizedEmail,
        inviteCode,
        source: sourceParts.join(" | ") || undefined,
      },
      select: { inviteCode: true },
    });

    return NextResponse.json(
      {
        message: "You're on the list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Could not join the waitlist." }, { status: 500 });
  }
}
