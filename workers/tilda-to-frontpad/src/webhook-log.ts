import { eq, sql } from 'drizzle-orm';
import { createDb } from './db';
import { webhookLogs } from './db/schema';
import type { WebhookStatus } from './types.ts';

export async function webhookLog(binding: D1Database, payload: string) {
  const db = createDb(binding);

  const [log] = await db
    .insert(webhookLogs)
    .values({
      payload,
      status: 'pending'
    })
    .returning({ id: webhookLogs.id });

  await db.delete(webhookLogs).where(
    sql`${webhookLogs.id} NOT IN (
        SELECT id
        FROM ${webhookLogs}
        WHERE status = 'pending'
        ORDER BY id DESC
        LIMIT 300
      )`
  );

  return log.id;
}

export async function updateWebhookLogStatus(
  binding: D1Database,
  id: number,
  status: WebhookStatus
) {
  const db = createDb(binding);

  await db.update(webhookLogs).set({ status }).where(eq(webhookLogs.id, id));
}
