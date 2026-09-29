import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

async function createUniqueInviteCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const inviteCode = generateInviteCode();
    const existing = await prisma.waitlistSignup.findUnique({
      where: { inviteCode },
      select: { id: true },
    });
    if (!existing) {
      return inviteCode;
    }
  }

  throw new Error("Could not allocate invite code.");
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

    const { email, referralCode, source } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the list. We'll reach out when a spot opens.",
        inviteCode: existing.inviteCode,
        referralLink: `${request.nextUrl.origin}/?ref=${existing.inviteCode}`,
      });
    }

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    const inviteCode = await createUniqueInviteCode();
    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        referralCode,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email or invite code is already registered." }, { status: 409 });
    }

    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
