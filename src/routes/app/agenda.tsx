import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  createAppointmentFn,
  listAppointmentsFn,
  listClientsFn,
  listServicesFn,
  listStaffFn,
  markNoShowFn,
  rescheduleAppointmentFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/app/agenda')({
  loader: async () => {
    const [appointments, clients, services, staff] = await Promise.all([
      listAppointmentsFn(),
      listClientsFn({ data: {} }),
      listServicesFn(),
      listStaffFn(),
    ])
    return { appointments, clients, services, staff }
  },
  component: AgendaPage,
})

function AgendaPage() {
  const data = Route.useLoaderData()
  const createAppointment = useServerFn(createAppointmentFn)
  const reschedule = useServerFn(rescheduleAppointmentFn)
  const markNoShow = useServerFn(markNoShowFn)
  const [form, setForm] = useState({
    clientId: '',
    serviceId: '',
    staffProfileId: '',
    date: '',
    time: '',
  })

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    const service = data.services.find((s) => s.id === form.serviceId)
    if (!service) return
    const startsAt = new Date(`${form.date}T${form.time}:00`).toISOString()
    const endsAt = new Date(
      new Date(startsAt).getTime() + service.durationMinutes * 60_000,
    ).toISOString()
    await createAppointment({
      data: {
        clientId: form.clientId,
        serviceId: form.serviceId,
        staffProfileId: form.staffProfileId,
        startsAt,
        endsAt,
      },
    })
    window.location.reload()
  }

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Agenda"
        description="Crie, reagende e registre faltas."
      />
      <form onSubmit={handleCreate} className="mb-6 grid gap-3 md:grid-cols-2">
        <select
          className="rounded-xl border px-3 py-2"
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          required
        >
          <option value="">Cliente</option>
          {data.clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border px-3 py-2"
          value={form.serviceId}
          onChange={(e) => setForm({ ...form, serviceId: e.target.value })}
          required
        >
          <option value="">Serviço</option>
          {data.services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-xl border px-3 py-2"
          value={form.staffProfileId}
          onChange={(e) => setForm({ ...form, staffProfileId: e.target.value })}
          required
        >
          <option value="">Profissional</option>
          {data.staff.map((s) => (
            <option key={s.id} value={s.id}>
              {s.displayName}
            </option>
          ))}
        </select>
        <input
          type="date"
          className="rounded-xl border px-3 py-2"
          value={form.date}
          onChange={(e) => setForm({ ...form, date: e.target.value })}
          required
        />
        <input
          type="time"
          className="rounded-xl border px-3 py-2"
          value={form.time}
          onChange={(e) => setForm({ ...form, time: e.target.value })}
          required
        />
        <button
          type="submit"
          className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 font-semibold text-white"
        >
          Agendar
        </button>
      </form>
      <ul className="space-y-3">
        {data.appointments.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/50 px-3 py-2 text-sm"
          >
            <span>
              {new Date(item.startsAt).toLocaleString('pt-BR')} — {item.status}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                className="rounded-lg border px-2 py-1"
                onClick={async () => {
                  const next = new Date(item.startsAt)
                  next.setHours(next.getHours() + 1)
                  await reschedule({
                    data: {
                      appointmentId: item.id,
                      startsAt: next.toISOString(),
                      endsAt: new Date(
                        next.getTime() + 30 * 60_000,
                      ).toISOString(),
                    },
                  })
                  window.location.reload()
                }}
              >
                +1h
              </button>
              <button
                type="button"
                className="rounded-lg border px-2 py-1 text-red-700"
                onClick={async () => {
                  await markNoShow({ data: { appointmentId: item.id } })
                  window.location.reload()
                }}
              >
                Falta
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
