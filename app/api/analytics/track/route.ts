import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { analyticsTrackSchema } from "@/lib/validators";
import { limitRequests } from "@/lib/rate-limit";

const MAX_ANALYTICS_BODY_BYTES = 8 * 1024;

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    "unknown";

  const rateLimit = await limitRequests(`analytics:${ip}`, 80, 60_000);
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many events." }, { status: 429 });
  }

  try {
    const contentLength = Number(request.headers.get("content-length") ?? "0");
    if (contentLength > MAX_ANALYTICS_BODY_BYTES) {
      return NextResponse.json({ error: "Analytics payload too large." }, { status: 413 });
    }

    const bodyText = await request.text();
    if (new TextEncoder().encode(bodyText).length > MAX_ANALYTICS_BODY_BYTES) {
      return NextResponse.json({ error: "Analytics payload too large." }, { status: 413 });
    }

    const body = JSON.parse(bodyText);
    const parsed = analyticsTrackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid analytics payload." }, { status: 400 });
    }

    await prisma.analyticsEvent.create({
      data: {
        eventName: parsed.data.eventName,
        path: parsed.data.path,
        referrer: parsed.data.referrer,
        utmSource: parsed.data.utmSource,
        utmMedium: parsed.data.utmMedium,
        utmCampaign: parsed.data.utmCampaign,
        sessionId: parsed.data.sessionId,
        metadata: parsed.data.metadata,
      },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to track event." }, { status: 500 });
  }
}
