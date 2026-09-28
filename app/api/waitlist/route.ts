import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function inviteCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

async function uniqueInviteCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = inviteCode();
    const existing = await prisma.waitlistSignup.findUnique({
      where: { inviteCode: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
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
    const parsed = waitlistSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: parsed.data.email },
      select: { inviteCode: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, inviteCode: existing.inviteCode });
    }

    const created = await prisma.waitlistSignup.create({
      data: {
        email: parsed.data.email,
        inviteCode: await uniqueInviteCode(),
        source: parsed.data.communityType,
      },
      select: { inviteCode: true },
    });

    return NextResponse.json({ ok: true, inviteCode: created.inviteCode }, { status: 201 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not save waitlist request." }, { status: 500 });
  }
}
