import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { users } from './auth'
import { organizations } from './organizations'

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}

export const staffProfiles = sqliteTable('staff_profiles', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name').notNull(),
  commissionPercent: integer('commission_percent').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

export const commissions = sqliteTable('commissions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  appointmentId: text('appointment_id'),
  transactionId: text('transaction_id'),
  amountCents: integer('amount_cents').notNull(),
  ...timestamps,
})
