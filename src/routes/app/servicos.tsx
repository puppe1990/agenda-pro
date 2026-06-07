import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

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
  const [form, setForm] = useState({
    name: '',
    durationMinutes: 30,
    priceCents: 5000,
    description: '',
  })

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Serviços"
        description="Catálogo com duração e preço."
      />
      <form
        className="mb-6 grid gap-3 md:grid-cols-2"
        onSubmit={async (e) => {
          e.preventDefault()
          await saveService({ data: { ...form, active: true } })
          window.location.reload()
        }}
      >
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="Nome do serviço"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <input
          type="number"
          className="rounded-xl border px-3 py-2"
          placeholder="Duração (min)"
          value={form.durationMinutes}
          onChange={(e) =>
            setForm({ ...form, durationMinutes: Number(e.target.value) })
          }
        />
        <input
          type="number"
          className="rounded-xl border px-3 py-2"
          placeholder="Preço (centavos)"
          value={form.priceCents}
          onChange={(e) =>
            setForm({ ...form, priceCents: Number(e.target.value) })
          }
        />
        <input
          className="rounded-xl border px-3 py-2"
          placeholder="Descrição"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 font-semibold text-white"
        >
          Adicionar serviço
        </button>
      </form>
      <ul className="space-y-2">
        {services.map((service) => (
          <li
            key={service.id}
            className="rounded-xl border bg-white/50 p-3 text-sm"
          >
            <p className="font-semibold">{service.name}</p>
            <p className="text-[var(--sea-ink-soft)]">
              {service.durationMinutes} min • {formatCents(service.priceCents)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
