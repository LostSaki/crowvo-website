import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  let code = "";
  for (let index = 0; index < length; index += 1) {
    code += INVITE_CODE_CHARS[Math.floor(Math.random() * INVITE_CODE_CHARS.length)];
  }
  return code;
}

async function findExistingSignup(email: string) {
  return prisma.waitlistSignup.findUnique({
    where: { email },
    select: { inviteCode: true },
  });
}

async function createWaitlistSignup(email: string, communityType: string, referralCode?: string) {
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

  return prisma.waitlistSignup.create({
    data: {
      email,
      inviteCode,
      referralCode,
      source: communityType,
      referredById: referrer?.id,
    },
    select: { inviteCode: true },
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

    const { email, communityType, referralCode } = parsed.data;
    const existing = await findExistingSignup(email);
    if (existing) {
      return NextResponse.json({
        message: "You're already on the list.",
        inviteCode: existing.inviteCode,
      });
    }

    try {
      const created = await createWaitlistSignup(email, communityType, referralCode);
      return NextResponse.json(
        {
          message: "You're on the list. We'll reach out when a spot opens for your community.",
          inviteCode: created.inviteCode,
        },
        { status: 201 },
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const duplicate = await findExistingSignup(email);
        if (duplicate) {
          return NextResponse.json({
            message: "You're already on the list.",
            inviteCode: duplicate.inviteCode,
          });
        }
      }
      throw error;
    }
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Could not save your waitlist request." }, { status: 500 });
  }
}
