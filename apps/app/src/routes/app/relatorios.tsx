import { createFileRoute } from '@tanstack/react-router'
import {
  CalendarCheck,
  Download,
  Percent,
  Target,
  TrendingDown,
  TrendingUp,
  UserX,
  Wallet,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { formatCents } from '#/lib/money'
import {
  financialSummaryFn,
  listAppointmentsFn,
  listGoalsFn,
} from '#/server/fns/app'

const CHART_COLORS = {
  Receita: '#be123c',
  Despesas: '#d97706',
  Lucro: '#9f1239',
} as const

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Agendados',
  confirmed: 'Confirmados',
  completed: 'Concluídos',
  cancelled: 'Cancelados',
  no_show: 'Faltas',
}

const STATUS_COLORS: Record<string, string> = {
  scheduled: '#64748b',
  confirmed: '#0ea5e9',
  completed: '#be123c',
  cancelled: '#94a3b8',
  no_show: '#dc2626',
}

export const Route = createFileRoute('/app/relatorios')({
  loader: async () => {
    const [summary, appointments, goals] = await Promise.all([
      financialSummaryFn(),
      listAppointmentsFn(),
      listGoalsFn(),
    ])

    const now = new Date()
    const statusCounts = appointments.reduce<Record<string, number>>(
      (acc, item) => {
        acc[item.status] = (acc[item.status] ?? 0) + 1
        return acc
      },
      {},
    )

    const completed = statusCounts.completed ?? 0
    const noShows = statusCounts.no_show ?? 0
    const cancelled = statusCounts.cancelled ?? 0
    const actionable = appointments.length - cancelled
    const total = actionable || 1

    const currentGoal = goals.find(
      (goal) =>
        goal.year === now.getFullYear() && goal.month === now.getMonth() + 1,
    )

    const goalProgress = currentGoal
      ? Math.min(
          100,
          Math.round(
            (summary.revenueCents / currentGoal.targetRevenueCents) * 100,
          ),
        )
      : null

    const marginPct =
      summary.revenueCents > 0
        ? Math.round((summary.profitCents / summary.revenueCents) * 100)
        : 0

    return {
      summary,
      currentGoal,
      goalProgress,
      marginPct,
      attendanceRate: Math.round((completed / total) * 100),
      noShowRate: Math.round((noShows / total) * 100),
      statusBreakdown: Object.entries(statusCounts)
        .map(([status, count]) => ({
          status,
          label: STATUS_LABELS[status] ?? status,
          count,
          pct: Math.round((count / (appointments.length || 1)) * 100),
          color: STATUS_COLORS[status] ?? '#64748b',
        }))
        .sort((a, b) => b.count - a.count),
      chart: [
        { name: 'Receita', value: summary.revenueCents / 100 },
        { name: 'Despesas', value: summary.expenseCents / 100 },
        {
          name: 'Lucro',
          value: Math.max(0, summary.profitCents / 100),
        },
      ],
      periodLabel: now.toLocaleDateString('pt-BR', {
        month: 'long',
        year: 'numeric',
      }),
      totalAppointments: appointments.length,
    }
  },
  component: RelatoriosPage,
})

