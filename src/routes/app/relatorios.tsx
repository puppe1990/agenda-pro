import { createFileRoute } from '@tanstack/react-router'
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { PageHeader } from '#/components/PageHeader'
import { formatCents } from '#/lib/money'
import {
  financialSummaryFn,
  listAppointmentsFn,
  listGoalsFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/relatorios')({
  loader: async () => {
    const [summary, appointments, goals] = await Promise.all([
      financialSummaryFn(),
      listAppointmentsFn(),
      listGoalsFn(),
    ])
    const completed = appointments.filter(
      (a) => a.status === 'completed',
    ).length
    const noShows = appointments.filter((a) => a.status === 'no_show').length
    const total = appointments.length || 1
    return {
      summary,
      goals,
      attendanceRate: Math.round((completed / total) * 100),
      noShowRate: Math.round((noShows / total) * 100),
      chart: [
        { name: 'Receita', value: summary.revenueCents / 100 },
        { name: 'Despesas', value: summary.expenseCents / 100 },
        { name: 'Lucro', value: summary.profitCents / 100 },
      ],
    }
  },
  component: RelatoriosPage,
})

function RelatoriosPage() {
  const data = Route.useLoaderData()

  function exportCsv() {
    const rows = [
      ['metrica', 'valor'],
      ['receita_centavos', String(data.summary.revenueCents)],
      ['despesa_centavos', String(data.summary.expenseCents)],
      ['lucro_centavos', String(data.summary.profitCents)],
      ['comparecimento_pct', String(data.attendanceRate)],
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'relatorio-agenda-pro.csv'
    a.click()
  }

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Relatórios"
        description="Indicadores financeiros e operacionais."
      />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Metric
          label="Receita"
          value={formatCents(data.summary.revenueCents)}
        />
        <Metric label="Lucro" value={formatCents(data.summary.profitCents)} />
        <Metric label="Comparecimento" value={`${data.attendanceRate}%`} />
      </div>
      <div className="mb-4 h-64 rounded-xl border bg-white/40 p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.chart}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#2f6a4a" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {data.goals[0] && (
        <p className="mb-4 text-sm">
          Meta do mês: {formatCents(data.goals[0].targetRevenueCents)}
        </p>
      )}
      <button
        type="button"
        className="rounded-xl border px-4 py-2 text-sm"
        onClick={exportCsv}
      >
        Exportar CSV
      </button>
    </section>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-white/50 p-3">
      <p className="text-xs text-[var(--sea-ink-soft)]">{label}</p>
      <p className="font-bold">{value}</p>
    </div>
  )
}
