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
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  Search,
  User,
} from 'lucide-react'
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

const STATUS_META: Record<string, { label: string; className: string }> = {
  scheduled: {
    label: 'Agendado',
    className: 'bg-slate-100 text-slate-700',
  },
  confirmed: {
    label: 'Confirmado',
    className: 'bg-sky-100 text-sky-800',
  },
  completed: {
    label: 'Concluído',
    className: 'bg-emerald-100 text-emerald-800',
  },
  cancelled: {
    label: 'Cancelado',
    className: 'bg-gray-100 text-gray-600',
  },
  no_show: {
    label: 'Falta',
    className: 'bg-red-100 text-red-700',
  },
}

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
  const serviceById = useMemo(
    () => new Map(data.services.map((service) => [service.id, service])),
    [data.services],
  )
  const staffById = useMemo(
    () => new Map(data.staff.map((member) => [member.id, member])),
    [data.staff],
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

    return data.appointments
      .filter((item) => {
        const startsAt = parseISO(item.startsAt)
        const inRange = isWithinInterval(startsAt, range)
        if (!inRange) return false
        if (!search.trim()) return true
        const client = clientById.get(item.clientId)
        const haystack =
          `${client?.name ?? ''} ${client?.phone ?? ''}`.toLowerCase()
        return haystack.includes(search.trim().toLowerCase())
      })
      .sort(
        (a, b) =>
          parseISO(a.startsAt).getTime() - parseISO(b.startsAt).getTime(),
      )
  }, [anchorDate, clientById, data.appointments, search, viewMode])

  const weekDays = useMemo(() => {
    const anchor = parseISO(`${anchorDate}T12:00:00`)
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    return Array.from({ length: 7 }, (_, index) => addDays(start, index))
  }, [anchorDate])

  const periodLabel = useMemo(() => {
    const anchor = parseISO(`${anchorDate}T12:00:00`)
    if (viewMode === 'day') {
      return anchor.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    }
    const start = startOfWeek(anchor, { weekStartsOn: 1 })
    const end = endOfWeek(anchor, { weekStartsOn: 1 })
    return `${format(start, 'dd/MM')} – ${format(end, 'dd/MM/yyyy')}`
  }, [anchorDate, viewMode])

  function shiftAnchor(days: number) {
    const next = addDays(parseISO(`${anchorDate}T12:00:00`), days)
    setAnchorDate(format(next, 'yyyy-MM-dd'))
  }

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
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Agenda"
        description="Busca rápida e visão por dia ou semana."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip
          label="No período"
          value={String(visibleAppointments.length)}
        />
        <StatChip label="Clientes" value={String(data.clients.length)} />
        <StatChip label="Serviços" value={String(data.services.length)} />
      </div>

      <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[220px] flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
            />
            <input
              className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2 pl-9 pr-3 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
              placeholder="Buscar por cliente ou telefone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1">
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)]"
              aria-label="Dia anterior"
              onClick={() => shiftAnchor(viewMode === 'day' ? -1 : -7)}
            >
              <ChevronLeft size={16} />
            </button>
            <input
              type="date"
              className="border-0 bg-transparent px-1 py-1.5 text-sm outline-none"
              value={anchorDate}
              onChange={(e) => setAnchorDate(e.target.value)}
            />
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--sea-ink-soft)] hover:bg-[var(--chip-bg)]"
              aria-label="Próximo dia"
              onClick={() => shiftAnchor(viewMode === 'day' ? 1 : 7)}
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div
            className="flex rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1"
            role="group"
            aria-label="Modo de visualização"
          >
            <ViewToggle
              active={viewMode === 'day'}
              onClick={() => setViewMode('day')}
            >
              Dia
            </ViewToggle>
            <ViewToggle
              active={viewMode === 'week'}
              onClick={() => setViewMode('week')}
            >
              Semana
            </ViewToggle>
          </div>
        </div>

        <p className="mt-3 flex items-center gap-1.5 text-xs font-medium capitalize text-[var(--sea-ink-soft)]">
          <CalendarDays size={14} />
          {periodLabel}
        </p>
      </div>

      {viewMode === 'week' && (
        <div className="mb-6 grid gap-2 sm:grid-cols-3 lg:grid-cols-7">
          {weekDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd')
            const dayItems = visibleAppointments.filter(
              (item) =>
                format(parseISO(item.startsAt), 'yyyy-MM-dd') === dayKey,
            )
            const isToday = dayKey === format(new Date(), 'yyyy-MM-dd')
            const isSelected = dayKey === anchorDate

            return (
              <div
                key={dayKey}
                className={`min-h-[140px] rounded-xl border p-2.5 ${
                  isSelected
                    ? 'border-[var(--lagoon-deep)] bg-[var(--accent-soft)]'
                    : 'border-[var(--line)] bg-[var(--surface)]'
                }`}
              >
                <button
                  type="button"
                  className="mb-2 w-full text-left"
                  onClick={() => setAnchorDate(dayKey)}
                >
                  <p
                    className={`text-xs font-bold uppercase ${
                      isToday
                        ? 'text-[var(--lagoon-deep)]'
                        : 'text-[var(--sea-ink-soft)]'
                    }`}
                  >
                    {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                  </p>
                  <p className="text-lg font-bold text-[var(--sea-ink)]">
                    {format(day, 'dd')}
                  </p>
                </button>
                <ul className="space-y-1.5">
                  {dayItems.length === 0 ? (
                    <li className="text-[0.65rem] text-[var(--sea-ink-soft)]">
                      Livre
                    </li>
                  ) : (
                    dayItems.map((item) => (
                      <li
                        key={item.id}
                        className="rounded-md border border-[var(--line)] bg-[var(--chip-bg)] px-1.5 py-1 text-[0.65rem] leading-tight"
                      >
                        <span className="font-semibold text-[var(--sea-ink)]">
                          {format(parseISO(item.startsAt), 'HH:mm')}
                        </span>
                        <span className="block truncate text-[var(--sea-ink-soft)]">
                          {clientById.get(item.clientId)?.name ?? 'Cliente'}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--sea-ink)]">
              {viewMode === 'day' ? 'Agendamentos do dia' : 'Lista do período'}
            </h2>
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {visibleAppointments.length} registro(s)
            </span>
          </div>

          {visibleAppointments.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-10 text-center">
              <CalendarDays
                size={28}
                className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
              />
              <p className="text-sm font-medium text-[var(--sea-ink)]">
                Nenhum agendamento neste período
              </p>
              <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                Crie um novo agendamento ao lado ou ajuste a data.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {visibleAppointments.map((item) => {
                const client = clientById.get(item.clientId)
                const service = serviceById.get(item.serviceId)
                const staff = staffById.get(item.staffProfileId)
                const status = STATUS_META[item.status] ?? {
                  label: item.status,
                  className: 'bg-gray-100 text-gray-700',
                }

                return (
                  <li
                    key={item.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-[var(--chip-bg)] px-2 py-1 text-xs font-bold text-[var(--sea-ink)]">
                            <Clock size={12} />
                            {format(
                              parseISO(item.startsAt),
                              'dd/MM/yyyy HH:mm',
                            )}
                          </span>
                          <span
                            className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${status.className}`}
                          >
                            {status.label}
                          </span>
                          <span className="text-[0.65rem] text-[var(--sea-ink-soft)]">
                            {item.status}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 font-semibold text-[var(--sea-ink)]">
                          <User
                            size={14}
                            className="text-[var(--lagoon-deep)]"
                          />
                          {client?.name ?? 'Cliente'}
                          {client?.phone && (
                            <span className="font-normal text-[var(--sea-ink-soft)]">
                              · {client.phone}
                            </span>
                          )}
                        </p>
                        <p className="mt-1 text-sm text-[var(--sea-ink-soft)]">
                          {service?.name ?? 'Serviço'} ·{' '}
                          {staff?.displayName ?? 'Profissional'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton
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
                        </ActionButton>
                        <ActionButton
                          variant="danger"
                          onClick={async () => {
                            await markNoShow({
                              data: { appointmentId: item.id },
                            })
                            window.location.reload()
                          }}
                        >
                          Falta
                        </ActionButton>
                        <ActionButton
                          onClick={async () => {
                            await cancelAppointment({
                              data: { appointmentId: item.id },
                            })
                            window.location.reload()
                          }}
                        >
                          Cancelar
                        </ActionButton>
                      </div>
                    </div>
                  </li>
                )
              })}
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
                  Novo agendamento
                </h2>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  Preencha os campos abaixo
                </p>
              </div>
            </div>

            <form
              onSubmit={(event) => event.preventDefault()}
              className="grid gap-3"
            >
              <Field label="Cliente">
                <select
                  value={form.clientId}
                  onChange={(e) =>
                    setForm({ ...form, clientId: e.target.value })
                  }
                  required
                >
                  <option value="">Cliente</option>
                  {data.clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Serviço">
                <select
                  value={form.serviceId}
                  onChange={(e) =>
                    setForm({ ...form, serviceId: e.target.value })
                  }
                  required
                >
                  <option value="">Serviço</option>
                  {data.services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Profissional">
                <select
                  value={form.staffProfileId}
                  onChange={(e) =>
                    setForm({ ...form, staffProfileId: e.target.value })
                  }
                  required
                >
                  <option value="">Profissional</option>
                  {data.staff.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.displayName}
                    </option>
                  ))}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Data">
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    required
                  />
                </Field>
                <Field label="Horário">
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e) => setForm({ ...form, time: e.target.value })}
                    required
                  />
                </Field>
              </div>
              <button
                type="button"
                className="btn-primary mt-1 w-full"
                onClick={() => void handleCreate()}
              >
                Agendar
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

function ViewToggle({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold transition ${
        active
          ? 'bg-[var(--lagoon-deep)] text-white'
          : 'text-[var(--sea-ink-soft)] hover:text-[var(--sea-ink)]'
      }`}
      onClick={onClick}
    >
      {children}
    </button>
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
      <div className="mt-1.5 [&_input]:w-full [&_input]:rounded-xl [&_input]:border [&_input]:border-[var(--line)] [&_input]:bg-[var(--surface)] [&_input]:px-3 [&_input]:py-2 [&_input]:text-sm [&_input]:outline-none [&_input]:focus:border-[var(--lagoon-deep)] [&_input]:focus:ring-2 [&_input]:focus:ring-[var(--accent-soft)] [&_select]:w-full [&_select]:rounded-xl [&_select]:border [&_select]:border-[var(--line)] [&_select]:bg-[var(--surface)] [&_select]:px-3 [&_select]:py-2 [&_select]:text-sm [&_select]:outline-none [&_select]:focus:border-[var(--lagoon-deep)] [&_select]:focus:ring-2 [&_select]:focus:ring-[var(--accent-soft)]">
        {children}
      </div>
    </label>
  )
}

function ActionButton({
  children,
  onClick,
  variant = 'default',
}: {
  children: React.ReactNode
  onClick: () => void | Promise<void>
  variant?: 'default' | 'danger'
}) {
  return (
    <button
      type="button"
      className={`rounded-lg border px-2.5 py-1 text-xs font-semibold transition hover:bg-[var(--chip-bg)] ${
        variant === 'danger'
          ? 'border-red-200 text-red-700 hover:bg-red-50'
          : 'border-[var(--line)] text-[var(--sea-ink-soft)]'
      }`}
      onClick={() => void onClick()}
    >
      {children}
    </button>
  )
}
