import { createFileRoute, Link } from '@tanstack/react-router'
import { Calendar, ChartColumn, Users, Wallet } from 'lucide-react'

import { BlogPostCard } from '#/components/BlogPostCard'
import {
  FloatingWhatsApp,
  LandingFooter,
  LandingHeader,
} from '#/components/LandingChrome'
import { getLatestPosts } from '#/lib/blog'
import { getAllBlogPosts } from '#/lib/blog-posts'
import {
  LANDING_FAQ,
  LANDING_FEATURES,
  LANDING_STATS,
  LANDING_STEPS,
  LANDING_TESTIMONIALS,
  getAppUrl,
  getLandingMeta,
} from '#/lib/landing-content'

export const Route = createFileRoute('/')({
  component: LandingPage,
})

const featureIcons = {
  agenda: Calendar,
  crm: Users,
  financeiro: Wallet,
  relatorios: ChartColumn,
} as const

function LandingPage() {
  const appUrl = import.meta.env.VITE_APP_URL ?? 'http://localhost:3000'
  const meta = getLandingMeta()
  const latestPosts = getLatestPosts(getAllBlogPosts(), 3)

  return (
    <>
      <main className="page-wrap px-4 pb-8">
        <LandingHeader />

        <section className="landing-hero">
          <p className="island-kicker mb-4">{meta.kicker}</p>
          <h1 className="display-title mb-5 max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            {meta.headline}
          </h1>
          <p className="mb-8 max-w-xl text-base leading-relaxed text-[var(--sea-ink-soft)] sm:text-lg">
            {meta.subheadline}
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href={getAppUrl('/signup', appUrl)}
              className="btn-primary px-6 py-3 no-underline"
            >
              Começar grátis
            </a>
            <a
              href={getAppUrl('/login', appUrl)}
              className="btn-secondary px-6 py-3 no-underline"
            >
              Entrar
            </a>
          </div>
        </section>

        <section className="landing-section" aria-label="Números do produto">
          <div className="landing-stat-grid">
            {LANDING_STATS.map((stat) => (
              <article key={stat.id} className="stat-card text-center">
                <p className="stat-card-value">{stat.value}</p>
                <p className="stat-card-label">{stat.label}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="recursos" className="landing-section">
          <p className="island-kicker mb-3">Recursos</p>
          <h2 className="landing-section-title">
            Tudo que seu negócio precisa no dia a dia
          </h2>
          <p className="landing-section-lead">
            Do primeiro agendamento ao fechamento do mês, o Agenda Pro conecta
            operação, clientes e financeiro em um fluxo simples.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {LANDING_FEATURES.map((feature) => {
              const Icon =
                featureIcons[feature.id as keyof typeof featureIcons] ??
                Calendar
              return (
                <article key={feature.id} className="landing-feature">
                  <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--lagoon-deep)]">
                    <Icon size={20} />
                  </div>
                  <h3 className="mb-1.5 text-base font-bold text-[var(--sea-ink)]">
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <section id="como-funciona" className="landing-section">
          <p className="island-kicker mb-3">Como funciona</p>
          <h2 className="landing-section-title">
            Em três passos você está no ar
          </h2>
          <p className="landing-section-lead">
            Sem planilhas, sem caderno e sem depender de mensagens soltas no
            WhatsApp para organizar a rotina.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LANDING_STEPS.map((step, index) => (
              <article key={step.id} className="landing-step">
                <span className="landing-step-number">{index + 1}</span>
                <h3 className="mb-2 text-base font-bold text-[var(--sea-ink)]">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="depoimentos" className="landing-section">
          <p className="island-kicker mb-3">Depoimentos</p>
          <h2 className="landing-section-title">Quem usa, recomenda</h2>
          <p className="landing-section-lead">
            Negócios de diferentes segmentos já simplificaram agenda,
            atendimento e controle financeiro com o Agenda Pro.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {LANDING_TESTIMONIALS.map((item) => (
              <blockquote key={item.id} className="landing-testimonial">
                <p className="landing-testimonial-quote">“{item.quote}”</p>
                <footer>
                  <p className="landing-testimonial-author">{item.author}</p>
                  <p className="landing-testimonial-role">{item.role}</p>
                </footer>
              </blockquote>
            ))}
          </div>
        </section>

        <section id="blog" className="landing-section">
          <p className="island-kicker mb-3">Blog</p>
          <h2 className="landing-section-title">
            Dicas para organizar seu negócio
          </h2>
          <p className="landing-section-lead">
            Artigos práticos sobre agenda, clientes e financeiro para salões,
            clínicas e consultórios.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {latestPosts.map((post) => (
              <BlogPostCard key={post.slug} post={post} />
            ))}
          </div>
          <div className="mt-6">
            <Link to="/blog" className="btn-secondary px-5 py-2.5 no-underline">
              Ver todos os artigos
            </Link>
          </div>
        </section>

        <section id="faq" className="landing-section">
          <p className="island-kicker mb-3">FAQ</p>
          <h2 className="landing-section-title">Perguntas frequentes</h2>
          <div className="mt-8 grid gap-3">
            {LANDING_FAQ.map((item) => (
              <article key={item.id} className="landing-faq-item">
                <h3 className="landing-faq-question">{item.question}</h3>
                <p className="landing-faq-answer">{item.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="landing-section">
          <div className="landing-cta-band text-center md:text-left md:flex md:items-center md:justify-between md:gap-6">
            <div>
              <h2 className="landing-section-title">{meta.ctaTitle}</h2>
              <p className="landing-section-lead mx-auto md:mx-0">
                {meta.ctaDescription}
              </p>
            </div>
            <div className="mt-6 flex shrink-0 flex-wrap justify-center gap-3 md:mt-0 md:justify-end">
              <a
                href={getAppUrl('/signup', appUrl)}
                className="btn-primary px-6 py-3 no-underline"
              >
                Começar grátis
              </a>
              <a
                href={getAppUrl('/login', appUrl)}
                className="btn-secondary px-6 py-3 no-underline"
              >
                Já tenho conta
              </a>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
      <FloatingWhatsApp />
    </>
  )
}
