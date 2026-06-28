import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LeaderboardEntry = {
  _count: { referrals: number };
};

export async function GET() {
  const leaders = await prisma.waitlistSignup.findMany({
    select: {
      _count: {
        select: {
          referrals: true,
        },
      },
    },
    orderBy: {
      referrals: {
        _count: "desc",
      },
    },
    take: 10,
  });

  return NextResponse.json({
    leaders: leaders.map((entry: LeaderboardEntry, index: number) => ({
      rank: index + 1,
      displayName: `Ambassador #${index + 1}`,
      referrals: entry._count.referrals,
    })),
  });
}
