import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client/wasm";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Required for Cloudflare Workers (no TCP/WebSocket); also works for local dev against Supabase pooler.
neonConfig.poolQueryViaFetch = true;

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  const adapter = new PrismaNeon({ connectionString });
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });
}

/** Edge-safe Prisma (no native query engine — works on Cloudflare Workers). */
export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (!globalForPrisma.prisma) {
  globalForPrisma.prisma = prisma;
}
