import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { ClipboardList, Clock, Plus, Search, Tag } from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { formatCents } from '#/lib/money'
import { listServicesFn, saveServiceFn } from '#/server/fns/app'

export const Route = createFileRoute('/app/servicos')({
  loader: async () => listServicesFn(),
  component: ServicosPage,
})

function ServicosPage() {
  const services = Route.useLoaderData()
  const saveService = useServerFn(saveServiceFn)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    name: '',
    durationMinutes: 30,
    priceCents: 5000,
    description: '',
  })

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return services
      .filter(
        (service) =>
          !query ||
          service.name.toLowerCase().includes(query) ||
          (service.description ?? '').toLowerCase().includes(query),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [q, services])

  const activeCount = services.filter((service) => service.active).length
  const avgDuration =
    services.length > 0
      ? Math.round(
          services.reduce((sum, s) => sum + s.durationMinutes, 0) /
            services.length,
        )
      : 0
  const avgPriceCents =
    services.length > 0
      ? Math.round(
          services.reduce((sum, s) => sum + s.priceCents, 0) / services.length,
        )
      : 0

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Serviços"
        description="Catálogo com duração e preço."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Total" value={String(services.length)} />
        <StatChip label="Ativos" value={String(activeCount)} />
        <StatChip label="Duração média" value={`${avgDuration} min`} />
        <StatChip label="Ticket médio" value={formatCents(avgPriceCents)} />
      </div>

      <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 sm:p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
          />
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            placeholder="Buscar serviço por nome ou descrição"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--sea-ink)]">
              Catálogo
            </h2>
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {filtered.length} serviço(s)
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-10 text-center">
              <ClipboardList
                size={28}
                className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
              />
              <p className="text-sm font-medium text-[var(--sea-ink)]">
                {q.trim()
                  ? 'Nenhum serviço encontrado'
                  : 'Nenhum serviço cadastrado'}
              </p>
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                {q.trim()
                  ? 'Tente outro termo de busca.'
                  : 'Adicione o primeiro serviço ao lado.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((service) => (
                <li
                  key={service.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[var(--sea-ink)]">
                          {service.name}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${
                            service.active
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {service.active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-3 text-sm text-[var(--sea-ink-soft)]">
                        <span className="inline-flex items-center gap-1.5">
                          <Clock size={14} />
                          {service.durationMinutes} min
                        </span>
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--lagoon-deep)]">
                          <Tag size={14} />
                          {formatCents(service.priceCents)}
                        </span>
                      </div>

                      {service.description && (
                        <p className="mt-2 text-sm text-[var(--sea-ink-soft)]">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="xl:col-span-2">
          <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4 sm:p-5">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--lagoon-deep)] text-white">
                <Plus size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[var(--sea-ink)]">
                  Novo serviço
                </h2>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  Defina nome, tempo e valor
                </p>
              </div>
            </div>

            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                await saveService({ data: { ...form, active: true } })
                window.location.reload()
              }}
            >
              <Field label="Nome">
                <input
                  placeholder="Nome do serviço"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Duração (min)">
                  <input
                    type="number"
                    min={5}
                    step={5}
                    value={form.durationMinutes}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        durationMinutes: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field label="Preço (centavos)">
                  <input
                    type="number"
                    min={0}
                    step={100}
                    value={form.priceCents}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        priceCents: Number(e.target.value),
                      })
                    }
                  />
                </Field>
              </div>

              <p className="text-xs text-[var(--sea-ink-soft)]">
                Valor informado:{' '}
                <span className="font-semibold text-[var(--lagoon-deep)]">
                  {formatCents(form.priceCents)}
                </span>
              </p>

              <Field label="Descrição">
                <textarea
                  className="min-h-[4.5rem] resize-y"
                  placeholder="Opcional — o que inclui este serviço"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                />
              </Field>

              <button type="submit" className="btn-primary mt-1 w-full">
                Adicionar serviço
              </button>
            </form>
          </div>
        </div>
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
      <div className="mt-1.5 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-[var(--lagoon-deep)] [&_input]:focus:ring-2 [&_input]:focus:ring-[var(--accent-soft)] [&_textarea]:w-full [&_textarea]:rounded-xl [&_textarea]:border [&_textarea]:border-[var(--line)] [&_textarea]:bg-[var(--surface)] [&_textarea]:px-3 [&_textarea]:py-2 [&_textarea]:text-sm [&_textarea]:outline-none [&_textarea]:focus:border-[var(--lagoon-deep)] [&_textarea]:focus:ring-2 [&_textarea]:focus:ring-[var(--accent-soft)]">
        {children}
      </div>
    </label>
  )
}
