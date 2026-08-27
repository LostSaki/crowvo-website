import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistRequestSchema } from "@/lib/validators";

function generateInviteCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
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
    const parsed = waitlistRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Enter a valid email and community." }, { status: 400 });
    }

    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: parsed.data.email },
      select: { inviteCode: true },
    });
    if (existing) {
      return NextResponse.json({ message: "You're already on the list.", inviteCode: existing.inviteCode });
    }

    const created = await prisma.waitlistSignup.create({
      data: {
        email: parsed.data.email,
        inviteCode: await uniqueInviteCode(),
        source: parsed.data.community,
      },
      select: { inviteCode: true },
    });

    return NextResponse.json(
      { message: "You're on the list. We'll reach out when a spot opens for your community.", inviteCode: created.inviteCode },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not submit request." }, { status: 500 });
  }
}
