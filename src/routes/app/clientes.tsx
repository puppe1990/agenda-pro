import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  Mail,
  MessageSquarePlus,
  Phone,
  Search,
  UserPlus,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { addClientNoteFn, listClientsFn, saveClientFn } from '#/server/fns/app'

export const Route = createFileRoute('/app/clientes')({
  loader: async () => listClientsFn({ data: {} }),
  component: ClientesPage,
})

function ClientesPage() {
  const clients = Route.useLoaderData()
  const saveClient = useServerFn(saveClientFn)
  const addNote = useServerFn(addClientNoteFn)
  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    notes: '',
  })

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return clients
      .filter(
        (client) =>
          !query ||
          client.name.toLowerCase().includes(query) ||
          (client.phone ?? '').includes(q.trim()),
      )
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  }, [clients, q])

  const withPhone = clients.filter((client) => client.phone).length
  const withEmail = clients.filter((client) => client.email).length

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader title="Clientes" description="CRM básico com busca rápida." />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Total" value={String(clients.length)} />
        <StatChip label="Com telefone" value={String(withPhone)} />
        <StatChip label="Com e-mail" value={String(withEmail)} />
        {q.trim() && (
          <StatChip label="Resultados" value={String(filtered.length)} />
        )}
      </div>

      <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 sm:p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
          />
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            placeholder="Buscar por nome ou telefone"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--sea-ink)]">
              Lista de clientes
            </h2>
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {filtered.length} registro(s)
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-10 text-center">
              <Users
                size={28}
                className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
              />
              <p className="text-sm font-medium text-[var(--sea-ink)]">
                {q.trim()
                  ? 'Nenhum cliente encontrado'
                  : 'Nenhum cliente cadastrado'}
              </p>
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                {q.trim()
                  ? 'Tente outro termo de busca.'
                  : 'Cadastre o primeiro cliente ao lado.'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filtered.map((client) => (
                <li
                  key={client.id}
                  className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-1 gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--lagoon-deep)]">
                        {initials(client.name)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-[var(--sea-ink)]">
                          {client.name}
                        </p>
                        <div className="mt-1 space-y-0.5 text-sm text-[var(--sea-ink-soft)]">
                          {client.phone && (
                            <p className="flex items-center gap-1.5">
                              <Phone size={13} />
                              {client.phone}
                            </p>
                          )}
                          {client.email && (
                            <p className="flex items-center gap-1.5 truncate">
                              <Mail size={13} />
                              {client.email}
                            </p>
                          )}
                        </div>
                        {client.notes && (
                          <p className="mt-2 rounded-lg bg-[var(--chip-bg)] px-2.5 py-1.5 text-xs text-[var(--sea-ink-soft)]">
                            {client.notes}
                          </p>
                        )}
                        {client.visitCount > 0 && (
                          <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-wide text-[var(--lagoon-deep)]">
                            {client.visitCount} visita(s)
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--line)] px-2.5 py-1.5 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                      onClick={async () => {
                        const content = window.prompt('Nova observação:')
                        if (!content) return
                        await addNote({
                          data: { clientId: client.id, content },
                        })
                      }}
                    >
                      <MessageSquarePlus size={13} />
                      Adicionar nota
                    </button>
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
                <UserPlus size={16} />
              </span>
              <div>
                <h2 className="text-sm font-bold text-[var(--sea-ink)]">
                  Novo cliente
                </h2>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  Cadastre nome e contato
                </p>
              </div>
            </div>

            <form
              className="grid gap-3"
              onSubmit={async (e) => {
                e.preventDefault()
                await saveClient({ data: form })
                window.location.reload()
              }}
            >
              <Field label="Nome">
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </Field>
              <Field label="Telefone">
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </Field>
              <Field label="E-mail">
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field label="Observações">
                <textarea
                  className="min-h-[4.5rem] resize-y"
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Field>
              <button type="submit" className="btn-primary mt-1 w-full">
                Salvar cliente
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  )
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
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
