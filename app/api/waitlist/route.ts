import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  let code = "";
  for (let i = 0; i < length; i += 1) {
    code += INVITE_CHARS[Math.floor(Math.random() * INVITE_CHARS.length)];
  }
  return code;
}

async function uniqueInviteCode() {
  let inviteCode = generateInviteCode();
  while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
    inviteCode = generateInviteCode();
  }
  return inviteCode;
}

function waitlistResponse(origin: string, inviteCode: string, status = 200) {
  return NextResponse.json(
    {
      message: "You're on the invite list.",
      inviteCode,
      referralLink: `${origin}/waitlist?ref=${inviteCode}`,
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

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return waitlistResponse(request.nextUrl.origin, existing.inviteCode);
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode: await uniqueInviteCode(),
        referralCode: parsed.data.referralCode,
        source: parsed.data.source,
        referredById: referrer?.id,
      },
    });

    return waitlistResponse(request.nextUrl.origin, created.inviteCode, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Please retry your waitlist request." }, { status: 409 });
    }
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
