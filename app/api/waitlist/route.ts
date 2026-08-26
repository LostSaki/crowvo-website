import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSubmissionSchema } from "@/lib/validators";

function generateInviteCode() {
  return crypto.randomUUID().replaceAll("-", "").slice(0, 10).toUpperCase();
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

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const parsed = waitlistSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
  }

  try {
    const existing = await prisma.waitlistSignup.findUnique({
      where: { email: parsed.data.email },
      select: { id: true },
    });

    if (!existing) {
      let inviteCode = generateInviteCode();
      while (await prisma.waitlistSignup.findUnique({ where: { inviteCode }, select: { id: true } })) {
        inviteCode = generateInviteCode();
      }

      await prisma.waitlistSignup.create({
        data: {
          email: parsed.data.email,
          inviteCode,
          source: `community:${parsed.data.communityType}`,
        },
      });
    }

    return NextResponse.json({ message: "Waitlist request submitted." }, { status: existing ? 200 : 201 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Could not submit waitlist request." }, { status: 500 });
  }
}
