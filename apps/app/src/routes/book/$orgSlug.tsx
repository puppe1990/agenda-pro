import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  ArrowLeft,
  Calendar,
  Check,
  Clock,
  Loader2,
  MessageCircle,
  User,
} from 'lucide-react'
import { useMemo, useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import { formatCents } from '#/lib/money'
import {
  getBookingDataFn,
  getPublicSlotsFn,
  publicBookFn,
} from '#/server/fns/app'

const STEPS = [
  { id: 1, label: 'Serviço' },
  { id: 2, label: 'Horário' },
  { id: 3, label: 'Confirmar' },
] as const

type StepId = (typeof STEPS)[number]['id']

export const Route = createFileRoute('/book/$orgSlug')({
  loader: async ({ params }) =>
    getBookingDataFn({ data: { slug: params.orgSlug } }),
  errorComponent: BookingNotFound,
  component: PublicBookingPage,
})

function BookingNotFound() {
  return (
    <main className="page-wrap px-4 py-10">
      <section className="island-shell mx-auto max-w-lg rounded-2xl p-6 text-center">
        <h1 className="page-title mb-2">Link não encontrado</h1>
        <p className="text-sm text-[var(--sea-ink-soft)]">
          Este link de agendamento não existe ou foi desativado. Verifique o
          endereço com o estabelecimento.
        </p>
      </section>
    </main>
  )
}

function PublicBookingPage() {
  const { org, services, staff } = Route.useLoaderData()
  const getSlots = useServerFn(getPublicSlotsFn)
  const book = useServerFn(publicBookFn)
  const { orgSlug } = Route.useParams()

  const [step, setStep] = useState<StepId | 'success'>(1)
  const [serviceId, setServiceId] = useState('')
  const [staffProfileId, setStaffProfileId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null)

  const today = format(new Date(), 'yyyy-MM-dd')

  const selectedService = useMemo(
    () => services.find((item) => item.id === serviceId),
    [serviceId, services],
  )

  const eligibleStaff = useMemo(() => {
    if (!selectedService?.staffProfileId) return staff
    return staff.filter((item) => item.id === selectedService.staffProfileId)
  }, [selectedService, staff])

  const effectiveStaffProfileId = useMemo(() => {
    if (!selectedService) return ''
    if (selectedService.staffProfileId) return selectedService.staffProfileId
    if (eligibleStaff.length === 1) return eligibleStaff[0].id
    return staffProfileId
  }, [eligibleStaff, selectedService, staffProfileId])

  const selectedStaff = useMemo(
    () => staff.find((item) => item.id === effectiveStaffProfileId),
    [effectiveStaffProfileId, staff],
  )

  async function loadSlots(nextDate: string) {
    if (!nextDate || !serviceId || !effectiveStaffProfileId) {
      setSlots([])
      return
    }

    setLoadingSlots(true)
    setError(null)
    setTime('')

    try {
      const available = await getSlots({
        data: {
          slug: orgSlug,
          serviceId,
          staffProfileId: effectiveStaffProfileId,
          date: nextDate,
        },
      })
      setSlots(available)
    } catch {
      setError('Não foi possível carregar os horários. Tente outra data.')
      setSlots([])
    } finally {
      setLoadingSlots(false)
    }
  }

  function handleServiceSelect(id: string) {
    setServiceId(id)
    setStaffProfileId('')
    setDate('')
    setTime('')
    setSlots([])
    setError(null)
  }

  function goToStep(next: StepId) {
    setError(null)
    setStep(next)
  }

  const step1Ready = Boolean(serviceId && effectiveStaffProfileId)

  const step2Ready = Boolean(date && time)

  if (step === 'success' && selectedService && selectedStaff) {
    return (
      <main className="page-wrap px-4 py-10">
        <section className="island-shell rise-in mx-auto max-w-lg rounded-2xl p-6">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Check size={28} strokeWidth={2.5} />
          </div>
          <h1 className="page-title mb-2">Agendamento confirmado</h1>
          <p className="mb-6 text-sm text-[var(--sea-ink-soft)]">
            Seu horário com {org.name} está reservado.
          </p>

          <BookingSummary
            serviceName={selectedService.name}
            staffName={selectedStaff.displayName}
            date={date}
            time={time}
            durationMinutes={selectedService.durationMinutes}
            priceCents={selectedService.priceCents}
            clientName={name}
          />

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              className="btn-secondary mt-5 w-full no-underline"
              target="_blank"
              rel="noreferrer"
            >
              <MessageCircle size={16} />
              Receber confirmação no WhatsApp
            </a>
          )}
        </section>
      </main>
    )
  }

  return (
    <main className="page-wrap px-4 py-10">
      <section className="island-shell mx-auto max-w-2xl rounded-2xl p-6">
        <PageHeader
          title={`Agendar com ${org.name}`}
          description="Escolha o serviço, horário e confirme em poucos passos."
        />

        <StepIndicator current={step} />

        {error && (
          <p
            role="alert"
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
          >
            {error}
          </p>
        )}

        {step === 1 && (
          <div className="space-y-5 rise-in">
            <div>
              <h2 className="mb-3 text-sm font-bold text-[var(--sea-ink)]">
                Qual serviço você quer?
              </h2>
              {services.length === 0 ? (
                <EmptyState message="Nenhum serviço disponível no momento." />
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {services.map((service) => {
                    const selected = serviceId === service.id
                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => handleServiceSelect(service.id)}
                        className={`rounded-xl border text-left transition ${
                          selected
                            ? 'border-[var(--lagoon-deep)] bg-[var(--chip-bg)] ring-2 ring-[var(--accent-soft)]'
                            : 'border-[var(--line)] bg-[var(--surface)] hover:border-[color-mix(in_oklab,var(--lagoon-deep)_30%,var(--line))]'
                        }`}
                      >
                        {service.imageUrl && (
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="h-36 w-full rounded-t-xl object-cover"
                          />
                        )}
                        <div className="p-4">
                          <p className="font-semibold text-[var(--sea-ink)]">
                            {service.name}
                          </p>
                          <div className="mt-2 flex flex-wrap gap-3 text-xs text-[var(--sea-ink-soft)]">
                            <span className="inline-flex items-center gap-1">
                              <Clock size={12} />
                              {service.durationMinutes} min
                            </span>
                            {service.priceCents > 0 && (
                              <span>{formatCents(service.priceCents)}</span>
                            )}
                          </div>
                          {service.description && (
                            <p className="mt-2 text-xs text-[var(--sea-ink-soft)]">
                              {service.description}
                            </p>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {selectedService && eligibleStaff.length > 1 && (
              <div>
                <h2 className="mb-3 text-sm font-bold text-[var(--sea-ink)]">
                  Com quem prefere ser atendido?
                </h2>
                <div className="grid gap-3 sm:grid-cols-2">
                  {eligibleStaff.map((member) => {
                    const selected = staffProfileId === member.id
                    return (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => setStaffProfileId(member.id)}
                        className={`rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                          selected
                            ? 'border-[var(--lagoon-deep)] bg-[var(--chip-bg)] ring-2 ring-[var(--accent-soft)]'
                            : 'border-[var(--line)] bg-[var(--surface)] hover:border-[color-mix(in_oklab,var(--lagoon-deep)_30%,var(--line))]'
                        }`}
                      >
                        <span className="inline-flex items-center gap-2">
                          <User size={14} />
                          {member.displayName}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {selectedService && selectedStaff && eligibleStaff.length <= 1 && (
              <p className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] px-4 py-3 text-sm text-[var(--sea-ink-soft)]">
                Atendimento com{' '}
                <strong className="text-[var(--sea-ink)]">
                  {selectedStaff.displayName}
                </strong>
              </p>
            )}

            <button
              type="button"
              className="btn-primary w-full"
              disabled={!step1Ready}
              onClick={() => goToStep(2)}
            >
              Escolher horário
            </button>
          </div>
        )}

        {step === 2 && selectedService && selectedStaff && (
          <div className="space-y-5 rise-in">
            <SelectedPill
              label={`${selectedService.name} · ${selectedStaff.displayName}`}
            />

            <div>
              <label
                htmlFor="booking-date"
                className="mb-2 block text-sm font-bold text-[var(--sea-ink)]"
              >
                Qual dia funciona para você?
              </label>
              <input
                id="booking-date"
                type="date"
                min={today}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value)
                  void loadSlots(e.target.value)
                }}
              />
            </div>

            <div>
              <h2 className="mb-3 text-sm font-bold text-[var(--sea-ink)]">
                Horários disponíveis
              </h2>

              {!date && (
                <p className="text-sm text-[var(--sea-ink-soft)]">
                  Selecione uma data para ver os horários.
                </p>
              )}

              {date && loadingSlots && (
                <div className="flex items-center gap-2 text-sm text-[var(--sea-ink-soft)]">
                  <Loader2 size={16} className="animate-spin" />
                  Buscando horários…
                </div>
              )}

              {date && !loadingSlots && slots.length === 0 && (
                <EmptyState message="Nenhum horário disponível neste dia. Tente outra data ou outro profissional." />
              )}

              {date && !loadingSlots && slots.length > 0 && (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => {
                    const selected = time === slot
                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setTime(slot)}
                        className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                          selected
                            ? 'border-[var(--lagoon-deep)] bg-[var(--lagoon-deep)] text-white'
                            : 'border-[var(--line)] bg-[var(--surface)] text-[var(--sea-ink)] hover:border-[color-mix(in_oklab,var(--lagoon-deep)_30%,var(--line))]'
                        }`}
                      >
                        {slot}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => goToStep(1)}
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
              <button
                type="button"
                className="btn-primary flex-1"
                disabled={!step2Ready}
                onClick={() => goToStep(3)}
              >
                Revisar agendamento
              </button>
            </div>
          </div>
        )}

        {step === 3 && selectedService && selectedStaff && (
          <form
            className="space-y-5 rise-in"
            onSubmit={async (e) => {
              e.preventDefault()
              setSubmitting(true)
              setError(null)

              try {
                const result = await book({
                  data: {
                    slug: orgSlug,
                    serviceId,
                    staffProfileId: effectiveStaffProfileId,
                    date,
                    time,
                    name,
                    phone,
                  },
                })
                setWhatsappUrl(result.whatsappUrl)
                setStep('success')
              } catch (err) {
                const code = err instanceof Error ? err.message : 'UNKNOWN'
                if (code === 'BOOKING_DISABLED') {
                  setError('Agendamento online está desativado no momento.')
                } else if (code === 'RATE_LIMITED') {
                  setError(
                    'Muitas tentativas em pouco tempo. Aguarde um minuto e tente novamente.',
                  )
                } else {
                  setError(
                    'Não foi possível confirmar o agendamento. Verifique o horário e tente novamente.',
                  )
                }
              } finally {
                setSubmitting(false)
              }
            }}
          >
            <BookingSummary
              serviceName={selectedService.name}
              staffName={selectedStaff.displayName}
              date={date}
              time={time}
              durationMinutes={selectedService.durationMinutes}
              priceCents={selectedService.priceCents}
            />

            <div className="space-y-3">
              <h2 className="text-sm font-bold text-[var(--sea-ink)]">
                Seus dados
              </h2>
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
              <input
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 text-sm outline-none focus:border-[var(--lagoon-deep)] focus:ring-2 focus:ring-[var(--accent-soft)]"
                placeholder="WhatsApp com DDD"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                autoComplete="tel"
                inputMode="tel"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                className="btn-secondary flex-1"
                onClick={() => goToStep(2)}
                disabled={submitting}
              >
                <ArrowLeft size={16} />
                Voltar
              </button>
              <button
                type="submit"
                className="btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Confirmando…
                  </>
                ) : (
                  'Confirmar agendamento'
                )}
              </button>
            </div>
          </form>
        )}
      </section>
    </main>
  )
}

function StepIndicator({ current }: { current: StepId | 'success' }) {
  const activeStep = current === 'success' ? 4 : current

  return (
    <ol className="mb-6 flex items-center gap-2">
      {STEPS.map((item, index) => {
        const done = activeStep > item.id
        const active = activeStep === item.id
        return (
          <li key={item.id} className="flex flex-1 items-center gap-2">
            <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                  done
                    ? 'bg-emerald-100 text-emerald-800'
                    : active
                      ? 'bg-[var(--lagoon-deep)] text-white'
                      : 'bg-[var(--chip-bg)] text-[var(--sea-ink-soft)]'
                }`}
              >
                {done ? <Check size={14} strokeWidth={2.5} /> : item.id}
              </span>
              <span
                className={`truncate text-[10px] font-semibold sm:text-xs ${
                  active || done
                    ? 'text-[var(--sea-ink)]'
                    : 'text-[var(--sea-ink-soft)]'
                }`}
              >
                {item.label}
              </span>
            </div>
            {index < STEPS.length - 1 && (
              <span
                className={`mb-5 h-px flex-1 ${
                  activeStep > item.id ? 'bg-emerald-300' : 'bg-[var(--line)]'
                }`}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}

function SelectedPill({ label }: { label: string }) {
  return (
    <p className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--chip-bg)] px-3 py-1.5 text-xs font-medium text-[var(--sea-ink-soft)]">
      <Calendar size={12} />
      {label}
    </p>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-[var(--line)] bg-[var(--chip-bg)] px-4 py-6 text-center text-sm text-[var(--sea-ink-soft)]">
      {message}
    </p>
  )
}

function BookingSummary({
  serviceName,
  staffName,
  date,
  time,
  durationMinutes,
  priceCents,
  clientName,
}: {
  serviceName: string
  staffName: string
  date: string
  time: string
  durationMinutes: number
  priceCents: number
  clientName?: string
}) {
  const formattedDate = date
    ? format(parseISO(`${date}T12:00:00`), "EEEE, d 'de' MMMM", {
        locale: ptBR,
      })
    : ''

  return (
    <div className="rounded-xl border border-[var(--line)] bg-[var(--chip-bg)] p-4">
      <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--sea-ink-soft)]">
        Resumo
      </p>
      <dl className="space-y-2 text-sm">
        <SummaryRow label="Serviço" value={serviceName} />
        <SummaryRow label="Profissional" value={staffName} />
        <SummaryRow
          label="Data"
          value={formattedDate ? capitalize(formattedDate) : '—'}
        />
        <SummaryRow label="Horário" value={time || '—'} />
        <SummaryRow label="Duração" value={`${durationMinutes} min`} />
        {priceCents > 0 && (
          <SummaryRow label="Valor" value={formatCents(priceCents)} />
        )}
        {clientName && <SummaryRow label="Cliente" value={clientName} />}
      </dl>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <dt className="text-[var(--sea-ink-soft)]">{label}</dt>
      <dd className="text-right font-medium text-[var(--sea-ink)]">{value}</dd>
    </div>
  )
}

function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
