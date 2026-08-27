import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistLeadSchema } from "@/lib/validators";

function generateInviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

async function createInviteCode() {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const inviteCode = generateInviteCode();
    const existing = await prisma.waitlistSignup.findUnique({
      where: { inviteCode },
      select: { id: true },
    });

    if (!existing) return inviteCode;
  }

  throw new Error("Could not allocate an invite code.");
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
    const parsed = waitlistLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const existing = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({ message: "You're already on the waitlist." });
    }

    await prisma.waitlistSignup.create({
      data: {
        email: parsed.data.email,
        inviteCode: await createInviteCode(),
        source: `Website waitlist: ${parsed.data.community}`,
      },
    });

    return NextResponse.json({ message: "You're on the list." }, { status: 201 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
