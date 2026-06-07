import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarDays,
  LayoutDashboard,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import { useMemo } from 'react'

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

const STATUS_META: Record<string, { label: string; className: string }> = {
  scheduled: { label: 'Agendado', className: 'bg-slate-100 text-slate-700' },
  confirmed: { label: 'Confirmado', className: 'bg-sky-100 text-sky-800' },
  completed: {
    label: 'Concluído',
    className: 'bg-emerald-100 text-emerald-800',
  },
  cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
  no_show: { label: 'Falta', className: 'bg-red-100 text-red-700' },
}

function DashboardPage() {
  const { summary, appointments, clients } = Route.useLoaderData()
  const today = new Date().toISOString().slice(0, 10)
  const todayAppointments = appointments.filter((item) =>
    item.startsAt.startsWith(today),
  )

  const clientById = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients],
  )

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Dashboard"
        description="Visão rápida do seu negócio hoje."
        icon={LayoutDashboard}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Receita do mês"
          value={formatCents(summary.revenueCents)}
          icon={TrendingUp}
          iconBg="rgba(16, 185, 129, 0.12)"
          iconColor="#065f46"
        />
        <StatCard
          label="Despesas"
          value={formatCents(summary.expenseCents)}
          icon={Wallet}
          iconBg="rgba(245, 158, 11, 0.12)"
          iconColor="#92400e"
        />
        <StatCard
          label="Lucro"
          value={formatCents(summary.profitCents)}
          icon={TrendingUp}
          iconBg="var(--accent-soft)"
          iconColor="var(--lagoon-deep)"
        />
        <StatCard
          label="Clientes"
          value={String(clients.length)}
          icon={Users}
          iconBg="rgba(59, 130, 246, 0.12)"
          iconColor="#1d4ed8"
        />
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarDays size={16} className="text-[var(--lagoon-deep)]" />
            <h2 className="text-sm font-bold text-[var(--sea-ink)]">
              Agenda de hoje
            </h2>
          </div>
          {todayAppointments.length > 0 && (
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {todayAppointments.length} atendimento
              {todayAppointments.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {todayAppointments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-8 text-center">
            <CalendarDays
              size={24}
              className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
            />
            <p className="text-sm text-[var(--sea-ink-soft)]">
              Nenhum atendimento para hoje.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {todayAppointments.map((item) => {
              const client = clientById.get(item.clientId)
              const status = STATUS_META[item.status] ?? {
                label: item.status,
                className: 'bg-gray-100 text-gray-600',
              }
              return (
                <li key={item.id} className="apt-row">
                  <span className="apt-time">
                    {new Date(item.startsAt).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <span className="apt-client">
                    {client?.name ?? 'Cliente'}
                  </span>
                  <span className={`apt-badge ${status.className}`}>
                    {status.label}
                  </span>
                </li>
              )
            })}
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
  iconBg,
  iconColor,
}: {
  label: string
  value: string
  icon: typeof TrendingUp
  iconBg: string
  iconColor: string
}) {
  return (
    <div className="stat-card flex items-center gap-3">
      <div
        style={{ background: iconBg, color: iconColor }}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <p className="stat-card-label">{label}</p>
        <p className="stat-card-value">{value}</p>
      </div>
    </div>
  )
}
