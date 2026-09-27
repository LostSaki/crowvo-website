import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistRequestSchema } from "@/lib/validators";

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => INVITE_CODE_ALPHABET[byte % INVITE_CODE_ALPHABET.length]).join("");
}

async function createUniqueInviteCode() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const inviteCode = generateInviteCode();
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
    const parsed = waitlistRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const { email, community, referralCode, source } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ message: "You're already on the list. We'll be in touch." });
    }

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    const inviteCode = await createUniqueInviteCode();
    await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        referralCode: referralCode || undefined,
        source: source ? `${community} | ${source}` : community,
        referredById: referrer?.id,
      },
    });

    return NextResponse.json(
      { message: "You're on the list. We'll reach out when a spot opens for your community." },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not save your waitlist request." }, { status: 500 });
  }
}
