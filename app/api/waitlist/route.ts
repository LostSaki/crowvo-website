import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(length = 8) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => INVITE_CODE_ALPHABET[byte % INVITE_CODE_ALPHABET.length]).join("");
}

function referralLink(origin: string, inviteCode: string) {
  return `${origin}/waitlist?ref=${encodeURIComponent(inviteCode)}`;
}

function signupSource(source?: string, community?: string) {
  const parts = [source?.trim() || "direct"];
  if (community?.trim()) {
    parts.push(`community: ${community.trim()}`);
  }
  return parts.join(" | ");
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

    const { email, referralCode, source, community } = parsed.data;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist.",
        inviteCode: existing.inviteCode,
        referralLink: referralLink(request.nextUrl.origin, existing.inviteCode),
      });
    }

    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: referralCode },
          select: { id: true },
        })
      : null;

    let inviteCode = generateInviteCode();
    while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
      inviteCode = generateInviteCode();
    }

    const created = await prisma.waitlistSignup.create({
      data: {
        email,
        inviteCode,
        referralCode: referralCode || null,
        source: signupSource(source, community),
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
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
