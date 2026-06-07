import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import {
  CalendarClock,
  Clock,
  Percent,
  Plus,
  Search,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

import { PageHeader } from '#/components/PageHeader'
import {
  createStaffFn,
  deleteAvailabilityFn,
  listAvailabilityFn,
  listStaffFn,
  replaceAvailabilityFn,
  saveStaffFn,
} from '#/server/fns/app'

// Seg→Dom order
const DAY_ORDER = [1, 2, 3, 4, 5, 6, 0]
const DAY_LABELS = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom']
const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
]

// Slots de 30min de 07:00 a 22:00
const SLOTS: string[] = Array.from({ length: 30 }, (_, i) => {
  const mins = 7 * 60 + i * 30
  return `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`
})

function addMins(time: string, m: number) {
  const [h, min] = time.split(':').map(Number)
  const total = h * 60 + min + m
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

function slotsToRules(slots: Set<string>) {
  const byDay = new Map<number, string[]>()
  for (const key of slots) {
    const colon = key.indexOf(':')
    const day = Number(key.slice(0, colon))
    const time = key.slice(colon + 1)
    const arr = byDay.get(day) ?? []
    arr.push(time)
    byDay.set(day, arr)
  }
  const rules: { dayOfWeek: number; startTime: string; endTime: string }[] = []
  for (const [day, times] of byDay) {
    const sorted = [...times].sort()
    let i = 0
    while (i < sorted.length) {
      const start = sorted[i]
      let end = addMins(start, 30)
      while (i + 1 < sorted.length && sorted[i + 1] === end) {
        i++
        end = addMins(end, 30)
      }
      rules.push({ dayOfWeek: day, startTime: start, endTime: end })
      i++
    }
  }
  return rules
}

function rulesToSlots(
  rules: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  const slots = new Set<string>()
  for (const r of rules) {
    let t = r.startTime
    while (t < r.endTime) {
      slots.add(`${r.dayOfWeek}:${t}`)
      t = addMins(t, 30)
    }
  }
  return slots
}

type ModalTarget = { staffId: string; displayName: string }

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
  const createStaff = useServerFn(createStaffFn)
  const saveStaff = useServerFn(saveStaffFn)
  const replaceAvailability = useServerFn(replaceAvailabilityFn)
  const deleteAvailability = useServerFn(deleteAvailabilityFn)

  const [q, setQ] = useState('')
  const [modalTarget, setModalTarget] = useState<ModalTarget | null>(null)
  const [paintedSlots, setPaintedSlots] = useState<Set<string>>(new Set())
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [newStaffOpen, setNewStaffOpen] = useState(false)
  const [newStaffForm, setNewStaffForm] = useState({
    displayName: '',
    commissionPercent: 0,
  })
  const [viewRulesFor, setViewRulesFor] = useState<ModalTarget | null>(null)
  const [saving, setSaving] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const isDraggingRef = useRef(false)
  const dragAddingRef = useRef(true)

  const dialogRef = useRef<HTMLDialogElement>(null)
  const confirmDialogRef = useRef<HTMLDialogElement>(null)
  const newStaffDialogRef = useRef<HTMLDialogElement>(null)
  const viewRulesDialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const stop = () => {
      isDraggingRef.current = false
    }
    window.addEventListener('pointerup', stop)
    return () => window.removeEventListener('pointerup', stop)
  }, [])

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

  useEffect(() => {
    if (viewRulesFor) {
      viewRulesDialogRef.current?.showModal()
    } else {
      viewRulesDialogRef.current?.close()
    }
  }, [viewRulesFor])

  const filteredStaff = useMemo(() => {
    const query = q.trim().toLowerCase()
    return staff
      .filter((m) => !query || m.displayName.toLowerCase().includes(query))
      .sort((a, b) => a.displayName.localeCompare(b.displayName, 'pt-BR'))
  }, [staff, q])

  const activeCount = staff.filter((m) => m.active).length
  const avgCommission =
    staff.length > 0
      ? Math.round(
          staff.reduce((s, m) => s + m.commissionPercent, 0) / staff.length,
        )
      : 0

  const availabilityByStaff = useMemo(() => {
    const map = new Map<string, typeof availability>()
    for (const rule of availability) {
      const cur = map.get(rule.staffProfileId) ?? []
      cur.push(rule)
      map.set(rule.staffProfileId, cur)
    }
    return map
  }, [availability])

  function openModal(staffId: string, displayName: string) {
    const existing = availabilityByStaff.get(staffId) ?? []
    setPaintedSlots(rulesToSlots(existing))
    setConfirmClear(false)
    setModalTarget({ staffId, displayName })
  }

  function handleSlotPointerDown(key: string) {
    isDraggingRef.current = true
    const adding = !paintedSlots.has(key)
    dragAddingRef.current = adding
    setPaintedSlots((prev) => {
      const next = new Set(prev)
      if (adding) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  function handleSlotPointerEnter(key: string) {
    if (!isDraggingRef.current) return
    setPaintedSlots((prev) => {
      const next = new Set(prev)
      if (dragAddingRef.current) {
        next.add(key)
      } else {
        next.delete(key)
      }
      return next
    })
  }

  async function handleSaveAvailability() {
    if (!modalTarget) return
    setSaving(true)
    try {
      const rules = slotsToRules(paintedSlots)
      await replaceAvailability({
        data: { staffProfileId: modalTarget.staffId, rules },
      })
      toast.success('Horários salvos com sucesso.')
      setModalTarget(null)
      window.location.reload()
    } catch {
      toast.error('Erro ao salvar horários. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  async function handleCreateStaff() {
    if (!newStaffForm.displayName.trim()) return
    try {
      await createStaff({
        data: {
          displayName: newStaffForm.displayName.trim(),
          commissionPercent: newStaffForm.commissionPercent,
        },
      })
      toast.success(
        `Profissional "${newStaffForm.displayName.trim()}" cadastrado.`,
      )
      setNewStaffOpen(false)
      setNewStaffForm({ displayName: '', commissionPercent: 0 })
      window.location.reload()
    } catch {
      toast.error('Erro ao cadastrar profissional.')
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) return
    try {
      await deleteAvailability({ data: { id: deleteTarget } })
      toast.success('Horário removido.')
      setDeleteTarget(null)
      window.location.reload()
    } catch {
      toast.error('Erro ao remover horário.')
    }
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

      <div>
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
                                {rule.startTime}–{rule.endTime}
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
                          try {
                            const next = Math.min(
                              100,
                              member.commissionPercent + 5,
                            )
                            await saveStaff({
                              data: {
                                id: member.id,
                                displayName: member.displayName,
                                commissionPercent: next,
                                active: member.active,
                              },
                            })
                            toast.success(
                              `Comissão de ${member.displayName} atualizada para ${next}%.`,
                            )
                            window.location.reload()
                          } catch {
                            toast.error('Erro ao atualizar comissão.')
                          }
                        }}
                      >
                        +5% comissão
                      </ActionButton>
                      <ActionButton
                        onClick={() => openModal(member.id, member.displayName)}
                      >
                        <CalendarClock size={12} /> Horários
                        {rules.length > 0 && (
                          <span className="ml-0.5 rounded-full bg-[var(--lagoon-deep)] px-1.5 py-0.5 text-[0.6rem] font-bold text-white">
                            {rules.length}
                          </span>
                        )}
                      </ActionButton>
                      <ActionButton
                        variant={member.active ? 'danger' : 'default'}
                        onClick={async () => {
                          try {
                            const next = !member.active
                            await saveStaff({
                              data: {
                                id: member.id,
                                displayName: member.displayName,
                                commissionPercent: member.commissionPercent,
                                active: next,
                              },
                            })
                            toast.success(
                              next
                                ? `${member.displayName} ativado.`
                                : `${member.displayName} desativado.`,
                            )
                            window.location.reload()
                          } catch {
                            toast.error(
                              'Erro ao alterar status do profissional.',
                            )
                          }
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

      {/* Modal calendário de horários */}
      <dialog
        ref={dialogRef}
        className="m-auto w-full max-w-2xl rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClose={() => setModalTarget(null)}
      >
        {modalTarget && (
          <div className="flex flex-col" style={{ maxHeight: '90vh' }}>
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between border-b border-[var(--line)] px-5 py-4">
              <div>
                <h2 className="font-bold text-[var(--sea-ink)]">
                  Horários disponíveis
                </h2>
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {modalTarget.displayName}
                </p>
              </div>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                onClick={() => setModalTarget(null)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Legenda */}
            <div className="flex shrink-0 items-center gap-4 border-b border-[var(--line)] px-5 py-2.5">
              <span className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
                <span className="h-3 w-3 rounded-sm bg-[var(--lagoon-deep)]" />
                Disponível
              </span>
              <span className="flex items-center gap-1.5 text-xs text-[var(--sea-ink-soft)]">
                <span className="h-3 w-3 rounded-sm bg-[var(--chip-bg)] border border-[var(--line)]" />
                Indisponível
              </span>
              <span className="ml-auto text-xs text-[var(--sea-ink-soft)]">
                Clique ou arraste para pintar
              </span>
            </div>

            {/* Grid */}
            <div className="min-h-0 overflow-y-auto">
              {/* Header dos dias */}
              <div className="sticky top-0 z-10 flex border-b border-[var(--line)] bg-[var(--surface)]">
                <div className="w-12 shrink-0" />
                {DAY_LABELS.map((label) => (
                  <div
                    key={label}
                    className="flex-1 py-2 text-center text-xs font-semibold text-[var(--sea-ink)]"
                  >
                    {label}
                  </div>
                ))}
              </div>

              {/* Linhas de horário */}
              <div className="select-none">
                {SLOTS.map((slot, rowIdx) => {
                  const isFullHour = slot.endsWith(':00')
                  return (
                    <div
                      key={slot}
                      className={`flex ${isFullHour ? 'border-t border-[var(--line)]' : ''}`}
                    >
                      {/* Rótulo de hora */}
                      <div className="flex w-12 shrink-0 items-start justify-end pr-2 pt-0.5">
                        {isFullHour && (
                          <span className="text-[0.6rem] leading-none text-[var(--sea-ink-soft)]">
                            {slot}
                          </span>
                        )}
                      </div>

                      {/* Células por dia */}
                      {DAY_ORDER.map((dayOfWeek) => {
                        const key = `${dayOfWeek}:${slot}`
                        const painted = paintedSlots.has(key)
                        return (
                          <div
                            key={dayOfWeek}
                            className={`flex-1 cursor-pointer border-l border-[var(--line)] transition-colors ${
                              rowIdx % 2 === 1
                                ? 'border-b border-dashed border-[var(--line)]'
                                : ''
                            } ${
                              painted
                                ? 'bg-[var(--lagoon-deep)] hover:opacity-80'
                                : 'bg-[var(--surface)] hover:bg-[var(--accent-soft)]'
                            }`}
                            style={{ height: '18px' }}
                            onPointerDown={(e) => {
                              e.preventDefault()
                              handleSlotPointerDown(key)
                            }}
                            onPointerEnter={() => handleSlotPointerEnter(key)}
                          />
                        )
                      })}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between border-t border-[var(--line)] px-5 py-4">
              {confirmClear ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-[var(--sea-ink)]">
                    Limpar tudo?
                  </span>
                  <button
                    type="button"
                    className="rounded-lg bg-red-600 px-2.5 py-1 text-xs font-semibold text-white transition hover:bg-red-700"
                    onClick={() => {
                      setPaintedSlots(new Set())
                      setConfirmClear(false)
                    }}
                  >
                    Sim, limpar
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[var(--line)] px-2.5 py-1 text-xs font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                    onClick={() => setConfirmClear(false)}
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="text-xs text-[var(--sea-ink-soft)] underline transition hover:text-red-600"
                  onClick={() => setConfirmClear(true)}
                >
                  Limpar tudo
                </button>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                  onClick={() => setModalTarget(null)}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={saving}
                  className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
                  onClick={() => void handleSaveAvailability()}
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>

      {/* Modal de visualização de horários */}
      <dialog
        ref={viewRulesDialogRef}
        className="m-auto w-full max-w-sm rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-0 shadow-2xl backdrop:bg-black/40 backdrop:backdrop-blur-sm"
        onClose={() => setViewRulesFor(null)}
      >
        {viewRulesFor &&
          (() => {
            const rules = (availabilityByStaff.get(viewRulesFor.staffId) ?? [])
              .slice()
              .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
            return (
              <div>
                <div className="flex items-center justify-between border-b border-[var(--line)] px-5 py-4">
                  <div>
                    <h2 className="font-bold text-[var(--sea-ink)]">
                      Horários cadastrados
                    </h2>
                    <p className="text-xs text-[var(--sea-ink-soft)]">
                      {viewRulesFor.displayName}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                    onClick={() => setViewRulesFor(null)}
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto px-5 py-4">
                  {rules.length === 0 ? (
                    <div className="py-6 text-center">
                      <CalendarClock
                        size={24}
                        className="mx-auto mb-2 text-[var(--sea-ink-soft)]"
                      />
                      <p className="text-sm text-[var(--sea-ink-soft)]">
                        Nenhum horário cadastrado.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {rules.map((rule) => (
                        <li
                          key={rule.id}
                          className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-2.5"
                        >
                          <span className="flex items-center gap-2 text-sm text-[var(--sea-ink)]">
                            <Clock
                              size={13}
                              className="text-[var(--sea-ink-soft)]"
                            />
                            <span className="font-medium">
                              {WEEKDAYS[rule.dayOfWeek]}
                            </span>
                            <span className="text-[var(--sea-ink-soft)]">
                              ·
                            </span>
                            <span>
                              {rule.startTime}–{rule.endTime}
                            </span>
                          </span>
                          <button
                            type="button"
                            className="shrink-0 rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-600"
                            onClick={() => setDeleteTarget(rule.id)}
                          >
                            <Trash2 size={13} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="flex justify-end border-t border-[var(--line)] px-5 py-4">
                  <button
                    type="button"
                    className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink-soft)] transition hover:bg-[var(--chip-bg)]"
                    onClick={() => setViewRulesFor(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            )
          })()}
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
            Tem certeza que deseja remover esta regra? Esta ação não pode ser
            desfeita.
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
