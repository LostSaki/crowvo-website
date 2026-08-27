import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const INVITE_CODE_LENGTH = 8;

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function generateInviteCode() {
  const bytes = new Uint8Array(INVITE_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

function isUniqueConstraintError(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target) && target.includes(field);
}

function waitlistResponse(request: NextRequest, signup: { inviteCode: string }, status = 200) {
  return NextResponse.json(
    {
      message: status === 201 ? "You're on the waitlist." : "You're already on the waitlist.",
      inviteCode: signup.inviteCode,
      referralLink: `${request.nextUrl.origin}/?ref=${signup.inviteCode}`,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
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
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email },
      select: { inviteCode: true },
    });
    if (existing) {
      return waitlistResponse(request, existing);
    }

    const referralCode = parsed.data.referralCode || undefined;
    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email,
            inviteCode: generateInviteCode(),
            referralCode,
            source: parsed.data.community,
            referredById: referrer?.id,
          },
          select: { inviteCode: true },
        });
        return waitlistResponse(request, created, 201);
      } catch (error) {
        if (isUniqueConstraintError(error, "inviteCode")) {
          continue;
        }
        if (isUniqueConstraintError(error, "email")) {
          const duplicate = await prisma.waitlistSignup.findUnique({
            where: { email },
            select: { inviteCode: true },
          });
          if (duplicate) {
            return waitlistResponse(request, duplicate);
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not allocate an invite code." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
