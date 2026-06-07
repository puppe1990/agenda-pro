import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  ArrowDownCircle,
  ArrowUpCircle,
  PiggyBank,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { formatCents } from '#/lib/money'
import {
  closeCashFn,
  financialSummaryFn,
  listExpensesFn,
  listGoalsFn,
  listTransactionsFn,
  openCashFn,
  saveExpenseFn,
  saveTransactionFn,
  setGoalFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/financeiro')({
  loader: async () => {
    const [summary, transactions, expenses, goals] = await Promise.all([
      financialSummaryFn(),
      listTransactionsFn(),
      listExpensesFn(),
      listGoalsFn(),
    ])
    return { summary, transactions, expenses, goals }
  },
  component: FinanceiroPage,
})

function FinanceiroPage() {
  const data = Route.useLoaderData()
  const saveTransaction = useServerFn(saveTransactionFn)
  const saveExpense = useServerFn(saveExpenseFn)
  const openCash = useServerFn(openCashFn)
  const closeCash = useServerFn(closeCashFn)
  const setGoal = useServerFn(setGoalFn)
  const [sessionId, setSessionId] = useState<string | null>(null)

  const now = new Date()
  const currentGoal = data.goals.find(
    (goal) =>
      goal.year === now.getFullYear() && goal.month === now.getMonth() + 1,
  )
  const goalProgress = currentGoal
    ? Math.min(
        100,
        Math.round(
          (data.summary.revenueCents / currentGoal.targetRevenueCents) * 100,
        ),
      )
    : null
  const marginPct =
    data.summary.revenueCents > 0
      ? Math.round((data.summary.profitCents / data.summary.revenueCents) * 100)
      : 0

  const sortedTransactions = useMemo(
    () =>
      [...data.transactions].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data.transactions],
  )
  const sortedExpenses = useMemo(
    () =>
      [...data.expenses].sort(
        (a, b) =>
          new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime(),
      ),
    [data.expenses],
  )

  const periodLabel = now.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Financeiro"
        description={`Receitas, despesas, caixa e metas de ${periodLabel}.`}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Receitas" value={String(sortedTransactions.length)} />
        <StatChip label="Despesas" value={String(sortedExpenses.length)} />
        <StatChip
          label="Margem"
          value={data.summary.revenueCents > 0 ? `${marginPct}%` : '—'}
        />
        <StatChip
          label="Caixa"
          value={sessionId ? 'Aberto' : 'Fechado'}
          active={!!sessionId}
        />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Receita do mês"
          value={formatCents(data.summary.revenueCents)}
          icon={TrendingUp}
          tone="text-emerald-700"
        />
        <KpiCard
          label="Despesas"
          value={formatCents(data.summary.expenseCents)}
          icon={TrendingDown}
          tone="text-amber-700"
        />
        <KpiCard
          label="Lucro"
          value={formatCents(data.summary.profitCents)}
          icon={Wallet}
          tone="text-[var(--lagoon-deep)]"
          hint={
            data.summary.revenueCents > 0
              ? `${marginPct}% da receita`
              : undefined
          }
        />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <Panel title="Controle de caixa" subtitle="Abra e feche o caixa do dia">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn-secondary"
              disabled={!!sessionId}
              onClick={async () => {
                const id = await openCash({ data: { openingBalanceCents: 0 } })
                setSessionId(id)
              }}
            >
              Abrir caixa
            </button>
            {sessionId && (
              <button
                type="button"
                className="btn-primary"
                onClick={async () => {
                  await closeCash({
                    data: {
                      sessionId,
                      closingBalanceCents: data.summary.revenueCents,
                    },
                  })
                  setSessionId(null)
                }}
              >
                Fechar caixa
              </button>
            )}
          </div>
          {sessionId && (
            <p className="mt-3 rounded-lg bg-[var(--accent-soft)] px-3 py-2 text-xs font-medium text-[var(--lagoon-deep)]">
              Sessão ativa — lembre de fechar ao final do expediente.
            </p>
          )}
        </Panel>

        <Panel title="Meta mensal" subtitle="Acompanhe o objetivo de receita">
          {currentGoal ? (
            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="font-semibold text-[var(--sea-ink)]">
                  {formatCents(data.summary.revenueCents)}
                </span>
                <span className="text-[var(--sea-ink-soft)]">
                  de {formatCents(currentGoal.targetRevenueCents)}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-[var(--surface)]">
                <div
                  className="h-full rounded-full bg-[var(--lagoon-deep)]"
                  style={{ width: `${goalProgress ?? 0}%` }}
                />
              </div>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
                <Target size={13} />
                {goalProgress}% da meta atingida
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Nenhuma meta definida para este mês.
              </p>
              <button
                type="button"
                className="btn-secondary"
                onClick={async () => {
                  await setGoal({
                    data: {
                      year: now.getFullYear(),
                      month: now.getMonth() + 1,
                      targetRevenueCents: 100_000,
                    },
                  })
                  window.location.reload()
                }}
              >
                Meta R$ 1.000
              </button>
            </div>
          )}
        </Panel>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-2">
        <FinanceForm
          title="Nova receita"
          icon={ArrowUpCircle}
          accent="text-emerald-700"
          submitLabel="Salvar receita"
          onSubmit={async (values) => {
            await saveTransaction({
              data: {
                description: values.description,
                amountCents: Number(values.amountCents),
              },
            })
            window.location.reload()
          }}
        />
        <FinanceForm
          title="Nova despesa"
          icon={ArrowDownCircle}
          accent="text-amber-700"
          submitLabel="Salvar despesa"
          withCategory
          onSubmit={async (values) => {
            await saveExpense({
              data: {
                description: values.description,
                amountCents: Number(values.amountCents),
                category: values.category || 'Geral',
                type: 'variable',
                expenseDate: new Date().toISOString().slice(0, 10),
              },
            })
            window.location.reload()
          }}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Ledger
          title="Receitas recentes"
          emptyLabel="Nenhuma receita lançada ainda."
          icon={PiggyBank}
          items={sortedTransactions.map((item) => ({
            id: item.id,
            title: item.description,
            amountCents: item.amountCents,
            meta: item.status === 'paid' ? 'Pago' : item.status,
            date: item.paidAt ?? item.createdAt,
            positive: true,
          }))}
        />
        <Ledger
          title="Despesas recentes"
          emptyLabel="Nenhuma despesa lançada ainda."
          icon={Wallet}
          items={sortedExpenses.map((item) => ({
            id: item.id,
            title: item.description,
            amountCents: item.amountCents,
            meta: item.category,
            date: item.expenseDate,
            positive: false,
          }))}
        />
      </div>
    </section>
  )
}

