import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  addDays,
  endOfWeek,
  format,
  isWithinInterval,
  parseISO,
  startOfDay,
  startOfWeek,
} from 'date-fns'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  cancelAppointmentFn,
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
  const cancelAppointment = useServerFn(cancelAppointmentFn)
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day')
  const [anchorDate, setAnchorDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [search, setSearch] = useState('')
  const [form, setForm] = useState({
    clientId: '',
    serviceId: '',
    staffProfileId: '',
    date: '',
    time: '',
  })

  const clientById = useMemo(
    () => new Map(data.clients.map((client) => [client.id, client])),
    [data.clients],
  )

  const visibleAppointments = useMemo(() => {
    const anchor = parseISO(`${anchorDate}T12:00:00`)
    const range =
      viewMode === 'day'
        ? { start: startOfDay(anchor), end: addDays(startOfDay(anchor), 1) }
        : {
            start: startOfWeek(anchor, { weekStartsOn: 1 }),
            end: addDays(endOfWeek(anchor, { weekStartsOn: 1 }), 1),
          }

    return data.appointments.filter((item) => {
      const startsAt = parseISO(item.startsAt)
      const inRange = isWithinInterval(startsAt, range)
      if (!inRange) return false
      if (!search.trim()) return true
      const client = clientById.get(item.clientId)
      const haystack =
        `${client?.name ?? ''} ${client?.phone ?? ''}`.toLowerCase()
      return haystack.includes(search.trim().toLowerCase())
    })
  }, [anchorDate, clientById, data.appointments, search, viewMode])

  const weekDays = useMemo(() => {
    const anchor = parseISO(`${anchorDate}T12:00:00`)
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [anchorDate])

  async function handleCreate() {
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
        description="Busca rápida e visão por dia ou semana."
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          className="min-w-[220px] flex-1 rounded-xl border px-3 py-2 text-sm"
          placeholder="Buscar por cliente ou telefone"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <input
          type="date"
          className="rounded-xl border px-3 py-2 text-sm"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
        />
        <button
          type="button"
          className={`rounded-xl border px-3 py-2 text-sm ${viewMode === 'day' ? 'bg-[var(--lagoon-deep)] text-white' : ''}`}
          onClick={() => setViewMode('day')}
        >
          Dia
        </button>
        <button
          type="button"
          className={`rounded-xl border px-3 py-2 text-sm ${viewMode === 'week' ? 'bg-[var(--lagoon-deep)] text-white' : ''}`}
          onClick={() => setViewMode('week')}
        >
          Semana
        </button>
      </div>

      {viewMode === 'week' && (
        <div className="mb-6 grid gap-2 md:grid-cols-7">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayItems = visibleAppointments.filter(
              (item) =>
                format(parseISO(item.startsAt), 'yyyy-MM-dd') === dayKey,
            )
            return (
              <div
                key={dayKey}
                className="rounded-xl border bg-white/40 p-2 text-xs"
              >
                <p className="mb-2 font-semibold">
                  {format(day, 'EEE dd/MM', { locale: undefined })}
                </p>
                <ul className="space-y-1">
                  {dayItems.length === 0 ? (
                    <li className="text-[var(--sea-ink-soft)]">—</li>
                  ) : (
                    dayItems.map((item) => (
                      <li key={item.id}>
                        {format(parseISO(item.startsAt), 'HH:mm')} —{' '}
                        {clientById.get(item.clientId)?.name ?? 'Cliente'}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <form
        onSubmit={(event) => event.preventDefault()}
        className="mb-6 grid gap-3 md:grid-cols-2"
      >
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
          type="button"
          className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 font-semibold text-white"
          onClick={() => void handleCreate()}
        >
          Agendar
        </button>
      </form>
      <ul className="space-y-3">
        {visibleAppointments.map((item) => (
          <li
            key={item.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border bg-white/50 px-3 py-2 text-sm"
          >
            <span>
              {format(parseISO(item.startsAt), 'dd/MM/yyyy HH:mm')} —{' '}
              {clientById.get(item.clientId)?.name ?? 'Cliente'} — {item.status}
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
              <button
                type="button"
                className="rounded-lg border px-2 py-1"
                onClick={async () => {
                  await cancelAppointment({
                    data: { appointmentId: item.id },
                  })
                  window.location.reload()
                }}
              >
                Cancelar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  )
}
