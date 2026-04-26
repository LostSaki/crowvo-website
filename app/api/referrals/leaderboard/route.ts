import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type LeaderboardEntry = {
  email: string;
  inviteCode: string;
  _count: { referrals: number };
};

export async function GET() {
  const leaders = await prisma.waitlistSignup.findMany({
    select: {
      id: true,
      email: true,
      inviteCode: true,
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
      email: entry.email,
      inviteCode: entry.inviteCode,
      referrals: entry._count.referrals,
    })),
  });
}
