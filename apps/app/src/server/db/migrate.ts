import { migrate } from 'drizzle-orm/libsql/migrator'

import { db } from '#/server/db/client'

export async function runMigrations() {
  await migrate(db, { migrationsFolder: './drizzle' })
}
