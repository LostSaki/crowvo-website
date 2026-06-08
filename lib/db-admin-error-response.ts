import { Prisma } from "@prisma/client";

function unreachableTargetHint(databaseUrl?: string): string | undefined {
  if (!databaseUrl?.trim()) {
    return "Set DATABASE_URL as a secret (e.g. in Cloudflare) to a Postgres host reachable from your runtime—not empty.";
  }
  const normalized = databaseUrl.toLowerCase();
  if (
    normalized.includes("@db:") ||
    normalized.includes("@localhost") ||
    normalized.includes("@127.0.0.1") ||
    normalized.includes(":5432/hubly")
  ) {
    return (
      'DATABASE_URL still points at local/Docker Postgres (e.g. host "db" or localhost). ' +
      "That never works from Cloudflare Workers, and fails for `npm run dev` outside Docker unless you fix it.\n\n" +
      "Fix: paste Supabase's **transaction pooler** URL (usually port **6543**, ends with **?pgbouncer=true**…) into " +
      "Cloudflare Workers **DATABASE_URL secret**, and optionally into a `.env.local` file (same key) so local Next overrides this compose URL. Then run `prisma db push` against your Supabase DB once."
    );
  }
  return undefined;
}

function prismaErrorHint(error: unknown): string | undefined {
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return (
      unreachableTargetHint(process.env.DATABASE_URL) ??
      "Prisma could not initialize a database connection—check DATABASE_URL format, TLS/sslmode, and that the hostname is reachable from your deployment."
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2021":
        return "A table Prisma expects is missing. Run prisma db push (or prisma migrate deploy) against this DATABASE_URL.";
      case "P1001":
      case "P1017":
        return (
          unreachableTargetHint(process.env.DATABASE_URL) ??
          "Database server unreachable or timed out—check DATABASE_URL hostname, firewall, TLS, and that the provider allows your runtime’s outbound connections."
        );
      case "P1000":
        return "Wrong database credentials in DATABASE_URL, or DB user/host not authorized.";
      default:
        return undefined;
    }
  }
  if (error instanceof Prisma.PrismaClientRustPanicError || error instanceof Prisma.PrismaClientUnknownRequestError) {
    return unreachableTargetHint(process.env.DATABASE_URL);
  }
  return unreachableTargetHint(process.env.DATABASE_URL);
}

export function adminDatabaseFailurePayload(error: unknown): { error: string; hint?: string } {
  const base = {
    error: "Admin data query failed. Verify DATABASE_URL and deployed Prisma schema.",
  };

  console.error("[admin-db]", error instanceof Error ? error.message : error);
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    console.error("[admin-db] prisma.code=", error.code, "meta=", error.meta);
  }

  const hint = prismaErrorHint(error);
  return hint ? { ...base, hint } : base;
}
