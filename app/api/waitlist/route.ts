import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSignupSchema } from "@/lib/validators";

const INVITE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function clientIp(request: NextRequest) {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown"
  );
}

function generateInviteCode() {
  const bytes = new Uint8Array(10);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => INVITE_ALPHABET[byte % INVITE_ALPHABET.length]).join("");
}

function isInviteCodeCollision(error: unknown) {
  const target = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.target : undefined;
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (Array.isArray(target) ? target.includes("inviteCode") : typeof target === "string" && target.includes("inviteCode"))
  );
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${clientIp(request)}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many signup attempts." }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = waitlistSignupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist signup." }, { status: 400 });
  }

  const { email, communityType, referralCode, source } = parsed.data;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      const referredBy = referralCode
        ? await prisma.waitlistSignup.findFirst({
            where: {
              inviteCode: referralCode,
              email: { not: email },
            },
            select: { id: true },
          })
        : null;
      const referralUpdate = referralCode ? { referralCode, referredById: referredBy?.id ?? null } : {};

      const signup = await prisma.waitlistSignup.upsert({
        where: { email },
        update: {
          communityType,
          source: source ?? "website",
          ...referralUpdate,
        },
        create: {
          email,
          communityType,
          inviteCode: generateInviteCode(),
          referralCode,
          source: source ?? "website",
          referredById: referredBy?.id,
        },
        select: {
          inviteCode: true,
        },
      });

      return NextResponse.json({ ok: true, inviteCode: signup.inviteCode }, { status: 201 });
    } catch (error) {
      if (isInviteCodeCollision(error)) {
        continue;
      }

      console.error("Waitlist signup failed.", error);
      return NextResponse.json({ error: "Could not save waitlist signup." }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Could not allocate an invite code." }, { status: 500 });
}
