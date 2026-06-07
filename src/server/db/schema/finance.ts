import { sql } from 'drizzle-orm'
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core'

import { appointments } from './scheduling'
import { organizations } from './organizations'

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`CURRENT_TIMESTAMP`),
}

export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  appointmentId: text('appointment_id').references(() => appointments.id, {
    onDelete: 'set null',
  }),
  description: text('description').notNull(),
  amountCents: integer('amount_cents').notNull(),
  status: text('status', { enum: ['pending', 'paid', 'partial'] })
    .notNull()
    .default('paid'),
  paidAt: text('paid_at'),
  ...timestamps,
})

export const expenses = sqliteTable('expenses', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  amountCents: integer('amount_cents').notNull(),
  category: text('category').notNull(),
  type: text('type', { enum: ['fixed', 'variable'] }).notNull(),
  recurring: integer('recurring', { mode: 'boolean' }).notNull().default(false),
  expenseDate: text('expense_date').notNull(),
  ...timestamps,
})

export const cashSessions = sqliteTable('cash_sessions', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  openedAt: text('opened_at').notNull(),
  closedAt: text('closed_at'),
  openingBalanceCents: integer('opening_balance_cents').notNull().default(0),
  closingBalanceCents: integer('closing_balance_cents'),
  ...timestamps,
})

export const financialGoals = sqliteTable('financial_goals', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  year: integer('year').notNull(),
  month: integer('month').notNull(),
  targetRevenueCents: integer('target_revenue_cents').notNull(),
  ...timestamps,
})

export const receipts = sqliteTable('receipts', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id')
    .notNull()
    .references(() => transactions.id, { onDelete: 'cascade' }),
  contentHtml: text('content_html').notNull(),
  ...timestamps,
})

export const dailyStats = sqliteTable('daily_stats', {
  id: text('id').primaryKey(),
  organizationId: text('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  revenueCents: integer('revenue_cents').notNull().default(0),
  expenseCents: integer('expense_cents').notNull().default(0),
  appointmentCount: integer('appointment_count').notNull().default(0),
  completedCount: integer('completed_count').notNull().default(0),
  noShowCount: integer('no_show_count').notNull().default(0),
})
