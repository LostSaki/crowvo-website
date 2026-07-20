import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateInviteCode } from "@/lib/referrals";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistRequestSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

async function createSignup(email: string, source: string) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.waitlistSignup.create({
        data: {
          email,
          source,
          inviteCode: generateInviteCode(),
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.waitlistSignup.findUnique({ where: { email }, select: { id: true } });
      if (existing) {
        return existing;
      }
    }
  }

  throw new Error("Could not allocate a unique invite code.");
}

export async function POST(request: NextRequest) {
  const ip = clientIp(request);
  const rateLimit = await limitRequests(`waitlist:${ip}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` },
      { status: 429 },
    );
  }

  try {
    const parsed = waitlistRequestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const { email, community } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email }, select: { id: true } });
    if (!existing) {
      await createSignup(email, `website waitlist: ${community}`);
    }

    return NextResponse.json({
      message: "You're on the list. We'll reach out when a spot opens for your community.",
    });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not join the waitlist." }, { status: 500 });
  }
}
