import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "crowvo-website",
      timestamp: new Date().toISOString(),
    },
    { status: 200 },
  );
}
