import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function generateInviteCode() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

function isUniqueConstraintError(error: unknown, field: string) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    Array.isArray(error.meta?.target) &&
    error.meta.target.includes(field)
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
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const existing = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist.",
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

    const source = [parsed.data.source, parsed.data.communityType].filter(Boolean).join(" | ") || undefined;

    for (let attempts = 0; attempts < 5; attempts += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email: parsed.data.email,
            inviteCode: generateInviteCode(),
            referralCode: parsed.data.referralCode ?? undefined,
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
      } catch (error) {
        if (isUniqueConstraintError(error, "inviteCode")) {
          continue;
        }
        if (isUniqueConstraintError(error, "email")) {
          const signup = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
          if (signup) {
            return NextResponse.json({
              message: "You're already on the waitlist.",
              inviteCode: signup.inviteCode,
              referralLink: `${request.nextUrl.origin}/?ref=${signup.inviteCode}`,
            });
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not generate an invite code. Try again." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
