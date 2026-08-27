import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistRequestSchema } from "@/lib/validators";

function generateInviteCode() {
  return `CV-${crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase()}`;
}

function isUniqueConstraint(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }

  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : target === field;
}

async function createWaitlistSignup(data: {
  email: string;
  referralCode?: string | null;
  source?: string;
}) {
  const referrer = data.referralCode
    ? await prisma.waitlistSignup.findUnique({
        where: { inviteCode: data.referralCode },
        select: { id: true },
      })
    : null;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await prisma.waitlistSignup.create({
        data: {
          email: data.email,
          inviteCode: generateInviteCode(),
          referralCode: data.referralCode,
          source: data.source,
          referredById: referrer?.id,
        },
      });
    } catch (error) {
      if (isUniqueConstraint(error, "inviteCode")) {
        continue;
      }
      throw error;
    }
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

  let submittedEmail: string | null = null;
  try {
    const body = await request.json();
    const parsed = waitlistRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
    }

    const email = parsed.data.email.toLowerCase();
    submittedEmail = email;
    const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the waitlist.",
        inviteCode: existing.inviteCode,
        referralLink: `${request.nextUrl.origin}/?ref=${existing.inviteCode}`,
      });
    }

    const created = await createWaitlistSignup({
      email,
      referralCode: parsed.data.referralCode,
      source: parsed.data.source,
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
    if (submittedEmail && isUniqueConstraint(error, "email")) {
      const existing = await prisma.waitlistSignup.findUnique({ where: { email: submittedEmail } });
      if (existing) {
        return NextResponse.json({
          message: "You're already on the waitlist.",
          inviteCode: existing.inviteCode,
          referralLink: `${request.nextUrl.origin}/?ref=${existing.inviteCode}`,
        });
      }
    }

    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining waitlist." }, { status: 500 });
  }
}
