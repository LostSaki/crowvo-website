import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function waitlistResponse(request: NextRequest, signup: { inviteCode: string }, status = 200) {
  return NextResponse.json(
    {
      message: status === 201 ? "You're on the list. We'll reach out when a spot opens." : "You're already on the list.",
      inviteCode: signup.inviteCode,
      referralLink: `${request.nextUrl.origin}/?ref=${signup.inviteCode}`,
    },
    { status },
  );
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
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const email = parsed.data.email.trim().toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email }, select: { inviteCode: true } });
    if (existing) {
      return waitlistResponse(request, existing);
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    const source = parsed.data.community?.trim() || parsed.data.source?.trim() || undefined;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email,
            inviteCode: generateInviteCode(),
            referralCode: parsed.data.referralCode,
            source,
            referredById: referrer?.id,
          },
          select: { inviteCode: true },
        });

        return waitlistResponse(request, created, 201);
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const signup = await prisma.waitlistSignup.findUnique({ where: { email }, select: { inviteCode: true } });
        if (signup) {
          return waitlistResponse(request, signup);
        }
      }
    }

    return NextResponse.json({ error: "Could not allocate a waitlist invite." }, { status: 500 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
