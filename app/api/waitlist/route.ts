import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/referrals";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

async function generateUniqueInviteCode() {
  let inviteCode = generateInviteCode();
  while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
    inviteCode = generateInviteCode();
  }
  return inviteCode;
}

function waitlistResponse(request: NextRequest, inviteCode: string, message: string, status = 200) {
  return NextResponse.json(
    {
      message,
      inviteCode,
      referralLink: `${request.nextUrl.origin}/?ref=${inviteCode}`,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
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
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const { email, communityType, referralCode } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return waitlistResponse(request, existing.inviteCode, "You're already on the list.");
    }

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    const inviteCode = await generateUniqueInviteCode();
    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        referralCode,
        source: communityType,
        referredById: referrer?.id,
      },
    });

    return waitlistResponse(request, created.inviteCode, "You're on the list.", 201);
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Could not join the waitlist." }, { status: 500 });
  }
}
