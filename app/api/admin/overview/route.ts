import { NextRequest, NextResponse } from "next/server";
import { adminAuthErrorResponse, requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    return adminAuthErrorResponse(error);
  }

  let recentEvents: { eventName: string; utmSource: string | null; createdAt: Date }[] = [];

  try {
    recentEvents = await prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        eventName: true,
        utmSource: true,
        createdAt: true,
      },
    });
  } catch (error) {
    console.error("Admin analytics query failed.", error);
    return NextResponse.json({ error: "Analytics query failed." }, { status: 500 });
  }

  const pageViews = recentEvents.filter((event) => event.eventName === "page_view").length;
  const startHubClicks = recentEvents.filter((event) => event.eventName === "cta_start_hub_click").length;
  const launchAppClicks = recentEvents.filter((event) => event.eventName === "cta_launch_app_click").length;
  const requestDeckClicks = recentEvents.filter((event) => event.eventName === "cta_request_deck_click").length;
  const topTrafficSources = Object.entries(
    recentEvents.reduce<Record<string, number>>((acc, event) => {
      const source = event.utmSource ?? "direct";
      acc[source] = (acc[source] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([source, count]) => ({ source, count }));

  return NextResponse.json({
    analytics: {
      pageViews,
      startHubClicks,
      launchAppClicks,
      requestDeckClicks,
      topTrafficSources,
    },
  });
}
