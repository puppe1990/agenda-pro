import { and, eq, gte, lte, sql } from 'drizzle-orm'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import {
  cashSessions,
  commissions,
  dailyStats,
  expenses,
  financialGoals,
  receipts,
  staffProfiles,
  transactions,
} from '#/server/db/schema'

export async function recordTransaction(input: {
  organizationId: string
  description: string
  amountCents: number
  appointmentId?: string
  status?: 'pending' | 'paid' | 'partial'
}) {
  const id = createId()
  await db.insert(transactions).values({
    id,
    organizationId: input.organizationId,
    appointmentId: input.appointmentId,
    description: input.description,
    amountCents: input.amountCents,
    status: input.status ?? 'paid',
    paidAt: new Date().toISOString(),
  })
  return id
}

export async function recordExpense(input: {
  organizationId: string
  description: string
  amountCents: number
  category: string
  type: 'fixed' | 'variable'
  recurring?: boolean
  expenseDate: string
}) {
  const id = createId()
  await db.insert(expenses).values({
    id,
    organizationId: input.organizationId,
    description: input.description,
    amountCents: input.amountCents,
    category: input.category,
    type: input.type,
    recurring: input.recurring ?? false,
    expenseDate: input.expenseDate,
  })
  return id
}

export async function openCashSession(input: {
  organizationId: string
  openingBalanceCents: number
}) {
  const id = createId()
  await db.insert(cashSessions).values({
    id,
    organizationId: input.organizationId,
    openedAt: new Date().toISOString(),
    openingBalanceCents: input.openingBalanceCents,
  })
  return id
}

export async function closeCashSession(input: {
  organizationId: string
  sessionId: string
  closingBalanceCents: number
}) {
  await db
    .update(cashSessions)
    .set({
      closedAt: new Date().toISOString(),
      closingBalanceCents: input.closingBalanceCents,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(cashSessions.id, input.sessionId),
        eq(cashSessions.organizationId, input.organizationId),
      ),
    )
}

export async function calculateCommission(input: {
  organizationId: string
  staffProfileId: string
  transactionId: string
  amountCents: number
}) {
  const staff = await db.query.staffProfiles.findFirst({
    where: and(
      eq(staffProfiles.id, input.staffProfileId),
      eq(staffProfiles.organizationId, input.organizationId),
    ),
  })

  if (!staff || staff.commissionPercent <= 0) {
    return null
  }

  const amountCents = Math.round(
    (input.amountCents * staff.commissionPercent) / 100,
  )

  const id = createId()
  await db.insert(commissions).values({
    id,
    organizationId: input.organizationId,
    staffProfileId: input.staffProfileId,
    transactionId: input.transactionId,
    amountCents,
  })

  return id
}

export async function getFinancialSummary(
  organizationId: string,
  from: string,
  to: string,
) {
  const [revenue] = await db
    .select({
      total: sql<number>`coalesce(sum(${transactions.amountCents}), 0)`,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.organizationId, organizationId),
        gte(transactions.createdAt, from),
        lte(transactions.createdAt, to),
      ),
    )

  const [expenseTotal] = await db
    .select({
      total: sql<number>`coalesce(sum(${expenses.amountCents}), 0)`,
    })
    .from(expenses)
    .where(
      and(
        eq(expenses.organizationId, organizationId),
        gte(expenses.expenseDate, from.slice(0, 10)),
        lte(expenses.expenseDate, to.slice(0, 10)),
      ),
    )

  const revenueCents = Number(revenue?.total ?? 0)
  const expenseCents = Number(expenseTotal?.total ?? 0)

  return {
    revenueCents,
    expenseCents,
    profitCents: revenueCents - expenseCents,
  }
}

export async function upsertDailyStats(input: {
  organizationId: string
  date: string
  revenueCents: number
  expenseCents: number
  appointmentCount: number
  completedCount: number
  noShowCount: number
}) {
  const existing = await db.query.dailyStats.findFirst({
    where: and(
      eq(dailyStats.organizationId, input.organizationId),
      eq(dailyStats.date, input.date),
    ),
  })

  if (existing) {
    await db.update(dailyStats).set(input).where(eq(dailyStats.id, existing.id))
    return existing.id
  }

  const id = createId()
  await db.insert(dailyStats).values({ id, ...input })
  return id
}

export async function setFinancialGoal(input: {
  organizationId: string
  year: number
  month: number
  targetRevenueCents: number
}) {
  const existing = await db.query.financialGoals.findFirst({
    where: and(
      eq(financialGoals.organizationId, input.organizationId),
      eq(financialGoals.year, input.year),
      eq(financialGoals.month, input.month),
    ),
  })

  if (existing) {
    await db
      .update(financialGoals)
      .set({
        targetRevenueCents: input.targetRevenueCents,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(financialGoals.id, existing.id))
    return existing.id
  }

  const id = createId()
  await db.insert(financialGoals).values({ id, ...input })
  return id
}

export async function generateReceipt(input: {
  organizationId: string
  transactionId: string
  orgName: string
  amountCents: number
  description: string
}) {
  const html = `<html><body><h1>Recibo - ${input.orgName}</h1><p>${input.description}</p><p>Valor: R$ ${(input.amountCents / 100).toFixed(2)}</p></body></html>`
  const id = createId()
  await db.insert(receipts).values({
    id,
    organizationId: input.organizationId,
    transactionId: input.transactionId,
    contentHtml: html,
  })
  return { id, html }
}
