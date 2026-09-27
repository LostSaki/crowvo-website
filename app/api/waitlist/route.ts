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

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

async function findExistingSignup(email: string) {
  return prisma.waitlistSignup.findUnique({
    where: { email },
    select: { inviteCode: true },
  });
}

function referralLink(origin: string, inviteCode: string) {
  return `${origin}/waitlist?ref=${inviteCode}`;
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
  }

  const { email, community, referralCode, source } = parsed.data;

  try {
    const existing = await findExistingSignup(email);
    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist.",
        referralLink: referralLink(request.nextUrl.origin, existing.inviteCode),
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
            referralCode,
            source: `community:${community}; source:${source ?? "direct"}`,
            referredById: referrer?.id,
          },
          select: { inviteCode: true },
        });

        return NextResponse.json(
          {
            message: "You're on the waitlist. We'll reach out when a spot opens for your community.",
            referralLink: referralLink(request.nextUrl.origin, created.inviteCode),
          },
          { status: 201 },
        );
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const signup = await findExistingSignup(email);
        if (signup) {
          return NextResponse.json({
            message: "You're already on the waitlist.",
            referralLink: referralLink(request.nextUrl.origin, signup.inviteCode),
          });
        }
      }
    }

    return NextResponse.json({ error: "Could not allocate a waitlist invite code." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
