import { execute, queryOne, queryRows } from "@/lib/sql";

export type WaitlistSignup = {
  id: string;
  email: string;
  inviteCode: string | null;
  communityType: string | null;
  status: string;
  backendCodeId: string | null;
  referralCode: string | null;
  source: string | null;
  referredById: string | null;
  notifiedAt: Date | null;
  createdAt: Date;
};

type WaitlistRow = {
  id: string;
  email: string;
  inviteCode: string | null;
  communityType: string | null;
  status: string;
  backendCodeId: string | null;
  referralCode: string | null;
  source: string | null;
  referredById: string | null;
  notifiedAt: Date | null;
  createdAt: Date;
};

const selectColumns = `
  id, email, "inviteCode", "communityType", status, "backendCodeId",
  "referralCode", source, "referredById", "notifiedAt", "createdAt"
`;

function mapRow(row: WaitlistRow): WaitlistSignup {
  return {
    ...row,
    notifiedAt: row.notifiedAt ? new Date(row.notifiedAt) : null,
    createdAt: new Date(row.createdAt),
  };
}

export async function findWaitlistByEmail(email: string): Promise<WaitlistSignup | null> {
  const row = await queryOne<WaitlistRow>(
    `SELECT ${selectColumns} FROM "WaitlistSignup" WHERE email = $1 LIMIT 1`,
    [email],
  );
  return row ? mapRow(row) : null;
}

export async function findWaitlistById(id: string): Promise<WaitlistSignup | null> {
  const row = await queryOne<WaitlistRow>(
    `SELECT ${selectColumns} FROM "WaitlistSignup" WHERE id = $1 LIMIT 1`,
    [id],
  );
  return row ? mapRow(row) : null;
}

export async function listWaitlistSignups(limit = 100): Promise<WaitlistSignup[]> {
  const rows = await queryRows<WaitlistRow>(
    `SELECT ${selectColumns} FROM "WaitlistSignup" ORDER BY "createdAt" DESC LIMIT $1`,
    [limit],
  );
  return rows.map(mapRow);
}

export async function countWaitlistByStatus(status: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "WaitlistSignup" WHERE status = $1`,
    [status],
  );
  return Number(row?.count ?? 0);
}

export async function countWaitlistAll(): Promise<number> {
  const row = await queryOne<{ count: string }>(`SELECT COUNT(*)::text AS count FROM "WaitlistSignup"`);
  return Number(row?.count ?? 0);
}

export async function createWaitlistSignup(data: {
  email: string;
  communityType: string;
  status: string;
  inviteCode: string | null;
  backendCodeId: string | null;
  source: string;
  /** who shared the link that brought them here */
  referredById?: string | null;
}): Promise<WaitlistSignup> {
  const id = crypto.randomUUID();
  const row = await queryOne<WaitlistRow>(
    `INSERT INTO "WaitlistSignup" (
      id, email, "communityType", status, "inviteCode", "backendCodeId", source, "referredById", "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    RETURNING ${selectColumns}`,
    [
      id,
      data.email,
      data.communityType,
      data.status,
      data.inviteCode,
      data.backendCodeId,
      data.source,
      data.referredById ?? null,
    ],
  );
  if (!row) throw new Error("Failed to create waitlist signup");
  return mapRow(row);
}

/**
 * Records that the invite email actually reached the provider.
 *
 * Call this only after a successful send. approveWaitlistSignup used to set notifiedAt
 * itself, which meant the column recorded "we approved them" rather than "they were
 * told" — so a failed send was indistinguishable from a delivered one, and there was no
 * way to find the people who never received their code.
 *
 * With this split, `notifiedAt IS NULL AND "inviteCode" IS NOT NULL` is exactly the set
 * of people owed an email.
 */
export async function markWaitlistNotified(id: string): Promise<void> {
  await execute(`UPDATE "WaitlistSignup" SET "notifiedAt" = NOW() WHERE id = $1`, [id]);
}

export async function approveWaitlistSignup(
  id: string,
  inviteCode: string,
  backendCodeId: string,
): Promise<WaitlistSignup> {
  const row = await queryOne<WaitlistRow>(
    `UPDATE "WaitlistSignup"
     SET status = 'auto_invited',
         "inviteCode" = $2,
         "backendCodeId" = $3
     WHERE id = $1
     RETURNING ${selectColumns}`,
    [id, inviteCode, backendCodeId],
  );
  if (!row) throw new Error("Failed to approve waitlist signup");
  return mapRow(row);
}


/** Resolve a share link code (/w/<code>) to the signup that owns it. */
export async function findWaitlistByReferralCode(code: string): Promise<WaitlistSignup | null> {
  const row = await queryOne<WaitlistRow>(
    `SELECT ${selectColumns} FROM "WaitlistSignup" WHERE "referralCode" = $1 LIMIT 1`,
    [code],
  );
  return row ? mapRow(row) : null;
}

/** Give a signup a share code if it does not have one yet. Idempotent. */
export async function ensureReferralCode(id: string): Promise<string> {
  const existing = await queryOne<WaitlistRow>(
    `SELECT ${selectColumns} FROM "WaitlistSignup" WHERE id = $1`,
    [id],
  );
  if (existing?.referralCode) return existing.referralCode;
  const code = crypto.randomUUID().replace(/-/g, "").slice(0, 10);
  const row = await queryOne<WaitlistRow>(
    `UPDATE "WaitlistSignup" SET "referralCode" = $2 WHERE id = $1 RETURNING ${selectColumns}`,
    [id, code],
  );
  return row?.referralCode ?? code;
}

/** How many people joined through someone's link. */
export async function countReferrals(id: string): Promise<number> {
  const row = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM "WaitlistSignup" WHERE "referredById" = $1`,
    [id],
  );
  return row ? Number.parseInt(row.count, 10) || 0 : 0;
}
