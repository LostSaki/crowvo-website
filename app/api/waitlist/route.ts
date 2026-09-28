import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSignupSchema } from "@/lib/validators";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function generateInviteCode() {
  return globalThis.crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

function uniqueConflictOn(error: Prisma.PrismaClientKnownRequestError, field: string) {
  const target = error.meta?.target;
  return Array.isArray(target) ? target.includes(field) : target === field;
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${clientIp(request)}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many signup attempts." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = waitlistSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist payload." }, { status: 400 });
  }

  const referralCode = parsed.data.referralCode?.trim() || undefined;
  const referrer = referralCode
    ? await prisma.waitlistSignup.findUnique({ where: { inviteCode: referralCode }, select: { id: true } })
    : null;

  let lastError: unknown;
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await prisma.waitlistSignup.create({
        data: {
          email: parsed.data.email,
          communityKind: parsed.data.communityKind,
          inviteCode: generateInviteCode(),
          referralCode,
          referredById: referrer?.id,
          source: "website_waitlist",
        },
      });
      return NextResponse.json({ ok: true }, { status: 201 });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        if (uniqueConflictOn(error, "email")) {
          return NextResponse.json({ ok: true, duplicate: true }, { status: 200 });
        }
        if (uniqueConflictOn(error, "inviteCode")) {
          lastError = error;
          continue;
        }
      }
      console.error("Waitlist signup failed.", error);
      return NextResponse.json({ error: "Failed to save waitlist signup." }, { status: 500 });
    }
  }

  console.error("Waitlist invite code generation collided repeatedly.", lastError);
  return NextResponse.json({ error: "Failed to save waitlist signup." }, { status: 500 });
}
