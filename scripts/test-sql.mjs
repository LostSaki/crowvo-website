import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const sql = postgres(process.env.DATABASE_URL, {
  ssl: "require",
  prepare: false,
  max: 1,
});

try {
  const rows = await sql`SELECT COUNT(*)::int AS c FROM "WaitlistSignup"`;
  console.log("ok", rows);
} catch (err) {
  console.error("err", err instanceof Error ? err.message : err);
} finally {
  await sql.end({ timeout: 5 });
}
