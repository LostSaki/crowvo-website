import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { generateInviteCode } from "@/lib/referrals";
import { waitlistSchema } from "@/lib/validators";

function referralLink(request: NextRequest, inviteCode: string) {
  return `${request.nextUrl.origin}/?ref=${inviteCode}`;
}

async function existingSignupResponse(request: NextRequest, email: string) {
  const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
  if (!existing) return null;
  return NextResponse.json({
    message: "You're already on the waitlist.",
    inviteCode: existing.inviteCode,
    referralLink: referralLink(request, existing.inviteCode),
  });
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";
  let parsedEmail: string | null = null;

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

    const { email, referralCode, source } = parsed.data;
    parsedEmail = email;
    const existingResponse = await existingSignupResponse(request, email);
    if (existingResponse) return existingResponse;

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    let inviteCode = generateInviteCode();
    while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
      inviteCode = generateInviteCode();
    }

    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        referralCode,
        source,
        referredById: referrer?.id,
      },
    });

    return NextResponse.json(
      {
        message: "You're on the list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
        referralLink: referralLink(request, created.inviteCode),
      },
      { status: 201 },
    );
  } catch (error) {
    if (parsedEmail && error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const existingResponse = await existingSignupResponse(request, parsedEmail);
      if (existingResponse) return existingResponse;
    }

    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