function KpiCard({
  label,
  value,
  icon: Icon,
  tone,
  hint,
}: {
  label: string
  value: string
  icon: typeof TrendingUp
  tone: string
  hint?: string
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <p className="stat-card-label">{label}</p>
        <Icon size={16} className={tone} />
      </div>
      <p className="stat-card-value">{value}</p>
      {hint && (
        <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{hint}</p>
      )}
    </div>
  )
}

function StatChip({
  label,
  value,
  active,
}: {
  label: string
  value: string
  active?: boolean
}) {
  return (
    <div
      className={`rounded-full border px-3 py-1.5 text-xs ${
        active
          ? 'border-[var(--lagoon-deep)] bg-[var(--accent-soft)]'
          : 'border-[var(--line)] bg-[var(--surface)]'
      }`}
    >
      <span className="text-[var(--sea-ink-soft)]">{label}: </span>
      <span className="font-bold text-[var(--sea-ink)]">{value}</span>
    </div>
  )
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 sm:p-5">
      <div className="mb-3">
        <h2 className="text-sm font-bold text-[var(--sea-ink)]">{title}</h2>
        <p className="text-xs text-[var(--sea-ink-soft)]">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function FinanceForm({
  title,
  icon: Icon,
  accent,
  submitLabel,
  onSubmit,
  withCategory,
}: {
  title: string
  icon: typeof ArrowUpCircle
  accent: string
  submitLabel: string
  onSubmit: (values: Record<string, string>) => Promise<void>
  withCategory?: boolean
}) {
  const [description, setDescription] = useState('')
  const [amountCents, setAmountCents] = useState('5000')
  const [category, setCategory] = useState('Geral')

  return (
    <form
      className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 sm:p-5"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit({ description, amountCents, category })
      }}
    >
      <div className="mb-4 flex items-center gap-2">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--surface)] ${accent}`}
        >
          <Icon size={16} />
        </span>
        <h3 className="text-sm font-bold text-[var(--sea-ink)]">{title}</h3>
      </div>

      <div className="grid gap-3">
        <Field label="Descrição">
          <input
            placeholder="Ex.: Consulta, produto, aluguel..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </Field>
        <Field label="Valor (centavos)">
          <input
            type="number"
            min={0}
            step={100}
            value={amountCents}
            onChange={(e) => setAmountCents(e.target.value)}
            required
          />
        </Field>
        <p className="text-xs text-[var(--sea-ink-soft)]">
          Valor informado:{' '}
          <span className="font-semibold text-[var(--lagoon-deep)]">
            {formatCents(Number(amountCents) || 0)}
          </span>
        </p>
        {withCategory && (
          <Field label="Categoria">
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </Field>
        )}
        <button type="submit" className="btn-primary mt-1 w-full">
          {submitLabel}
        </button>
      </div>
    </form>
  )
}

function Ledger({
  title,
  emptyLabel,
  icon: Icon,
  items,
}: {
  title: string
  emptyLabel: string
  icon: typeof Wallet
  items: Array<{
    id: string
    title: string
    amountCents: number
    meta?: string
    date?: string | null
    positive?: boolean
  }>
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-bold text-[var(--sea-ink)]">
          <Icon size={16} className="text-[var(--lagoon-deep)]" />
          {title}
        </h3>
        <span className="text-xs text-[var(--sea-ink-soft)]">
          {items.length} registro(s)
        </span>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-8 text-center text-sm text-[var(--sea-ink-soft)]">
          {emptyLabel}
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm shadow-sm"
            >
              <div className="min-w-0">
                <p className="font-semibold text-[var(--sea-ink)]">
                  {item.title}
                </p>
                <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                  {item.meta}
                  {item.date
                    ? ` · ${new Date(item.date).toLocaleDateString('pt-BR')}`
                    : ''}
                </p>
              </div>
              <span
                className={`shrink-0 font-bold ${
                  item.positive ? 'text-emerald-700' : 'text-amber-700'
                }`}
              >
                {item.positive ? '+' : '-'}
                {formatCents(item.amountCents)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--sea-ink-soft)]">
      {label}
      <div className="mt-1.5 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-[var(--lagoon-deep)] [&_input]:focus:ring-2 [&_input]:focus:ring-[var(--accent-soft)]">
        {children}
      </div>
    </label>
  )
}
