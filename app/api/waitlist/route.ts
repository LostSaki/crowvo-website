import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";
import { generateInviteCode } from "@/lib/referrals";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validators";

function getClientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function waitlistResponse(request: NextRequest, inviteCode: string, status = 200) {
  return NextResponse.json(
    {
      message: status === 201 ? "Welcome to early access." : "You're already on the waitlist.",
      inviteCode,
      referralLink: `${request.nextUrl.origin}/?ref=${inviteCode}`,
    },
    { status },
  );
}

async function findByEmail(email: string) {
  return prisma.waitlistSignup.findUnique({
    where: { email },
    select: { inviteCode: true },
  });
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
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
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const { email, referralCode, source } = parsed.data;
    const existing = await findByEmail(email);
    if (existing) {
      return waitlistResponse(request, existing.inviteCode);
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
            source,
            referredById: referrer?.id,
          },
          select: { inviteCode: true },
        });

        return waitlistResponse(request, created.inviteCode, 201);
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }

        const racedExisting = await findByEmail(email);
        if (racedExisting) {
          return waitlistResponse(request, racedExisting.inviteCode);
        }
      }
    }

    return NextResponse.json({ error: "Could not allocate an invite code." }, { status: 503 });
  } catch {
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
