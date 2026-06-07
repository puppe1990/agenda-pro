import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { clients } from './clients'
import { organizations } from './organizations'
import { staffProfiles } from './team'

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}

export const services = sqliteTable('services', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id').references(() => staffProfiles.id, {
    onDelete: 'set null',
  }),
  name: text('name').notNull(),
  description: text('description'),
  durationMinutes: integer('duration_minutes').notNull().default(30),
  priceCents: integer('price_cents').notNull().default(0),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  imageKey: text('image_key'),
  ...timestamps,
})

export const availabilityRules = sqliteTable('availability_rules', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  dayOfWeek: integer('day_of_week').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  ...timestamps,
})

export const availabilityExceptions = sqliteTable('availability_exceptions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  isBlocked: integer('is_blocked', { mode: 'boolean' }).notNull().default(true),
  startTime: text('start_time'),
  endTime: text('end_time'),
  reason: text('reason'),
  ...timestamps,
})

export const appointments = sqliteTable('appointments', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  staffProfileId: text('staff_profile_id')
    .notNull()
    .references(() => staffProfiles.id, { onDelete: 'cascade' }),
  clientId: text('client_id')
    .notNull()
    .references(() => clients.id, { onDelete: 'cascade' }),
  serviceId: text('service_id')
    .notNull()
    .references(() => services.id, { onDelete: 'cascade' }),
  startsAt: text('starts_at').notNull(),
  endsAt: text('ends_at').notNull(),
  status: text('status', {
    enum: ['scheduled', 'confirmed', 'completed', 'cancelled', 'no_show'],
  })
    .notNull()
    .default('scheduled'),
  notes: text('notes'),
  ...timestamps,
})

export const appointmentStatusHistory = sqliteTable(
  'appointment_status_history',
  {
    id: text('id').primaryKey(),
    organizationId: text('organization_id').notNull(),
    appointmentId: text('appointment_id')
      .notNull()
      .references(() => appointments.id, { onDelete: 'cascade' }),
    fromStatus: text('from_status'),
    toStatus: text('to_status').notNull(),
    changedAt: text('changed_at')
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
)

export const noShows = sqliteTable('no_shows', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  appointmentId: text('appointment_id')
    .notNull()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  recordedAt: text('recorded_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
})

export const noShowPenalties = sqliteTable('no_show_penalties', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  appointmentId: text('appointment_id')
    .notNull()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  paid: integer('paid', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const appointmentCharges = sqliteTable('appointment_charges', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id').notNull(),
  appointmentId: text('appointment_id')
    .notNull()
    .references(() => appointments.id, { onDelete: 'cascade' }),
  amountCents: integer('amount_cents').notNull(),
  description: text('description').notNull(),
  ...timestamps,
})
