import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  CalendarDays,
  Check,
  Copy,
  Database,
  Download,
  ExternalLink,
  FlaskConical,
  LogOut,
  Search,
  Settings,
  Shield,
  Trash2,
  User,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { authClient } from '#/lib/auth-client'
import {
  deleteClientDataFn,
  exportClientDataFn,
  getPublicBookingLinkFn,
  listClientsFn,
  seedDemoFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/configuracoes')({
  loader: async () => {
    const [clients, bookingLink] = await Promise.all([
      listClientsFn({ data: {} }),
      getPublicBookingLinkFn(),
    ])
    return { clients, bookingLink }
  },
  component: ConfiguracoesPage,
})

function ConfiguracoesPage() {
  const { clients, bookingLink } = Route.useLoaderData()
  const exportClient = useServerFn(exportClientDataFn)
  const deleteClient = useServerFn(deleteClientDataFn)
  const seedDemo = useServerFn(seedDemoFn)
  const [q, setQ] = useState('')
  const [copied, setCopied] = useState(false)
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'danger'
    message: string
  } | null>(null)

  const bookingUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}${bookingLink.bookingPath}`
      : bookingLink.bookingPath

  const filteredClients = useMemo(() => {
    const query = q.trim().toLowerCase()
    return clients
      .filter(
        (client) =>
          !query ||
          client.name.toLowerCase().includes(query) ||
          (client.email ?? '').toLowerCase().includes(query) ||
          (client.phone ?? '').includes(q.trim()),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [clients, q])

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Configurações"
        description="Link público, privacidade e conta."
        icon={Settings}
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Clientes" value={String(clients.length)} />
        <StatChip label="Slug" value={bookingLink.publicSlug} />
        {import.meta.env.DEV && (
          <StatChip label="Ambiente" value="Desenvolvimento" active />
        )}
      </div>

      {feedback && (
        <div
          className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'danger'
              ? 'demo-alert demo-alert-danger'
              : 'demo-alert'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-[var(--lagoon-deep)]/20 bg-[var(--accent-soft)]/40 p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--surface)] text-[var(--lagoon-deep)] shadow-sm">
              <CalendarDays size={20} />
            </span>
            <div>
              <h2 className="text-sm font-bold text-[var(--sea-ink)]">
                Link de agendamento
              </h2>
              <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                Compartilhe com clientes para agendar online, 24h por dia.
              </p>
            </div>
          </div>
          <span className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold text-[var(--sea-ink)]">
            {bookingLink.organizationName}
          </span>
        </div>

        <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3 sm:p-4">
          <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]">
            URL pública
          </p>
          <p
            className="mb-3 truncate font-mono text-sm text-[var(--sea-ink)]"
            title={bookingUrl}
          >
            {bookingUrl}
          </p>
          <p className="mb-4 text-xs text-[var(--sea-ink-soft)]">
            Caminho:{' '}
            <code className="text-[var(--lagoon-deep)]">
              {bookingLink.bookingPath}
            </code>
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              className="btn-primary flex-1"
              onClick={async () => {
                await navigator.clipboard.writeText(bookingUrl)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? 'Link copiado' : 'Copiar link'}
            </button>
            <a
              className="btn-secondary flex-1 no-underline"
              href={bookingLink.bookingPath}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={16} />
              Visualizar página
            </a>
          </div>
        </div>

        {!bookingLink.bookingEnabled && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            O agendamento online está desativado. Clientes verão uma mensagem ao
            acessar o link.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Panel
            icon={Shield}
            title="LGPD — dados do cliente"
            subtitle="Exporte ou exclua dados pessoais mediante solicitação."
          >
            <div className="mb-4 relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
              />
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Buscar cliente por nome, e-mail ou telefone"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>

            <div className="mb-3 flex items-center justify-between">
              <span className="text-xs text-[var(--sea-ink-soft)]">
                {filteredClients.length} cliente(s)
              </span>
            </div>

            {filteredClients.length === 0 ? (
              <EmptyState
                title={
                  q.trim()
                    ? 'Nenhum cliente encontrado'
                    : 'Nenhum cliente cadastrado'
                }
                description={
                  q.trim()
                    ? 'Tente outro termo de busca.'
                    : 'Cadastre clientes para gerenciar dados LGPD.'
                }
              />
            ) : (
              <ul className="space-y-2">
                {filteredClients.map((client) => (
                  <li
                    key={client.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 font-semibold text-[var(--sea-ink)]">
                        <User size={14} className="text-[var(--lagoon-deep)]" />
                        {client.name}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                        {[client.phone, client.email]
                          .filter(Boolean)
                          .join(' · ') || 'Sem contato cadastrado'}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      <ActionButton
                        icon={Download}
                        onClick={async () => {
                          const payload = await exportClient({
                            data: { clientId: client.id },
                          })
                          const blob = new Blob(
                            [JSON.stringify(payload, null, 2)],
                            { type: 'application/json' },
                          )
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url
                          a.download = `cliente-${client.id}.json`
                          a.click()
                          URL.revokeObjectURL(url)
                          setFeedback({
                            type: 'success',
                            message: `Exportado: ${client.name}`,
                          })
                        }}
                      >
                        Exportar JSON
                      </ActionButton>
                      <ActionButton
                        icon={Trash2}
                        variant="danger"
                        onClick={async () => {
                          if (
                            !window.confirm(
                              `Excluir permanentemente os dados de ${client.name}?`,
                            )
                          ) {
                            return
                          }
                          await deleteClient({ data: { clientId: client.id } })
                          setFeedback({
                            type: 'danger',
                            message: `Excluído: ${client.name}`,
                          })
                          window.location.reload()
                        }}
                      >
                        Excluir
                      </ActionButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <p className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-xs leading-relaxed text-[var(--sea-ink-soft)]">
              A exportação LGPD gera um JSON com dados pessoais, notas,
              agendamentos e registros clínicos do cliente. A exclusão é
              permanente e irreversível.
            </p>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel
            icon={LogOut}
            title="Sessão"
            subtitle="Encerre sua sessão neste dispositivo."
          >
            <button
              type="button"
              className="btn-secondary w-full"
              onClick={async () => {
                await authClient.signOut()
                window.location.href = '/'
              }}
            >
              <LogOut size={16} />
              Sair da conta
            </button>
          </Panel>

          {import.meta.env.DEV && (
            <Panel
              icon={FlaskConical}
              title="Ambiente de demo"
              subtitle="Popular dados de exemplo para testes locais."
            >
              <p className="mb-3 text-sm text-[var(--sea-ink-soft)]">
                Cria organização <strong>studio-demo</strong> com serviços,
                profissionais e link de agendamento público.
              </p>
              <button
                type="button"
                className="btn-secondary w-full"
                onClick={async () => {
                  const result = await seedDemo()
                  setFeedback({
                    type: 'success',
                    message: `Demo criada. Acesse ${result.bookingPath ?? '/book/studio-demo'}`,
                  })
                }}
              >
                <Database size={16} />
                Seed studio-demo
              </button>
            </Panel>
          )}
        </div>
      </div>
    </section>
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
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: typeof Shield
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 sm:p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[var(--lagoon-deep)]">
          <Icon size={18} />
        </span>
        <div>
          <h2 className="text-sm font-bold text-[var(--sea-ink)]">{title}</h2>
          <p className="text-xs text-[var(--sea-ink-soft)]">{subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center">
      <Shield size={24} className="mx-auto mb-2 text-[var(--sea-ink-soft)]" />
      <p className="text-sm font-medium text-[var(--sea-ink)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{description}</p>
    </div>
  )
}

function ActionButton({
  children,
  icon: Icon,
  onClick,
  variant = 'default',
}: {
  children: React.ReactNode
  icon: typeof Download
  onClick: () => void | Promise<void>
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--chip-bg)] ${
        variant === 'danger'
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-[var(--line)] text-[var(--sea-ink-soft)]'
      }`}
      onClick={() => void onClick()}
    >
      <Icon size={13} />
      {children}
    </button>
  )
}
