import { Link, createFileRoute } from '@tanstack/react-router'
import { Calendar, ChartColumn, Users, Wallet } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const features = [
  {
    icon: Calendar,
    title: 'Agenda inteligente',
    description:
      'Visão por dia ou semana, busca rápida e agendamento sem fricção.',
  },
  {
    icon: Users,
    title: 'CRM de clientes',
    description: 'Histórico, notas e busca por nome ou telefone em segundos.',
  },
  {
    icon: Wallet,
    title: 'Financeiro integrado',
    description: 'Receitas, despesas e lucro do mês no mesmo painel.',
  },
  {
    icon: ChartColumn,
    title: 'Relatórios claros',
    description: 'Acompanhe desempenho e exporte dados quando precisar.',
  },
]

function LandingPage() {
  return (
    <main className="page-wrap px-4 pb-16">
      <header className="flex items-center justify-between py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--lagoon-deep)] text-sm font-bold text-white">
            AP
          </span>
          <span className="text-sm font-bold text-[var(--sea-ink)]">
            Agenda Pro
          </span>
        </div>
        <Link to="/login" className="btn-secondary px-4 py-2 text-sm">
          Entrar
        </Link>
      </header>

      <section className="landing-hero">
        <p className="island-kicker mb-4">
          Para salões, clínicas e consultórios
        </p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Agenda, clientes e financeiro em um só lugar.
        </h1>
        <p className="mb-8 max-w-xl text-base leading-relaxed text-[var(--sea-ink-soft)] sm:text-lg">
          Substitua a agenda física, permita agendamento online e acompanhe o
          desempenho do seu negócio com relatórios claros.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/signup" className="btn-primary px-6 py-3 no-underline">
            Começar grátis
          </Link>
          <Link to="/login" className="btn-secondary px-6 py-3 no-underline">
            Entrar
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon
          return (
            <article key={feature.title} className="landing-feature">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--lagoon-deep)]">
                <Icon size={20} />
              </div>
              <h2 className="mb-1.5 text-base font-bold text-[var(--sea-ink)]">
                {feature.title}
              </h2>
              <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">
                {feature.description}
              </p>
            </article>
          )
        })}
      </section>
    </main>
  )
}
