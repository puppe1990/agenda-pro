import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  Clock,
  ExternalLink,
  MessageCircle,
  MessageSquareText,
  Send,
  Sparkles,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { listQueueFn, listTemplatesFn, saveTemplateFn } from '#/server/fns/app'
import { buildWhatsAppUrl, renderTemplate } from '#/server/services/whatsapp'

const TEMPLATE_TYPES = [
  { value: 'reminder', label: 'Lembrete' },
  { value: 'confirmation', label: 'Confirmação' },
  { value: 'birthday', label: 'Aniversário' },
  { value: 'custom', label: 'Personalizado' },
] as const

const TYPE_LABELS: Record<string, string> = {
  reminder: 'Lembrete',
  confirmation: 'Confirmação',
  birthday: 'Aniversário',
  custom: 'Personalizado',
}

const STATUS_META: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pendente', className: 'bg-amber-100 text-amber-800' },
  sent: { label: 'Enviado', className: 'bg-emerald-100 text-emerald-800' },
  cancelled: { label: 'Cancelado', className: 'bg-gray-100 text-gray-600' },
}

const PREVIEW_VARS = {
  cliente: 'Maria Silva',
  data: '10/06 às 14:00',
  servico: 'Consulta',
}

const DEFAULT_BODY =
  'Olá {cliente}, lembramos seu horário em {data} para {servico}.'

export const Route = createFileRoute('/app/whatsapp')({
  loader: async () => {
    const [templates, queue] = await Promise.all([
      listTemplatesFn(),
      listQueueFn(),
    ])
    return { templates, queue }
  },
  component: WhatsAppPage,
})

