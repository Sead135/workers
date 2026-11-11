import { sql } from 'drizzle-orm';
import { createDb } from './db';
import { webhookLogs } from './db/schema';

export async function webhookLog(binding: D1Database, payload: string) {
  const db = createDb(binding);

  await db.insert(webhookLogs).values({ payload });

  await db.delete(webhookLogs).where(
    sql`${webhookLogs.id} NOT IN (
        SELECT id
        FROM ${webhookLogs}
        ORDER BY id DESC
        LIMIT 300
      )`
  );
}
