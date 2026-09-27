import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";
import { prisma } from "@/lib/prisma";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
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
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist.",
        referralLink: `${request.nextUrl.origin}/?ref=${existing.inviteCode}`,
      });
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
            referralLink: `${request.nextUrl.origin}/?ref=${created.inviteCode}`,
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
              message: "You're already on the waitlist.",
              referralLink: `${request.nextUrl.origin}/?ref=${duplicate.inviteCode}`,
            });
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not allocate an invite code." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
