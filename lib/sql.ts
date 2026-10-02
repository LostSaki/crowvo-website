import { Client, type QueryResultRow } from "pg";
import { getCloudflareContext } from "@opennextjs/cloudflare";

async function resolveConnectionString(): Promise<string> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    if (env.HYPERDRIVE?.connectionString) {
      return env.HYPERDRIVE.connectionString;
    }
  } catch {
    // Local dev without Cloudflare context.
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured");
  }
  return connectionString;
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: await resolveConnectionString() });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export async function queryRows<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T[]> {
  return withClient(async (client) => {
    const result = await client.query<T>(text, values);
    return result.rows;
  });
}

export async function queryOne<T extends QueryResultRow>(
  text: string,
  values: unknown[] = [],
): Promise<T | null> {
  const rows = await queryRows<T>(text, values);
  return rows[0] ?? null;
}

export async function execute(text: string, values: unknown[] = []): Promise<void> {
  await withClient(async (client) => {
    await client.query(text, values);
  });
}