function WhatsAppPage() {
  const data = Route.useLoaderData()
  const saveTemplate = useServerFn(saveTemplateFn)
  const [name, setName] = useState('Lembrete padrão')
  const [type, setType] =
    useState<(typeof TEMPLATE_TYPES)[number]['value']>('reminder')
  const [body, setBody] = useState(DEFAULT_BODY)

  const pendingCount = data.queue.filter(
    (item) => item.status === 'pending',
  ).length
  const sentCount = data.queue.filter((item) => item.status === 'sent').length
  const preview = useMemo(() => renderTemplate(body, PREVIEW_VARS), [body])

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="WhatsApp"
        description="Templates, fila e deep links wa.me."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Templates" value={String(data.templates.length)} />
        <StatChip label="Pendentes" value={String(pendingCount)} />
        <StatChip label="Enviados" value={String(sentCount)} />
        <StatChip label="Fila total" value={String(data.queue.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2">
          <Panel
            title="Editor de template"
            subtitle="Use variáveis entre chaves"
          >
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                await saveTemplate({
                  data: { type, name, body },
                })
                window.location.reload()
              }}
            >
              <Field label="Nome do template">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </Field>
              <Field label="Tipo">
                <select
                  value={type}
                  onChange={(e) =>
                    setType(
                      e.target
                        .value as (typeof TEMPLATE_TYPES)[number]['value'],
                    )
                  }
                >
                  {TEMPLATE_TYPES.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Mensagem">
                <textarea
                  className="min-h-[7rem] resize-y font-mono text-[0.8125rem]"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  required
                />
              </Field>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                  <Sparkles size={13} />
                  Pré-visualização
                </p>
                <p className="text-sm leading-relaxed text-[var(--sea-ink)]">
                  {preview}
                </p>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {Object.keys(PREVIEW_VARS).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-2 py-0.5 font-mono text-[0.65rem] text-[var(--lagoon-deep)]"
                    onClick={() =>
                      setBody((current) =>
                        current.includes(`{${key}}`)
                          ? current
                          : `${current} {${key}}`,
                      )
                    }
                  >
                    {`{${key}}`}
                  </button>
                ))}
              </div>

              <button type="submit" className="btn-primary mt-1 w-full">
                Salvar template
              </button>
            </form>
          </Panel>
        </div>

        <div className="xl:col-span-3">
          <div className="mb-6">
            <SectionHeader
              title="Templates salvos"
              count={data.templates.length}
            />
            {data.templates.length === 0 ? (
              <EmptyState
                icon={MessageSquareText}
                title="Nenhum template ainda"
                description="Crie seu primeiro template ao lado."
              />
            ) : (
              <ul className="space-y-2">
                {data.templates.map((template) => (
                  <li
                    key={template.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[var(--sea-ink)]">
                        {template.name}
                      </p>
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--lagoon-deep)]">
                        {TYPE_LABELS[template.type] ?? template.type}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed text-[var(--sea-ink-soft)]">
                      {template.body}
                    </p>
                    <button
                      type="button"
                      className="mt-3 text-xs font-semibold text-[var(--lagoon-deep)]"
                      onClick={() => {
                        setName(template.name)
                        setType(template.type)
                        setBody(template.body)
                      }}
                    >
                      Editar no editor
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <SectionHeader title="Fila de envio" count={data.queue.length} />
            {data.queue.length === 0 ? (
              <EmptyState
                icon={Send}
                title="Fila vazia"
                description="Mensagens agendadas aparecerão aqui."
              />
            ) : (
              <ul className="space-y-2">
                {data.queue.map((item) => {
                  const status = STATUS_META[item.status] ?? {
                    label: item.status,
                    className: 'bg-gray-100 text-gray-700',
                  }
                  const whatsappUrl = item.phone
                    ? buildWhatsAppUrl(item.phone, item.message)
                    : null

                  return (
                    <li
                      key={item.id}
                      className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${status.className}`}
                            >
                              {status.label}
                            </span>
                            {item.phone && (
                              <span className="text-xs text-[var(--sea-ink-soft)]">
                                {item.phone}
                              </span>
                            )}
                          </div>
                          <p className="text-sm leading-relaxed text-[var(--sea-ink)]">
                            {item.message}
                          </p>
                          <p className="mt-2 flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
                            <Clock size={12} />
                            {new Date(item.scheduledAt).toLocaleString('pt-BR')}
                          </p>
                        </div>

                        {whatsappUrl && (
                          <a
                            className="btn-primary shrink-0 no-underline"
                            href={whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle size={15} />
                            Enviar WhatsApp
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3">
        <p className="text-xs leading-relaxed text-[var(--sea-ink-soft)]">
          O envio usa deep links do WhatsApp (wa.me). Variáveis como{' '}
          <code className="text-[var(--lagoon-deep)]">{`{cliente}`}</code> são
          substituídas automaticamente ao gerar mensagens a partir da agenda.
        </p>
      </div>
    </section>
  )
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs">
      <span className="text-[var(--sea-ink-soft)]">{label}: </span>
      <span className="font-bold text-[var(--sea-ink)]">{value}</span>
    </div>
  )
}

function Panel({
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

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-sm font-bold text-[var(--sea-ink)]">{title}</h2>
      <span className="text-xs text-[var(--sea-ink-soft)]">
        {count} registro(s)
      </span>
    </div>
  )
}

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Send
  title: string
  description: string
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-8 text-center">
      <Icon size={24} className="mx-auto mb-2 text-[var(--sea-ink-soft)]" />
      <p className="text-sm font-medium text-[var(--sea-ink)]">{title}</p>
      <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">{description}</p>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block text-xs font-semibold text-[var(--sea-ink-soft)]">
      {label}
      <div className="mt-1.5 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-[var(--lagoon-deep)] [&_input]:focus:ring-2 [&_input]:focus:ring-[var(--accent-soft)] [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-[var(--line)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:outline-none [&_select]:focus:border-[var(--lagoon-deep)] [&_select]:focus:ring-2 [&_select]:focus:ring-[var(--accent-soft)] [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-[var(--line)] [&_textarea]:bg-[var(--surface)] [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:outline-none [&_textarea]:focus:border-[var(--lagoon-deep)] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[var(--accent-soft)]">
        {children}
      </div>
    </label>
  )
}
