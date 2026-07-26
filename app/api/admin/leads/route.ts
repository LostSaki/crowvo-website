import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  try {
    const [waitlist, investors] = await Promise.all([
      prisma.waitlistSignup.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          email: true,
          inviteCode: true,
          referralCode: true,
          source: true,
          createdAt: true,
        },
      }),
      prisma.investorInterest.findMany({
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          company: true,
          checkSize: true,
          message: true,
          createdAt: true,
        },
      }),
    ]);

    return NextResponse.json({ waitlist, investors });
  } catch (error) {
    console.error("Admin leads query failed.", error);
    return NextResponse.json(
      { error: "Lead query failed. Verify DATABASE_URL and deployed Prisma schema." },
      { status: 500 },
    );
  }
}
