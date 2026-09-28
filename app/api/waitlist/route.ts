import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSubmissionSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function inviteCode() {
  return `CV-${crypto.randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

function uniqueFields(error: Prisma.PrismaClientKnownRequestError) {
  const target = error.meta?.target;
  if (Array.isArray(target)) {
    return target.map(String);
  }
  return typeof target === "string" ? [target] : [];
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${requestIp(request)}`, 8, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many waitlist requests." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = waitlistSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
  }

  const referralCode = parsed.data.referralCode?.toUpperCase();
  let referrer: { id: string } | null = null;
  try {
    referrer = referralCode
      ? await prisma.waitlistSignup.findUnique({ where: { inviteCode: referralCode }, select: { id: true } })
      : null;
  } catch (error) {
    console.error("Waitlist referral lookup failed.", error);
    return NextResponse.json({ error: "Could not save waitlist request." }, { status: 500 });
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      await prisma.waitlistSignup.create({
        data: {
          email: parsed.data.email,
          inviteCode: inviteCode(),
          referralCode,
          source: parsed.data.communityType,
          referredBy: referrer ? { connect: { id: referrer.id } } : undefined,
        },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const fields = uniqueFields(error);
        if (fields.includes("email")) {
          return NextResponse.json({ ok: true, alreadyRegistered: true }, { status: 200 });
        }
        if (fields.includes("inviteCode")) {
          continue;
        }
      }

      console.error("Waitlist submission failed.", error);
      return NextResponse.json({ error: "Could not save waitlist request." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not create a unique invite code." }, { status: 500 });
}
