import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function generateInviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

async function findExisting(email: string) {
  return prisma.waitlistSignup.findUnique({
    where: { email },
    select: { inviteCode: true },
  });
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rateLimit = await limitRequests(`waitlist:${ip}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` }, { status: 429 });
  }

  let normalizedEmail: string | null = null;

  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
    }

    const { email, communityType, referralCode, source } = parsed.data;
    normalizedEmail = email.toLowerCase();
    const existing = await findExisting(normalizedEmail);
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

    let inviteCode = generateInviteCode();
    while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
      inviteCode = generateInviteCode();
    }

    const created = await prisma.waitlistSignup.create({
      data: {
        email: normalizedEmail,
        inviteCode,
        referralCode,
        source: [communityType, source].filter(Boolean).join(" | "),
        referredById: referrer?.id,
      },
      select: { inviteCode: true },
    });

    return NextResponse.json(
      {
        message: "You're on the list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002" && normalizedEmail) {
      const existing = await findExisting(normalizedEmail);
      if (existing) {
        return NextResponse.json({
          message: "You're already on the list.",
          inviteCode: existing.inviteCode,
        });
      }
    }

    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
