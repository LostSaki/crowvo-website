import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { waitlistSchema } from "@/lib/validators";

function referralLink(origin: string, inviteCode: string) {
  return `${origin}/?ref=${encodeURIComponent(inviteCode)}`;
}

async function createInviteCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = randomBytes(4).toString("hex").toUpperCase();
    const existing = await prisma.waitlistSignup.findUnique({
      where: { inviteCode },
      select: { id: true },
    });
    if (!existing) return inviteCode;
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
      return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the list.",
        inviteCode: existing.inviteCode,
        referralLink: referralLink(request.nextUrl.origin, existing.inviteCode),
      });
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;
    const source = [parsed.data.source, `community: ${parsed.data.community}`].filter(Boolean).join(" | ");

    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode: await createInviteCode(),
        referralCode: parsed.data.referralCode,
        source,
        referredById: referrer?.id,
      },
    });

    return NextResponse.json(
      {
        message: "You're on the list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
        referralLink: referralLink(request.nextUrl.origin, created.inviteCode),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "This signup was submitted at the same time. Please try again." },
        { status: 409 },
      );
    }

    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
