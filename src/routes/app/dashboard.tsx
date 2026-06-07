import { createFileRoute } from '@tanstack/react-router'
import { CalendarDays, TrendingUp, Users, Wallet } from 'lucide-react'

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
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Dashboard"
        description="Visão rápida do seu negócio hoje."
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatCents(summary.revenueCents)}
          icon={TrendingUp}
          accent="text-emerald-700"
        />
        <StatCard
          label="Despesas"
          value={formatCents(summary.expenseCents)}
          icon={Wallet}
          accent="text-amber-700"
        />
        <StatCard
          label="Lucro"
          value={formatCents(summary.profitCents)}
          icon={TrendingUp}
          accent="text-[var(--lagoon-deep)]"
        />
        <StatCard
          label="Clientes"
          value={String(clients.length)}
          icon={Users}
          accent="text-[var(--palm)]"
        />
      </div>
      <div className="mt-8">
        <div className="mb-3 flex items-center gap-2">
          <CalendarDays size={18} className="text-[var(--lagoon-deep)]" />
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">
            Agenda de hoje
          </h2>
        </div>
        {todayAppointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-8 text-center">
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Nenhum atendimento para hoje.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todayAppointments.map((item) => (
              <li key={item.id} className="demo-list-item text-sm">
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

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string
  value: string
  icon: typeof TrendingUp
  accent: string
}) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between gap-2">
        <p className="stat-card-label">{label}</p>
        <Icon size={16} className={accent} />
      </div>
      <p className="stat-card-value">{value}</p>
    </div>
  )
}
