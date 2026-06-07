import { createFileRoute } from '@tanstack/react-router'

import { PageHeader } from '#/components/PageHeader'
import { formatCents } from '#/lib/money'
import {
  financialSummaryFn,
  listAppointmentsFn,
  listClientsFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/dashboard')({
  loader: async () => {
    const [summary, appointments, clients] = await Promise.all([
      financialSummaryFn(),
      listAppointmentsFn(),
      listClientsFn({ data: {} }),
    ])
    return { summary, appointments, clients }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const { summary, appointments, clients } = Route.useLoaderData()
  const today = new Date().toISOString().slice(0, 10)
  const todayAppointments = appointments.filter((item) =>
    item.startsAt.startsWith(today),
  )

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Dashboard"
        description="Visão rápida do seu negócio hoje."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatCents(summary.revenueCents)}
        />
        <StatCard label="Despesas" value={formatCents(summary.expenseCents)} />
        <StatCard label="Lucro" value={formatCents(summary.profitCents)} />
        <StatCard label="Clientes" value={String(clients.length)} />
      </div>
      <div className="mt-6">
        <h2 className="mb-2 font-semibold">Agenda de hoje</h2>
        {todayAppointments.length === 0 ? (
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Nenhum atendimento para hoje.
          </p>
        ) : (
          <ul className="space-y-2">
            {todayAppointments.map((item) => (
              <li
                key={item.id}
                className="rounded-xl border border-white/60 bg-white/40 px-3 py-2 text-sm"
              >
                {new Date(item.startsAt).toLocaleTimeString('pt-BR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                — {item.status}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white/40 p-4">
      <p className="text-xs text-[var(--sea-ink-soft)]">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  )
}
