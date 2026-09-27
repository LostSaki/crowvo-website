import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/referrals";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function waitlistResponse(request: NextRequest, message: string, inviteCode: string, status = 200) {
  return NextResponse.json(
    {
      message,
      inviteCode,
      referralLink: `${request.nextUrl.origin}/waitlist?ref=${inviteCode}`,
    },
    { status },
  );
}

async function uniqueInviteCode() {
  let inviteCode = generateInviteCode();
  while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
    inviteCode = generateInviteCode();
  }
  return inviteCode;
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
      return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
    }

    const { email, referralCode, source } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return waitlistResponse(request, "You're already on the waitlist.", existing.inviteCode);
    }

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode: await uniqueInviteCode(),
        referralCode,
        source,
        referredById: referrer?.id,
      },
    });

    return waitlistResponse(request, "You're on the list. We'll reach out when a spot opens.", created.inviteCode, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "Please retry your waitlist request." }, { status: 409 });
    }
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Could not join waitlist." }, { status: 500 });
  }
}
