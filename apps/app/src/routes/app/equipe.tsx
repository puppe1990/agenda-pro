import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  CalendarClock,
  Clock,
  Percent,
  Plus,
  Search,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  createStaffFn,
  deleteAvailabilityFn,
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

type FormState = {
  days: Set<number>
  startTime: string
  endTime: string
}

type ModalTarget = {
  staffId: string
  displayName: string
}

function EquipePage() {
  const data = Route.useLoaderData()
  const { staff, availability } = data
  const createStaff = useServerFn(createStaffFn)
  const saveStaff = useServerFn(saveStaffFn)
  const saveAvailability = useServerFn(saveAvailabilityFn)
  const deleteAvailability = useServerFn(deleteAvailabilityFn)
  const [q, setQ] = useState('')
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [newStaffOpen, setNewStaffOpen] = useState(false)
  const [newStaffForm, setNewStaffForm] = useState({
    displayName: '',
    commissionPercent: 0,
  })
  const [form, setForm] = useState<FormState>({
    days: new Set([1]),
    startTime: '09:00',
    endTime: '18:00',
  })
  const dialogRef = useRef<HTMLDialogElement>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)
  const newStaffDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    if (modalTarget) {
      dialogRef.current?.showModal()
    } else {
      dialogRef.current?.close()
    }
  }, [modalTarget])

  useEffect(() => {
    if (deleteTarget) {
      confirmDialogRef.current?.showModal()
    } else {
      confirmDialogRef.current?.close()
    }
  }, [deleteTarget])

  useEffect(() => {
    if (newStaffOpen) {
      newStaffDialogRef.current?.showModal()
    } else {
      newStaffDialogRef.current?.close()
    }
  }, [newStaffOpen])

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

  function openModal(staffId: string, displayName: string) {
    setForm({ days: new Set([1]), startTime: '09:00', endTime: '18:00' })
    setModalTarget({ staffId, displayName })
  }

  function closeModal() {
    setModalTarget(null)
  }

  function toggleDay(day: number) {
    setForm((f) => {
      const next = new Set(f.days)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return { ...f, days: next }
    })
  }

  async function handleSaveAvailability() {
    if (!modalTarget || form.days.size === 0) return
    await Promise.all(
      [...form.days].map((day) =>
        saveAvailability({
          data: {
            staffProfileId: modalTarget.staffId,
            dayOfWeek: day,
            startTime: form.startTime,
            endTime: form.endTime,
          },
        }),
      ),
    )
    closeModal()
    window.location.reload()
  }

  async function handleCreateStaff() {
    if (!newStaffForm.displayName.trim()) return
    await createStaff({
      data: {
        displayName: newStaffForm.displayName.trim(),
        commissionPercent: newStaffForm.commissionPercent,
      },
    })
    setNewStaffOpen(false)
    setNewStaffForm({ displayName: '', commissionPercent: 0 })
    window.location.reload()
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    await deleteAvailability({ data: { id: deleteTarget } })
    setDeleteTarget(null)
    window.location.reload()
  }

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
            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--sea-ink-soft)]">
                {filteredStaff.length} registro(s)
              </span>
              <button
                type="button"
                onClick={() => {
                  setNewStaffForm({ displayName: '', commissionPercent: 0 })
                  setNewStaffOpen(true)
                }}
                className="flex items-center gap-1 rounded-lg border border-[var(--lagoon-deep)] bg-[var(--lagoon-deep)] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:opacity-90"
              >
                <Plus size={12} />
                Novo profissional
              </button>
            </div>
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
                          onClick={() =>
                            openModal(member.id, member.displayName)
                          }
                        >
                          <Plus size={12} className="inline" /> Horário
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
                  Clique em &quot;+ Horário&quot; em um profissional para
                  começar.
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
                        className="flex items-start justify-between gap-2 rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-sm"
                      >
                        <div>
                          <p className="font-semibold text-[var(--sea-ink)]">
                            {member?.displayName ?? 'Profissional'}
                          </p>
                          <p className="mt-1 flex items-center gap-1.5 text-[var(--sea-ink-soft)]">
                            <Clock size={13} />
                            {WEEKDAYS[rule.dayOfWeek]} · {rule.startTime}–
                            {rule.endTime}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="mt-0.5 shrink-0 rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Remover horário"
                          onClick={() => setDeleteTarget(rule.id)}
                        >
                          <Trash2 size={14} />
                        </button>
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

      {/* Modal de cadastro de horário */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClose={closeModal}
      >
        {modalTarget && (
          <div>
            <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <div>
                <h2 className="font-bold text-[var(--sea-ink)]">
                  Adicionar horário
                </h2>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {modalTarget.displayName}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                onClick={closeModal}
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                Dias da semana
              </p>
              <div className="mb-5 flex flex-wrap gap-2">
                {WEEKDAYS.map((day, idx) => {
                  const selected = form.days.has(idx)
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(idx)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        selected
                          ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon-deep)] text-white'
                          : 'border-[var(--line)] bg-[var(--chip-bg)] text-[var(--sea-ink-soft)] hover:border-[var(--lagoon-deep)] hover:text-[var(--lagoon-deep)]'
                      }`}
                    >
                      {day.slice(0, 3)}
                    </button>
                  )
                })}
              </div>

              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                Horário
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="time"
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  value={form.startTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startTime: e.target.value }))
                  }
                />
                <span className="text-xs text-[var(--sea-ink-soft)]">até</span>
                <input
                  type="time"
                  className="flex-1 rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                  value={form.endTime}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endTime: e.target.value }))
                  }
                />
              </div>

              {form.days.size > 0 && (
                <p className="mt-3 text-xs text-[var(--sea-ink-soft)]">
                  {form.days.size === 1
                    ? `1 dia selecionado`
                    : `${form.days.size} dias selecionados`}{' '}
                  · {form.startTime}–{form.endTime}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4">
              <button
                type="button"
                className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                onClick={closeModal}
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={form.days.size === 0}
                className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
                onClick={() => void handleSaveAvailability()}
              >
                Salvar{form.days.size > 1 ? ` ${form.days.size} regras` : ''}
              </button>
            </div>
          </div>
        )}
      </dialog>
      {/* Modal de novo profissional */}
      <dialog
        ref={newStaffDialogRef}
        className="m-auto w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClose={() => setNewStaffOpen(false)}
      >
        <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
          <h2 className="font-bold text-[var(--sea-ink)]">Novo profissional</h2>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
            onClick={() => setNewStaffOpen(false)}
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4">
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
            Nome
          </label>
          <input
            type="text"
            placeholder="Ex: Maria Silva"
            className="mb-4 w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            value={newStaffForm.displayName}
            onChange={(e) =>
              setNewStaffForm((f) => ({ ...f, displayName: e.target.value }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleCreateStaff()
            }}
          />

          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
            Comissão (%)
          </label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
            value={newStaffForm.commissionPercent}
            onChange={(e) =>
              setNewStaffForm((f) => ({
                ...f,
                commissionPercent: Math.min(
                  100,
                  Math.max(0, Number(e.target.value)),
                ),
              }))
            }
          />
        </div>

        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4">
          <button
            type="button"
            className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
            onClick={() => setNewStaffOpen(false)}
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!newStaffForm.displayName.trim()}
            className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-40"
            onClick={() => void handleCreateStaff()}
          >
            Cadastrar
          </button>
        </div>
      </dialog>

      {/* Modal de confirmação de exclusão */}
      <dialog
        ref={confirmDialogRef}
        className="m-auto w-full max-w-xs rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClose={() => setDeleteTarget(null)}
      >
        <div className="px-5 py-5">
          <div className="mb-1 flex items-center gap-2">
            <Trash2 size={16} className="text-red-500" />
            <h2 className="font-bold text-[var(--sea-ink)]">Remover horário</h2>
          </div>
          <p className="text-sm text-[var(--sea-ink-soft)]">
            Tem certeza que deseja remover esta regra de disponibilidade? Esta
            ação não pode ser desfeita.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--line)] px-5 py-4">
          <button
            type="button"
            className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
            onClick={() => setDeleteTarget(null)}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            onClick={() => void handleConfirmDelete()}
          >
            Sim, remover
          </button>
        </div>
      </dialog>
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
      className={`flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--chip-bg)] ${
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
