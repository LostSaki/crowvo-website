import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type TopReferrer = {
  email: string;
  inviteCode: string;
  _count: { referrals: number };
};

type RecentSignup = {
  id: string;
  email: string;
  inviteCode: string;
  referralCode: string | null;
  source: string | null;
  createdAt: Date;
};

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [waitlistCount, investorCount, latestWaitlist, topReferrers, recentEvents] = await Promise.all([
    prisma.waitlistSignup.count(),
    prisma.investorInterest.count(),
    prisma.waitlistSignup.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        email: true,
        inviteCode: true,
        referralCode: true,
        source: true,
        createdAt: true,
      },
    }),
    prisma.waitlistSignup.findMany({
      take: 5,
      orderBy: {
        referrals: {
          _count: "desc",
        },
      },
      select: {
        email: true,
        inviteCode: true,
        _count: { select: { referrals: true } },
      },
    }),
    prisma.analyticsEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        eventName: true,
        utmSource: true,
        createdAt: true,
      },
    }),
  ]);

  const referralSignups = latestWaitlist.filter((item: RecentSignup) => Boolean(item.referralCode)).length;
  const directSignups = latestWaitlist.length - referralSignups;
  const estimatedConversionRate = waitlistCount > 0 ? Number(((investorCount / waitlistCount) * 100).toFixed(2)) : 0;

  const securityEvents = latestWaitlist.slice(0, 8).map((item: RecentSignup) => ({
    id: item.id,
    time: item.createdAt.toISOString(),
    type: item.source?.includes("http") ? "referrer-signup" : "direct-signup",
    severity: item.referralCode ? "low" : "info",
    detail: item.referralCode
      ? `Signup used referral code ${item.referralCode}.`
      : "Signup joined without referral code.",
  }));

  const pageViews = recentEvents.filter((event) => event.eventName === "page_view").length;
  const startHubClicks = recentEvents.filter((event) => event.eventName === "cta_start_hub_click").length;
  const waitlistCtaClicks = recentEvents.filter((event) => event.eventName === "cta_waitlist_click").length;
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
    waitlistCount,
    investorCount,
    latestWaitlist,
    analytics: {
      referralSignups,
      directSignups,
      estimatedConversionRate,
      pageViews,
      startHubClicks,
      waitlistCtaClicks,
      requestDeckClicks,
      topTrafficSources,
    },
    securityEvents,
    topReferrers: topReferrers.map((item: TopReferrer) => ({
      email: item.email,
      inviteCode: item.inviteCode,
      referrals: item._count.referrals,
    })),
  });
}
