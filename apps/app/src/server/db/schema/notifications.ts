import { sql } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { organizations } from './organizations'

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}

export const messageTemplates = sqliteTable('message_templates', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  type: text('type', {
    enum: ['reminder', 'confirmation', 'birthday', 'custom'],
  }).notNull(),
  name: text('name').notNull(),
  body: text('body').notNull(),
  ...timestamps,
})

export const notificationQueue = sqliteTable('notification_queue', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  clientId: text('client_id'),
  channel: text('channel', { enum: ['whatsapp', 'email'] })
    .notNull()
    .default('whatsapp'),
  phone: text('phone'),
  message: text('message').notNull(),
  scheduledAt: text('scheduled_at').notNull(),
  status: text('status', { enum: ['pending', 'sent', 'cancelled'] })
    .notNull()
    .default('pending'),
  sentAt: text('sent_at'),
  ...timestamps,
})
