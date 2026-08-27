import { NextRequest, NextResponse } from "next/server";
import { verifyTurnstileToken } from "@/lib/cloudflare";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { generateInviteCode } from "@/lib/referrals";
import { waitlistSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

export async function POST(request: NextRequest) {
  const ip = requestIp(request);
  const rateLimit = await limitRequests(`waitlist:${ip}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json({ error: "Bot verification failed." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the list.",
        inviteCode: existing.inviteCode,
        referralLink: `${request.nextUrl.origin}/?ref=${existing.inviteCode}`,
      });
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    let inviteCode = generateInviteCode();
    while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
      inviteCode = generateInviteCode();
    }

    const source = [parsed.data.source, parsed.data.communityType].filter(Boolean).join(" | ") || undefined;
    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        referralCode: parsed.data.referralCode,
        source,
        referredById: referrer?.id,
      },
    });

    return NextResponse.json(
      {
        message: "You're on the list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
        referralLink: `${request.nextUrl.origin}/?ref=${created.inviteCode}`,
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
