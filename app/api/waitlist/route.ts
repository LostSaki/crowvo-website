import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function generateInviteCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 10)
    .toUpperCase();
}

function referralLink(request: NextRequest, inviteCode: string) {
  return `${request.nextUrl.origin}/waitlist?ref=${encodeURIComponent(inviteCode)}`;
}

async function createUniqueInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const existing = await prisma.waitlistSignup.findUnique({
      where: { inviteCode },
      select: { id: true },
    });
    if (!existing) return inviteCode;
  }

  throw new Error("Could not allocate a unique invite code.");
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

    const existing = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the invite list.",
        inviteCode: existing.inviteCode,
        referralLink: referralLink(request, existing.inviteCode),
      });
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    const created = await prisma.waitlistSignup.create({
      data: {
        email: parsed.data.email,
        inviteCode: await createUniqueInviteCode(),
        referralCode: parsed.data.referralCode,
        source: parsed.data.communityType,
        referredById: referrer?.id,
      },
    });

    return NextResponse.json(
      {
        message: "You're on the invite list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
        referralLink: referralLink(request, created.inviteCode),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "That email or invite code is already registered." }, { status: 409 });
    }

    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not save waitlist request." }, { status: 500 });
  }
}
