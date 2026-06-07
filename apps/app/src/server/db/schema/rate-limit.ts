import { sql } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

export const rateLimitHits = sqliteTable('rate_limit_hits', {
  id: text('id').primaryKey(),
  bucketKey: text('bucket_key').notNull(),
  hitAt: text('hit_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})
