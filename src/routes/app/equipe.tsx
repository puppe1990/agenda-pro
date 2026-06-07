import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  CalendarClock,
  Clock,
  Percent,
  Search,
  UserCheck,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  listAvailabilityFn,
  listStaffFn,
  saveAvailabilityFn,
  saveStaffFn,
} from '#/server/fns/app'

const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

export const Route = createFileRoute('/app/equipe')({
  loader: async () => {
    const [staff, availability] = await Promise.all([
      listStaffFn(),
      listAvailabilityFn(),
    ])
    return { staff, availability }
  },
  component: EquipePage,
})

function EquipePage() {
  const data = Route.useLoaderData()
  const { staff, availability } = data
  const saveStaff = useServerFn(saveStaffFn)
  const saveAvailability = useServerFn(saveAvailabilityFn)
  const [q, setQ] = useState('')

  const staffById = useMemo(
    () => new Map(staff.map((member) => [member.id, member])),
    [staff],
  )

  const filteredStaff = useMemo(() => {
    const query = q.trim().toLowerCase()
    return staff
      .filter(
        (member) => !query || member.displayName.toLowerCase().includes(query),
      )
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
  }, [staff, q])

  const activeCount = staff.filter((member) => member.active).length
  const avgCommission =
    staff.length > 0
      ? Math.round(
          staff.reduce((sum, m) => sum + m.commissionPercent, 0) / staff.length,
        )
      : 0

  const availabilityByStaff = useMemo(() => {
    const map = new Map<string, typeof availability>()
    for (const rule of availability) {
      const current = map.get(rule.staffProfileId) ?? []
      current.push(rule)
      map.set(rule.staffProfileId, current)
    }
    return map
  }, [availability])

  return (
    <section className="island-shell rounded-2xl p-5 sm:p-6">
      <PageHeader
        title="Equipe"
        description="Profissionais, comissões e disponibilidade."
      />

      <div className="mb-5 flex flex-wrap gap-2">
        <StatChip label="Profissionais" value={String(staff.length)} />
        <StatChip label="Ativos" value={String(activeCount)} />
        <StatChip label="Comissão média" value={`${avgCommission}%`} />
        <StatChip label="Horários" value={String(availability.length)} />
      </div>

      <div className="mb-6 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-3 sm:p-4">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--sea-ink-soft)]"
          />
          <input
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            placeholder="Buscar profissional por nome"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--sea-ink)]">
              Profissionais
            </h2>
            <span className="text-xs text-[var(--sea-ink-soft)]">
              {filteredStaff.length} registro(s)
            </span>
          </div>

          {filteredStaff.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-10 text-center">
              <Users
                size={28}
                className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
              />
              <p className="text-sm font-medium text-[var(--sea-ink)]">
                {q.trim()
                  ? 'Nenhum profissional encontrado'
                  : 'Nenhum profissional cadastrado'}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredStaff.map((member) => {
                const rules = availabilityByStaff.get(member.id) ?? []

                return (
                  <li
                    key={member.id}
                    className="rounded-xl border border-[var(--line)] bg-[var(--surface)] p-4 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 flex-1 gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)] text-sm font-bold text-[var(--lagoon-deep)]">
                          {initials(member.displayName)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[var(--sea-ink)]">
                              {member.displayName}
                            </p>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${
                                member.active
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {member.active ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>

                          <div className="mb-3 flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
                            <Percent size={14} />
                            Comissão:{' '}
                            <span className="font-bold text-[var(--lagoon-deep)]">
                              {member.commissionPercent}%
                            </span>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-[var(--chip-bg)]">
                            <div
                              className="h-full rounded-full bg-[var(--lagoon-deep)]"
                              style={{
                                width: `${Math.min(100, member.commissionPercent)}%`,
                              }}
                            />
                          </div>

                          {rules.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {rules.slice(0, 3).map((rule) => (
                                <span
                                  key={rule.id}
                                  className="rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-2 py-0.5 text-[0.65rem] font-semibold text-[var(--sea-ink-soft)]"
                                >
                                  {WEEKDAYS[rule.dayOfWeek]?.slice(0, 3)}{' '}
                                  {rule.startTime}-{rule.endTime}
                                </span>
                              ))}
                              {rules.length > 3 && (
                                <span className="text-[0.65rem] text-[var(--sea-ink-soft)]">
                                  +{rules.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <ActionButton
                          onClick={async () => {
                            await saveStaff({
                              data: {
                                id: member.id,
                                displayName: member.displayName,
                                commissionPercent: Math.min(
                                  100,
                                  member.commissionPercent + 5,
                                ),
                                active: member.active,
                              },
                            })
                            window.location.reload()
                          }}
                        >
                          +5% comissão
                        </ActionButton>
                        <ActionButton
                          onClick={async () => {
                            await saveAvailability({
                              data: {
                                staffProfileId: member.id,
                                dayOfWeek: 1,
                                startTime: '09:00',
                                endTime: '18:00',
                              },
                            })
                            window.location.reload()
                          }}
                        >
                          Seg 9h-18h
                        </ActionButton>
                        <ActionButton
                          variant={member.active ? 'danger' : 'default'}
                          onClick={async () => {
                            await saveStaff({
                              data: {
                                id: member.id,
                                displayName: member.displayName,
                                commissionPercent: member.commissionPercent,
                                active: !member.active,
                              },
                            })
                            window.location.reload()
                          }}
                        >
                          {member.active ? 'Desativar' : 'Ativar'}
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
          <Panel
            title="Regras de disponibilidade"
            subtitle={`${availability.length} horário(s) cadastrado(s)`}
          >
            {availability.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--surface)] px-4 py-8 text-center">
                <CalendarClock
                  size={24}
                  className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
                />
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Nenhuma regra de horário ainda.
                </p>
                <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                  Use &quot;Seg 9h-18h&quot; em um profissional para começar.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {availability
                  .slice()
                  .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
                  .map((rule) => {
                    const member = staffById.get(rule.staffProfileId)

                    return (
                      <li
                        key={rule.id}
                        className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm"
                      >
                        <p className="font-semibold text-[var(--sea-ink)]">
                          {member?.displayName ?? 'Profissional'}
                        </p>
                        <p className="mt-1 flex items-center gap-1.5 text-[var(--sea-ink-soft)]">
                          <Clock size={13} />
                          {WEEKDAYS[rule.dayOfWeek]} · {rule.startTime}–
                          {rule.endTime}
                        </p>
                      </li>
                    )
                  })}
              </ul>
            )}
          </Panel>

          <div className="mt-4 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-start gap-2">
              <UserCheck
                size={16}
                className="mt-0.5 shrink-0 text-[var(--lagoon-deep)]"
              />
              <p className="text-xs leading-relaxed text-[var(--sea-ink-soft)]">
                Comissões são aplicadas automaticamente em receitas vinculadas
                ao profissional. Horários de disponibilidade alimentam a agenda
                pública e o agendamento interno.
              </p>
            </div>
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
      className={`rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--chip-bg)] ${
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
