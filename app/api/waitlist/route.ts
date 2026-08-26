import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { limitRequests } from "@/lib/rate-limit";
import { waitlistSchema } from "@/lib/validators";

function requestIp(request: NextRequest) {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

function generateInviteCode() {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(36).padStart(2, "0")).join("").slice(0, 10).toUpperCase();
}

function referralLink(request: NextRequest, inviteCode: string) {
  return `${request.nextUrl.origin}/?ref=${inviteCode}`;
}

export async function POST(request: NextRequest) {
  const ip = requestIp(request);
  const rateLimit = await limitRequests(`waitlist:${ip}`, 6, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: `Too many requests. Retry in ${rateLimit.retryAfterSec}s.` }, { status: 429 });
  }

  try {
    const body = await request.json();
    const parsed = waitlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid waitlist submission." }, { status: 400 });
    }

    const existing = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
    if (existing) {
      return NextResponse.json({
        message: "You're already on the list.",
        inviteCode: existing.inviteCode,
        referralLink: referralLink(request, existing.inviteCode),
      });
    }

    const referrer = parsed.data.referralCode
      ? await prisma.waitlistSignup.findUnique({
          where: { inviteCode: parsed.data.referralCode },
          select: { id: true },
        })
      : null;

    const source = [parsed.data.source, parsed.data.communityKind].filter(Boolean).join(" | ") || undefined;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      try {
        const created = await prisma.waitlistSignup.create({
          data: {
            email: parsed.data.email,
            inviteCode: generateInviteCode(),
            referralCode: parsed.data.referralCode,
            source,
            referredById: referrer?.id,
          },
        });

        return NextResponse.json(
          {
            message: "You're on the list. We'll reach out when a spot opens for your community.",
            inviteCode: created.inviteCode,
            referralLink: referralLink(request, created.inviteCode),
          },
          { status: 201 },
        );
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== "P2002") {
          throw error;
        }

        const duplicate = await prisma.waitlistSignup.findUnique({ where: { email: parsed.data.email } });
        if (duplicate) {
          return NextResponse.json({
            message: "You're already on the list.",
            inviteCode: duplicate.inviteCode,
            referralLink: referralLink(request, duplicate.inviteCode),
          });
        }
      }
    }

    return NextResponse.json({ error: "Could not allocate an invite code. Please retry." }, { status: 503 });
  } catch (error) {
    console.error("Waitlist submission failed.", error);
    return NextResponse.json({ error: "Server error while joining the waitlist." }, { status: 500 });
  }
}
