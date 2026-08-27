import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/referrals";
import { waitlistSchema } from "@/lib/validators";

function waitlistResponse(request: NextRequest, inviteCode: string, status = 200) {
  return NextResponse.json(
    {
      message: status === 201 ? "You're on the list. We'll reach out when a spot opens." : "You're already on the list.",
      inviteCode,
      referralLink: `${request.nextUrl.origin}/waitlist?ref=${inviteCode}`,
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
      return NextResponse.json({ error: "Invalid waitlist signup." }, { status: 400 });
    }

    const { email, referralCode, source } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email },
      select: { inviteCode: true },
    });
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
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
          if (target.includes("inviteCode")) {
            continue;
          }
          if (target.includes("email")) {
            const duplicate = await prisma.waitlistSignup.findUnique({
              where: { email },
              select: { inviteCode: true },
            });
            if (duplicate) {
              return waitlistResponse(request, duplicate.inviteCode);
            }
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not generate a unique invite code." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
