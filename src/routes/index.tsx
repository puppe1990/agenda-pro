import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

function LandingPage() {
  return (
    <main className="page-wrap px-4 pb-8 pt-14">
      <section className="island-shell rounded-[2rem] px-6 py-10 sm:px-10 sm:py-14">
        <p className="island-kicker mb-3">Agenda Pro</p>
        <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Agenda, clientes e financeiro em um só lugar.
        </h1>
        <p className="mb-8 max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Substitua a agenda física, permita agendamento online e acompanhe o
          desempenho do seu negócio com relatórios claros.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/signup"
            className="rounded-full border border-[rgba(50,143,151,0.3)] bg-[rgba(79,184,178,0.14)] px-5 py-2.5 text-sm font-semibold text-[var(--lagoon-deep)] no-underline"
          >
            Começar grátis
          </Link>
          <Link
            to="/login"
            className="rounded-full border border-[rgba(23,58,64,0.2)] bg-white/50 px-5 py-2.5 text-sm font-semibold text-[var(--sea-ink)] no-underline"
          >
            Entrar
          </Link>
        </div>
      </section>
    </main>
  )
}
