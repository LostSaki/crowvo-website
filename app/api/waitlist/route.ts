import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";
import { generateInviteCode } from "@/lib/referrals";
import { waitlistSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

const MAX_INVITE_CODE_ATTEMPTS = 5;

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function referralLink(origin: string, inviteCode: string) {
  return `${origin}/waitlist?ref=${encodeURIComponent(inviteCode)}`;
}

async function existingSignupResponse(origin: string, email: string) {
  const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
  if (!existing) {
    return null;
  }

  return NextResponse.json({
    message: "You're already on the waitlist.",
    inviteCode: existing.inviteCode,
    referralLink: referralLink(origin, existing.inviteCode),
  });
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
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const { email, source, referralCode } = parsed.data;
    const duplicateSignup = await existingSignupResponse(request.nextUrl.origin, email);
    if (duplicateSignup) {
      return duplicateSignup;
    }

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    for (let attempt = 0; attempt < MAX_INVITE_CODE_ATTEMPTS; attempt += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email,
            inviteCode: generateInviteCode(),
            referralCode,
            source,
            referredById: referrer?.id,
          },
        });

        return NextResponse.json(
          {
            message: "You're on the list. We'll reach out when a spot opens for your community.",
            inviteCode: created.inviteCode,
            referralLink: referralLink(request.nextUrl.origin, created.inviteCode),
          },
          { status: 201 },
        );
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
          if (target.includes("email")) {
            const existing = await existingSignupResponse(request.nextUrl.origin, email);
            if (existing) {
              return existing;
            }
          }
          if (target.includes("inviteCode") && attempt + 1 < MAX_INVITE_CODE_ATTEMPTS) {
            continue;
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not generate a unique invite code." }, { status: 500 });
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
