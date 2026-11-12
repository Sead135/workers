import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';

const dbCache = new WeakMap<D1Database, ReturnType<typeof drizzle>>();

export function createDb(binding: D1Database) {
  const cached = dbCache.get(binding);

  if (cached) {
    return cached;
  }

  const db = drizzle(binding, { schema });
  dbCache.set(binding, db);

  return db;
}
