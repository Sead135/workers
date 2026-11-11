import { sql } from 'drizzle-orm';
import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const webhookLogs = sqliteTable(
  'webhook_logs',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    payload: text('payload').notNull(),
    headers: text('headers'),
    status: integer('status'),
    createdAt: text('created_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`)
  },
  (table) => [index('webhook_logs_created_at_idx').on(table.createdAt)]
);
