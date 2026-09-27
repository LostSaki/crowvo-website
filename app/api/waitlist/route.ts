import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSignupSchema } from "@/lib/validators";

function inviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

function isUniqueConstraint(error: unknown, field: string) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
    return false;
  }
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : target === field;
}

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rateLimit = await limitRequests(`waitlist:${ip}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many waitlist requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
  }

  const parsed = waitlistSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const community = parsed.data.community;
  const referralCode = parsed.data.referralCode?.toUpperCase();
  let referrer: { id: string } | null = null;
  try {
    referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({ where: { inviteCode: referralCode } })
      : null;
  } catch (error) {
    console.error("Waitlist referral lookup failed.", error);
    return NextResponse.json({ error: "Could not save waitlist signup." }, { status: 500 });
  }

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const signup = await prisma.waitlistSignup.create({
        data: {
          email,
          source: community,
          referralCode,
          referredById: referrer?.id,
          inviteCode: inviteCode(),
        },
        select: { inviteCode: true },
      });

      return NextResponse.json({ ok: true, inviteCode: signup.inviteCode }, { status: 201 });
    } catch (error) {
      if (isUniqueConstraint(error, "inviteCode")) {
        continue;
      }
      if (isUniqueConstraint(error, "email")) {
        return NextResponse.json({ ok: true }, { status: 200 });
      }
      console.error("Waitlist signup failed.", error);
      return NextResponse.json({ error: "Could not save waitlist signup." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not generate invite code." }, { status: 500 });
}
