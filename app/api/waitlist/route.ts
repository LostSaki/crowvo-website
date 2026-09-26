import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";
import { verifyTurnstileToken } from "@/lib/cloudflare";
import { generateInviteCode } from "@/lib/referrals";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function isUniqueConstraintError(error: unknown) {
  return Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002",
  );
}

async function createSignup(input: {
  email: string;
  referralCode?: string;
  source?: string;
  referredById?: string;
}) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.waitlistSignup.create({
        data: {
          email: input.email,
          inviteCode: generateInviteCode(),
          referralCode: input.referralCode,
          source: input.source,
          referredById: input.referredById,
        },
      });
    } catch (error) {
      if (!isUniqueConstraintError(error)) {
        throw error;
      }

      const existing = await prisma.waitlistSignup.findUnique({ where: { email: input.email } });
      if (existing) {
        return existing;
      }
    }
  }

  throw new Error("Could not allocate a waitlist invite code.");
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
  }

  const turnstile = await verifyTurnstileToken(parsed.data.turnstileToken, ip);
  if (!turnstile.success) {
    return NextResponse.json({ error: "Bot verification failed." }, { status: 400 });
  }

  try {
    const existing = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist.",
        inviteCode: existing.inviteCode,
        referralLink: `${request.nextUrl.origin}/?ref=${existing.inviteCode}`,
      });
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    const created = await createSignup({
      email: parsed.data.email,
      referralCode: parsed.data.referralCode,
      source: parsed.data.source,
      referredById: referrer?.id,
    });

    return NextResponse.json(
      {
        message: "You're on the list. We'll reach out when a spot opens for your community.",
        inviteCode: created.inviteCode,
        referralLink: `${request.nextUrl.origin}/?ref=${created.inviteCode}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
