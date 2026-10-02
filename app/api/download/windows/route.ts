import { createReadStream, existsSync, statSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const FILE_NAME = "CrowvoSetup-0.1.0.exe";

function installerPath() {
  const fromEnv = process.env.DESKTOP_INSTALLER_PATH?.trim();
  const candidates = [
    fromEnv,
    join(process.cwd(), "..", "crowvo-app", "desktop", "release", FILE_NAME),
    join(process.cwd(), "crowvo-app", "desktop", "release", FILE_NAME),
  ].filter((value): value is string => Boolean(value));
  return candidates.find((file) => existsSync(file)) ?? null;
}

export async function GET() {
  const file = installerPath();
  if (!file) {
    return NextResponse.json(
      { error: "Windows installer is not available on this host yet. Set NEXT_PUBLIC_DESKTOP_DOWNLOAD_URL." },
      { status: 404 },
    );
  }

  const { size } = statSync(file);
  const stream = Readable.toWeb(createReadStream(file)) as ReadableStream;

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Disposition": `attachment; filename="${FILE_NAME}"`,
      "Content-Length": String(size),
      "Cache-Control": "private, no-store",
    },
  });
}
