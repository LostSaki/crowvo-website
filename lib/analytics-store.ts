import { execute, queryRows } from "@/lib/sql";

export type AnalyticsEventRow = {
  eventName: string;
  utmSource: string | null;
  createdAt: Date;
};

export async function createAnalyticsEvent(data: {
  eventName: string;
  path?: string | null;
  referrer?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  sessionId?: string | null;
  metadata?: unknown;
}): Promise<void> {
  const id = crypto.randomUUID();
  const metadata =
    data.metadata === undefined || data.metadata === null
      ? null
      : JSON.stringify(data.metadata);

  await execute(
    `INSERT INTO "AnalyticsEvent" (
      id, "eventName", path, referrer, "utmSource", "utmMedium", "utmCampaign",
      "sessionId", metadata, "createdAt"
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())`,
    [
      id,
      data.eventName,
      data.path ?? null,
      data.referrer ?? null,
      data.utmSource ?? null,
      data.utmMedium ?? null,
      data.utmCampaign ?? null,
      data.sessionId ?? null,
      metadata,
    ],
  );
}

export async function listRecentAnalyticsEvents(limit = 500): Promise<AnalyticsEventRow[]> {
  const rows = await queryRows<{ eventName: string; utmSource: string | null; createdAt: Date }>(
    `SELECT "eventName", "utmSource", "createdAt"
     FROM "AnalyticsEvent"
     ORDER BY "createdAt" DESC
     LIMIT $1`,
    [limit],
  );
  return rows.map((row) => ({
    eventName: row.eventName,
    utmSource: row.utmSource,
    createdAt: new Date(row.createdAt),
  }));
}
