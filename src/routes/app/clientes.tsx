import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

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

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q.toLowerCase()) ||
      (c.phone ?? '').includes(q),
  )

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader title="Clientes" description="CRM básico com busca rápida." />
      <input
        className="mb-4 w-full rounded-xl border px-3 py-2"
        placeholder="Buscar por nome ou telefone"
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <form
        className="mb-6 grid gap-3 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await saveClient({ data: form })
          window.location.reload()
        }}
      >
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="Nome"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="Telefone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
        />
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="E-mail"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="Observações"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 font-semibold text-white"
        >
          Salvar cliente
        </button>
      </form>
      <ul className="space-y-3">
        {filtered.map((client) => (
          <li
            key={client.id}
            className="rounded-xl border bg-white/50 p-3 text-sm"
          >
            <p className="font-semibold">{client.name}</p>
            <p className="text-[var(--sea-ink-soft)]">
              {client.phone} {client.email ? `• ${client.email}` : ''}
            </p>
            {client.notes && <p className="mt-1">{client.notes}</p>}
            <button
              type="button"
              className="mt-2 rounded-lg border px-2 py-1"
              onClick={async () => {
                const content = window.prompt('Nova observação:')
                if (!content) return
                await addNote({ data: { clientId: client.id, content } })
              }}
            >
              Adicionar nota
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
