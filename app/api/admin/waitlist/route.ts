import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/admin-auth";

type WaitlistCsvRow = {
  email: string;
  inviteCode: string;
  referralCode: string | null;
  source: string | null;
  createdAt: Date;
};

function escapeCsv(value: string | null) {
  if (!value) {
    return "";
  }
  return `"${value.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  try {
    await requireAdmin(request);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unauthorized";
    return NextResponse.json({ error: message }, { status: 401 });
  }

  let rows: WaitlistCsvRow[] = [];
  try {
    rows = await prisma.waitlistSignup.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Admin waitlist export query failed.", error);
    return NextResponse.json(
      { error: "Waitlist export failed. Verify DATABASE_URL and deployed Prisma schema." },
      { status: 500 },
    );
  }

  const header = "email,inviteCode,referralCode,source,createdAt";
  const body = rows
    .map((row: WaitlistCsvRow) =>
      [
        escapeCsv(row.email),
        escapeCsv(row.inviteCode),
        escapeCsv(row.referralCode),
        escapeCsv(row.source),
        row.createdAt.toISOString(),
      ].join(","),
    )
    .join("\n");

  return new NextResponse(`${header}\n${body}`, {
    headers: {
      "content-type": "text/csv",
      "content-disposition": "attachment; filename=waitlist.csv",
    },
  });
}
