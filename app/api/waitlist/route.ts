import { randomBytes } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { limitRequests } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { waitlistSignupSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function inviteCode() {
  return `CV-${randomBytes(4).toString("hex").toUpperCase()}`;
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${requestIp(request)}`, 8, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: "Too many waitlist requests. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = waitlistSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
  }

  try {
    const referralCode = parsed.data.referralCode || undefined;
    const referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({ where: { inviteCode: referralCode }, select: { id: true } })
      : null;

    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json({ ok: true, alreadyJoined: true }, { status: 200 });
    }

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        await prisma.waitlistSignup.create({
          data: {
            email: parsed.data.email,
            source: parsed.data.source,
            referralCode,
            referredById: referrer?.id,
            inviteCode: inviteCode(),
          },
        });

        return NextResponse.json({ ok: true }, { status: 201 });
      } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
          const target = Array.isArray(error.meta?.target) ? error.meta.target : [];
          if (target.includes("email")) {
            return NextResponse.json({ ok: true, alreadyJoined: true }, { status: 200 });
          }
          if (target.includes("inviteCode")) {
            continue;
          }
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not allocate an invite code." }, { status: 500 });
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Could not save your waitlist request." }, { status: 500 });
  }
}
