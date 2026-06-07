import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  ClipboardPlus,
  FileText,
  History,
  Search,
  Stethoscope,
  User,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  listAnamnesisFormsFn,
  listClientsFn,
  listRecentAnamnesisRecordsFn,
  saveAnamnesisFormFn,
  saveAnamnesisRecordFn,
} from '#/server/fns/app'

type FormField = {
  id: string
  label: string
  type: string
}

const DEFAULT_FIELDS: FormField[] = [
  { id: 'alergia', label: 'Possui alergias?', type: 'boolean' },
  { id: 'medicacao', label: 'Usa medicação contínua?', type: 'text' },
  { id: 'observacao', label: 'Observações', type: 'text' },
]

const DEFAULT_RESPONSES = {
  alergia: false,
  medicacao: 'Nenhuma',
  observacao: 'Primeira consulta',
}

export const Route = createFileRoute('/app/anamnese')({
  loader: async () => {
    const [forms, clients, records] = await Promise.all([
      listAnamnesisFormsFn(),
      listClientsFn({ data: {} }),
      listRecentAnamnesisRecordsFn(),
    ])
    return { forms, clients, records }
  },
  component: AnamnesePage,
})

function AnamnesePage() {
  const data = Route.useLoaderData()
  const saveForm = useServerFn(saveAnamnesisFormFn)
  const saveRecord = useServerFn(saveAnamnesisRecordFn)
  const [formName, setFormName] = useState('Ficha padrão')
  const [q, setQ] = useState('')
  const [selectedClients, setSelectedClients] = useState<
    Record<string, string>
  >({})

  const clientById = useMemo(
    () => new Map(data.clients.map((client) => [client.id, client])),
    [data.clients],
  )
  const formById = useMemo(
    () => new Map(data.forms.map((form) => [form.id, form])),
    [data.forms],
  )

  const filteredForms = useMemo(() => {
    const query = q.trim().toLowerCase()
    return data.forms
      .filter((form) => !query || form.name.toLowerCase().includes(query))
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [data.forms, q])

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Anamnese"
        description="Formulários e histórico por cliente."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Formulários" value={String(data.forms.length)} />
        <StatChip label="Clientes" value={String(data.clients.length)} />
        <StatChip label="Registros" value={String(data.records.length)} />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="mb-4 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 sm:p-4">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
              />
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Buscar formulário por nome"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--sea-ink)]">
              Formulários
            </h2>
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {filteredForms.length} registro(s)
            </span>
          </div>

          {filteredForms.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={
                q.trim()
                  ? 'Nenhum formulário encontrado'
                  : 'Nenhum formulário cadastrado'
              }
              description={
                q.trim()
                  ? 'Tente outro termo de busca.'
                  : 'Crie a ficha padrão ao lado.'
              }
            />
          ) : (
            <ul className="space-y-3">
              {filteredForms.map((form) => {
                const fields = parseFields(form.fieldsJson)
                const selectedClientId = selectedClients[form.id] ?? ''

                return (
                  <li
                    key={form.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                  >
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-[var(--sea-ink)]">
                          {form.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                          {fields.length} campo(s)
                        </p>
                      </div>
                      <span className="rounded-full bg-[var(--accent-soft)] px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide text-[var(--lagoon-deep)]">
                        Ficha clínica
                      </span>
                    </div>

                    <div className="mb-4 flex flex-wrap gap-1.5">
                      {fields.map((field) => (
                        <span
                          key={field.id}
                          className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--sea-ink-soft)]"
                        >
                          {field.label}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-end gap-2">
                      <label className="min-w-[180px] flex-1 text-xs font-semibold text-[var(--sea-ink-soft)]">
                        Cliente
                        <select
                          className="mt-1.5 w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                          value={selectedClientId}
                          onChange={(e) =>
                            setSelectedClients({
                              ...selectedClients,
                              [form.id]: e.target.value,
                            })
                          }
                        >
                          <option value="">Selecionar cliente</option>
                          {data.clients.map((client) => (
                            <option key={client.id} value={client.id}>
                              {client.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="btn-primary"
                        disabled={!selectedClientId}
                        onClick={async () => {
                          if (!selectedClientId) return
                          await saveRecord({
                            data: {
                              clientId: selectedClientId,
                              formId: form.id,
                              responsesJson: JSON.stringify(DEFAULT_RESPONSES),
                            },
                          })
                          window.location.reload()
                        }}
                      >
                        Registrar anamnese
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="xl:col-span-2">
          <Panel title="Novo formulário" subtitle="Modelo padrão para clínicas">
            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                await saveForm({
                  data: {
                    name: formName,
                    fieldsJson: JSON.stringify(DEFAULT_FIELDS),
                  },
                })
                window.location.reload()
              }}
            >
              <Field label="Nome do formulário">
                <input
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              </Field>

              <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-3">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                  Campos incluídos
                </p>
                <ul className="space-y-1.5 text-sm text-[var(--sea-ink-soft)]">
                  {DEFAULT_FIELDS.map((field) => (
                    <li key={field.id} className="flex items-center gap-2">
                      <Stethoscope
                        size={13}
                        className="text-[var(--lagoon-deep)]"
                      />
                      {field.label}
                    </li>
                  ))}
                </ul>
              </div>

              <button type="submit" className="btn-primary w-full">
                Criar formulário
              </button>
            </form>
          </Panel>
        </div>
      </div>

      <div className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-sm font-bold text-[var(--sea-ink)]">
            <History size={16} className="text-[var(--lagoon-deep)]" />
            Registros recentes
          </h2>
          <span className="text-xs text-[var(--sea-ink-soft)]">
            {data.records.length} registro(s)
          </span>
        </div>

        {data.records.length === 0 ? (
          <EmptyState
            icon={ClipboardPlus}
            title="Nenhum registro ainda"
            description="Selecione um cliente e registre a primeira anamnese."
          />
        ) : (
          <ul className="space-y-2">
            {data.records.map((record) => {
              const client = clientById.get(record.clientId)
              const form = formById.get(record.formId)
              const responses = parseResponses(record.responsesJson)

              return (
                <li
                  key={record.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="flex items-center gap-1.5 font-semibold text-[var(--sea-ink)]">
                        <User size={14} className="text-[var(--lagoon-deep)]" />
                        {client?.name ?? 'Cliente'}
                      </p>
                      <p className="mt-0.5 text-xs text-[var(--sea-ink-soft)]">
                        {form?.name ?? 'Formulário'} ·{' '}
                        {new Date(record.recordedAt).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(responses).map(([key, value]) => (
                      <span
                        key={key}
                        className="rounded-lg bg-[var(--chip-bg)] px-2 py-1 text-xs text-[var(--sea-ink-soft)]"
                      >
                        <span className="font-semibold text-[var(--sea-ink)]">
                          {key}:
                        </span>{' '}
                        {String(value)}
                      </span>
                    ))}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </section>
  )
}

function parseFields(fieldsJson: string): FormField[] {
  try {
    const parsed = JSON.parse(fieldsJson) as FormField[]
    return Array.isArray(parsed) ? parsed : DEFAULT_FIELDS
  } catch {
    return DEFAULT_FIELDS
  }
}

function parseResponses(responsesJson: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(responsesJson) as Record<string, unknown>
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
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

function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof FileText
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
      <div className="mt-1.5 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-[var(--lagoon-deep)] [&_input]:focus:ring-2 [&_input]:focus:ring-[var(--accent-soft)]">
        {children}
      </div>
    </label>
  )
}