function RelatoriosPage() {
  const data = Route.useLoaderData()

  function exportCsv() {
    const rows = [
      ['metrica', 'valor'],
      ['periodo', data.periodLabel],
      ['receita_centavos', String(data.summary.revenueCents)],
      ['despesa_centavos', String(data.summary.expenseCents)],
      ['lucro_centavos', String(data.summary.profitCents)],
      ['margem_pct', String(data.marginPct)],
      ['comparecimento_pct', String(data.attendanceRate)],
      ['faltas_pct', String(data.noShowRate)],
      ['total_agendamentos', String(data.totalAppointments)],
      ...(data.currentGoal
        ? [
            ['meta_centavos', String(data.currentGoal.targetRevenueCents)],
            ['meta_progresso_pct', String(data.goalProgress ?? 0)],
          ]
        : []),
      ...data.statusBreakdown.map((item) => [
        `status_${item.status}`,
        String(item.count),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `relatorio-agenda-pro-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4 border-b border-[var(--line)] pb-5">
        <div>
          <h1 className="page-title">Relatórios</h1>
          <p className="page-subtitle">Indicadores de {data.periodLabel}.</p>
        </div>
        <button
          type="button"
          className="btn-secondary shrink-0"
          onClick={exportCsv}
        >
          <Download size={16} />
          Exportar CSV
        </button>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Receita"
          value={formatCents(data.summary.revenueCents)}
          icon={TrendingUp}
          tone="text-emerald-700"
        />
        <KpiCard
          label="Despesas"
          value={formatCents(data.summary.expenseCents)}
          icon={Wallet}
          tone="text-amber-700"
        />
        <KpiCard
          label="Lucro"
          value={formatCents(data.summary.profitCents)}
          icon={TrendingUp}
          tone="text-[var(--lagoon-deep)]"
          hint={`Margem ${data.marginPct}%`}
        />
        <KpiCard
          label="Comparecimento"
          value={`${data.attendanceRate}%`}
          icon={CalendarCheck}
          tone="text-[var(--palm)]"
          hint={`${data.noShowRate}% faltas`}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <ReportPanel
            title="Resumo financeiro"
            subtitle="Valores do mês atual"
          >
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={data.chart}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <CartesianGrid
                    stroke="var(--line)"
                    strokeDasharray="4 4"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'var(--sea-ink-soft)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--sea-ink-soft)', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) =>
                      new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                        notation: 'compact',
                        maximumFractionDigits: 0,
                      }).format(Number(v))
                    }
                  />
                  <Tooltip
                    cursor={{ fill: 'var(--accent-soft)' }}
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      const value = Number(payload[0]?.value ?? 0)
                      return (
                        <div className="rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm shadow-md">
                          <p className="font-semibold text-[var(--sea-ink)]">
                            {label}
                          </p>
                          <p className="text-[var(--sea-ink-soft)]">
                            {formatCents(Math.round(value * 100))}
                          </p>
                        </div>
                      )
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={72}>
                    {data.chart.map((entry) => (
                      <Cell
                        key={entry.name}
                        fill={
                          CHART_COLORS[entry.name as keyof typeof CHART_COLORS]
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ReportPanel>
        </div>

        <div className="flex flex-col gap-6 lg:col-span-2">
          <ReportPanel title="Meta do mês" subtitle="Progresso da receita">
            {data.currentGoal ? (
              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="font-semibold text-[var(--sea-ink)]">
                    {formatCents(data.summary.revenueCents)}
                  </span>
                  <span className="text-[var(--sea-ink-soft)]">
                    de {formatCents(data.currentGoal.targetRevenueCents)}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                  <div
                    className="h-full rounded-full bg-[var(--lagoon-deep)] transition-all"
                    style={{ width: `${data.goalProgress ?? 0}%` }}
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-sm text-[var(--sea-ink-soft)]">
                  <Target size={14} />
                  {data.goalProgress}% da meta atingida
                </p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-6 text-center">
                <Target
                  size={22}
                  className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
                />
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Nenhuma meta definida para este mês.
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                  Configure em Financeiro.
                </p>
              </div>
            )}
          </ReportPanel>

          <ReportPanel
            title="Operacional"
            subtitle={`${data.totalAppointments} agendamentos no total`}
          >
            {data.statusBreakdown.length === 0 ? (
              <p className="text-sm text-[var(--sea-ink-soft)]">
                Sem dados de agendamento ainda.
              </p>
            ) : (
              <ul className="space-y-3">
                {data.statusBreakdown.map((item) => (
                  <li key={item.status}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="font-medium text-[var(--sea-ink)]">
                        {item.label}
                      </span>
                      <span className="text-[var(--sea-ink-soft)]">
                        {item.count} · {item.pct}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${item.pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </ReportPanel>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <InsightCard
          icon={Percent}
          label="Margem líquida"
          value={`${data.marginPct}%`}
          detail="Lucro sobre receita do mês"
        />
        <InsightCard
          icon={UserX}
          label="Taxa de faltas"
          value={`${data.noShowRate}%`}
          detail="Clientes que não compareceram"
        />
        <InsightCard
          icon={TrendingDown}
          label="Despesas / receita"
          value={
            data.summary.revenueCents > 0
              ? `${Math.round((data.summary.expenseCents / data.summary.revenueCents) * 100)}%`
              : '—'
          }
          detail="Proporção de custos no período"
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

function ReportPanel({
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
      <div className="mb-4">
        <h2 className="text-sm font-bold text-[var(--sea-ink)]">{title}</h2>
        <p className="text-xs text-[var(--sea-ink-soft)]">{subtitle}</p>
      </div>
      {children}
    </div>
  )
}

function InsightCard({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Percent
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
      <div className="mb-2 flex items-center gap-2 text-[var(--lagoon-deep)]">
        <Icon size={15} />
        <span className="text-xs font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="text-xl font-bold text-[var(--sea-ink)]">{value}</p>
      <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">{detail}</p>
    </div>
  )
}
