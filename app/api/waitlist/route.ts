import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

function isUniqueConstraintError(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : target === field;
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
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const { email, communityType, referralCode } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the list.",
        inviteCode: existing.inviteCode,
      });
    }

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
            referralCode: referralCode ?? undefined,
            source: communityType,
            referredById: referrer?.id,
          },
        });

        return NextResponse.json(
          {
            message: "You're on the list. We'll reach out when a spot opens for your community.",
            inviteCode: created.inviteCode,
          },
          { status: 201 },
        );
      } catch (error) {
        if (isUniqueConstraintError(error, "inviteCode")) {
          continue;
        }

        if (isUniqueConstraintError(error, "email")) {
          const duplicate = await prisma.waitlistSignup.findUnique({ where: { email } });
          if (duplicate) {
            return NextResponse.json({
              message: "You're already on the list.",
              inviteCode: duplicate.inviteCode,
            });
          }
        }

        throw error;
      }
    }

    return NextResponse.json({ error: "Could not allocate an invite code. Try again." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining the waitlist." }, { status: 500 });
  }
}
