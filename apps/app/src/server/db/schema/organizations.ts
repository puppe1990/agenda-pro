import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { users } from './auth'

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}

export const organizations = sqliteTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  publicSlug: text('public_slug').notNull().unique(),
  timezone: text('timezone').notNull().default('America/Sao_Paulo'),
  noShowPenaltyCents: integer('no_show_penalty_cents').notNull().default(0),
  logoUrl: text('logo_url'),
  ...timestamps,
})

export const memberships = sqliteTable('memberships', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  role: text('role', {
    enum: ['owner', 'admin', 'professional', 'receptionist'],
  }).notNull(),
  ...timestamps,
})

export const organizationSettings = sqliteTable('organization_settings', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' })
    .unique(),
  bookingEnabled: integer('booking_enabled', { mode: 'boolean' })
    .notNull()
    .default(true),
  requirePhone: integer('require_phone', { mode: 'boolean' })
    .notNull()
    .default(true),
  ...timestamps,
})
