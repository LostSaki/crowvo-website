import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/referrals";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function waitlistResponse(request: NextRequest, inviteCode: string, status = 200) {
  return NextResponse.json(
    {
      message: status === 201 ? "You're on the list. We'll reach out when a spot opens for your community." : "You're already on the waitlist.",
      inviteCode,
      referralLink: `${request.nextUrl.origin}/?ref=${inviteCode}`,
    },
    { status },
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${clientIp(request)}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` }, { status: 429 });
  }

  try {
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return waitlistResponse(request, existing.inviteCode);
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    for (let attempts = 0; attempts < 5; attempts += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email,
            inviteCode: generateInviteCode(),
            referralCode: parsed.data.referralCode,
            source: parsed.data.communityType,
            referredById: referrer?.id,
          },
        });
        return waitlistResponse(request, created.inviteCode, 201);
      } catch (error) {
        if (!isUniqueConstraintError(error)) {
          throw error;
        }

        const duplicate = await prisma.waitlistSignup.findUnique({ where: { email } });
        if (duplicate) {
          return waitlistResponse(request, duplicate.inviteCode);
        }
      }
    }

    return NextResponse.json({ error: "Could not generate a waitlist invite. Please retry." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
