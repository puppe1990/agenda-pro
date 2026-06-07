import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'
import { useState } from 'react'

import { PageHeader } from '#/components/PageHeader'
import {
  getBookingDataFn,
  getPublicSlotsFn,
  publicBookFn,
} from '#/server/fns/app'

export const Route = createFileRoute('/book/$orgSlug')({
  loader: async ({ params }) =>
    getBookingDataFn({ data: { slug: params.orgSlug } }),
  component: PublicBookingPage,
})

function PublicBookingPage() {
  const { org, services, staff } = Route.useLoaderData()
  const getSlots = useServerFn(getPublicSlotsFn)
  const book = useServerFn(publicBookFn)
  const { orgSlug } = Route.useParams()
  const [step, setStep] = useState(1)
  const [serviceId, setServiceId] = useState('')
  const [staffProfileId, setStaffProfileId] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [resultUrl, setResultUrl] = useState<string | null>(null)

  return (
    <main className="page-wrap px-4 py-10">
      <section className="island-shell mx-auto max-w-2xl rounded-2xl p-6">
        <PageHeader
          title={`Agendar com ${org.name}`}
          description="Escolha serviço, horário e confirme sem login."
        />
        {step === 1 && (
          <div className="space-y-3">
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
            >
              <option value="">Serviço</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={staffProfileId}
              onChange={(e) => setStaffProfileId(e.target.value)}
            >
              <option value="">Profissional</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.displayName}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-white"
              onClick={() => setStep(2)}
            >
              Continuar
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="space-y-3">
            <input
              type="date"
              className="w-full rounded-xl border px-3 py-2"
              value={date}
              onChange={async (e) => {
                setDate(e.target.value)
                const available = await getSlots({
                  data: {
                    slug: orgSlug,
                    serviceId,
                    staffProfileId,
                    date: e.target.value,
                  },
                })
                setSlots(available)
              }}
            />
            <select
              className="w-full rounded-xl border px-3 py-2"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              <option value="">Horário</option>
              {slots.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-white"
              onClick={() => setStep(3)}
            >
              Continuar
            </button>
          </div>
        )}
        {step === 3 && (
          <form
            className="space-y-3"
            onSubmit={async (e) => {
              e.preventDefault()
              const result = await book({
                data: {
                  slug: orgSlug,
                  serviceId,
                  staffProfileId,
                  date,
                  time,
                  name,
                  phone,
                },
              })
              setResultUrl(result.whatsappUrl)
            }}
          >
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              className="w-full rounded-xl border px-3 py-2"
              placeholder="WhatsApp"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button
              type="submit"
              className="rounded-xl bg-[var(--lagoon-deep)] px-4 py-2 text-white"
            >
              Confirmar agendamento
            </button>
          </form>
        )}
        {resultUrl && (
          <p className="mt-4 text-sm">
            Agendamento confirmado.{' '}
            <a
              href={resultUrl}
              className="font-semibold"
              target="_blank"
              rel="noreferrer"
            >
              Abrir WhatsApp
            </a>
          </p>
        )}
      </section>
    </main>
  )
}
