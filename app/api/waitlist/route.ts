import { randomBytes } from "node:crypto";
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
  return randomBytes(6).toString("base64url").replace(/[^a-z0-9]/gi, "").toUpperCase();
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${clientIp(request)}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = waitlistSignupSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findFirst({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true, email: true },
        })
      : null;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        await prisma.waitlistSignup.upsert({
          where: { email: parsed.data.email },
          update: {
            community: parsed.data.community,
            source: parsed.data.source ?? "website",
            referralCode: parsed.data.referralCode,
            referredById: referrer && referrer.email !== parsed.data.email ? referrer.id : undefined,
          },
          create: {
            email: parsed.data.email,
            inviteCode: generateInviteCode(),
            community: parsed.data.community,
            source: parsed.data.source ?? "website",
            referralCode: parsed.data.referralCode,
            referredById: referrer && referrer.email !== parsed.data.email ? referrer.id : undefined,
          },
        });
        return NextResponse.json({ ok: true }, { status: 201 });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === "P2002" &&
          attempt < 2
        ) {
          continue;
        }
        throw error;
      }
    }

    return NextResponse.json({ error: "Could not save waitlist submission." }, { status: 500 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not save waitlist submission." }, { status: 500 });
  }
}
