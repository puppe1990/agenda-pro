import { sql } from 'drizzle-orm'
import { sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { clients } from './clients'
import { organizations } from './organizations'

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}

export const anamnesisForms = sqliteTable('anamnesis_forms', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  fieldsJson: text('fields_json').notNull(),
  ...timestamps,
})

export const anamnesisRecords = sqliteTable('anamnesis_records', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  formId: text('form_id')
    .notNull()
    .references(() => anamnesisForms.id, { onDelete: 'cascade' }),
  responsesJson: text('responses_json').notNull(),
  recordedAt: text('recorded_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  ...timestamps,
})
