import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { generateInviteCode } from "@/lib/referrals";
import { limitRequests } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validators";

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function existingSignupResponse(email: string, origin: string) {
  const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
  if (!existing) {
    return null;
  }

  return NextResponse.json({
    message: "You're already on the waitlist.",
    inviteCode: existing.inviteCode,
    referralLink: `${origin}/?ref=${existing.inviteCode}`,
  });
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rateLimit = await limitRequests(`waitlist:${ip}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  try {
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await existingSignupResponse(email, request.nextUrl.origin);
    if (existing) {
      return existing;
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email,
            inviteCode: generateInviteCode(),
            referralCode: parsed.data.referralCode,
            source: parsed.data.source,
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
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const existingAfterRace = await existingSignupResponse(email, request.nextUrl.origin);
        if (existingAfterRace) {
          return existingAfterRace;
        }
      }
    }

    return NextResponse.json({ error: "Could not reserve an invite code." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
