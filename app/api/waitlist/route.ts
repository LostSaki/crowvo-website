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

function inviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
}

async function createWaitlistSignup(email: string, communityType: string) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.waitlistSignup.create({
        data: {
          email,
          inviteCode: inviteCode(),
          source: communityType,
        },
      });
    } catch (error) {
      if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
        const existing = await prisma.waitlistSignup.findUnique({ where: { email } });
        if (existing) {
          return existing;
        }
        continue;
      }
      throw error;
    }
  }

  throw new Error("Could not allocate invite code.");
}

export async function POST(request: NextRequest) {
  const rateLimit = await limitRequests(`waitlist:${clientIp(request)}`, 10, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many requests." }, { status: 429 });
  }

  try {
    const parsed = waitlistSignupSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist request." }, { status: 400 });
    }

    await createWaitlistSignup(parsed.data.email, parsed.data.communityType);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    console.error("Waitlist signup failed.", error);
    return NextResponse.json({ error: "Could not save waitlist request." }, { status: 500 });
  }
}
