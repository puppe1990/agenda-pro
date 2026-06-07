import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { formatCents } from '#/lib/money'
import {
  closeCashFn,
  financialSummaryFn,
  listExpensesFn,
  listTransactionsFn,
  openCashFn,
  saveExpenseFn,
  saveTransactionFn,
  setGoalFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/financeiro')({
  loader: async () => {
    const [summary, transactions, expenses] = await Promise.all([
      financialSummaryFn(),
      listTransactionsFn(),
      listExpensesFn(),
    ])
    return { summary, transactions, expenses }
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

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Financeiro"
        description="Receitas, despesas, caixa e metas."
      />
      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <Stat label="Receita" value={formatCents(data.summary.revenueCents)} />
        <Stat label="Despesas" value={formatCents(data.summary.expenseCents)} />
        <Stat label="Lucro" value={formatCents(data.summary.profitCents)} />
      </div>
      <div className="mb-6 flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm"
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
            className="rounded-xl border px-3 py-2 text-sm"
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
        <button
          type="button"
          className="rounded-xl border px-3 py-2 text-sm"
          onClick={async () => {
            const now = new Date()
            await setGoal({
              data: {
                year: now.getFullYear(),
                month: now.getMonth() + 1,
                targetRevenueCents: 100_000,
              },
            })
          }}
        >
          Meta R$ 1.000
        </button>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <FinanceForm
          title="Nova receita"
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
          withCategory
        />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <List title="Receitas" items={data.transactions} />
        <List title="Despesas" items={data.expenses} />
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white/50 p-3">
      <p className="text-xs text-[var(--sea-ink-soft)]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  )
}

function FinanceForm({
  title,
  onSubmit,
  withCategory,
}: {
  title: string
  onSubmit: (values: Record<string, string>) => Promise<void>
  withCategory?: boolean
}) {
  const [description, setDescription] = useState('')
  const [amountCents, setAmountCents] = useState('5000')
  const [category, setCategory] = useState('Geral')

  return (
    <form
      className="rounded-xl border bg-white/40 p-4"
      onSubmit={async (e) => {
        e.preventDefault()
        await onSubmit({ description, amountCents, category })
      }}
    >
      <h3 className="mb-3 font-semibold">{title}</h3>
      <input
        className="mb-2 w-full rounded-xl border px-3 py-2"
        placeholder="Descrição"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        required
      />
      <input
        className="mb-2 w-full rounded-xl border px-3 py-2"
        placeholder="Valor em centavos"
        value={amountCents}
        onChange={(e) => setAmountCents(e.target.value)}
        required
      />
      {withCategory && (
        <input
          className="mb-2 w-full rounded-xl border px-3 py-2"
          placeholder="Categoria"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
      )}
      <button
        type="submit"
        className="rounded-xl bg-[var(--lagoon-deep)] px-3 py-2 text-sm font-semibold text-white"
      >
        Salvar
      </button>
    </form>
  )
}

function List({
  title,
  items,
}: {
  title: string
  items: Array<{ id: string; description: string; amountCents: number }>
}) {
  return (
    <div>
      <h3 className="mb-2 font-semibold">{title}</h3>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-xl border bg-white/50 p-2 text-sm"
          >
            {item.description} — {formatCents(item.amountCents)}
          </li>
        ))}
      </ul>
    </div>
  )
}
