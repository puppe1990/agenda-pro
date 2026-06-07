import { createFileRoute } from '@tanstack/react-router'
import { useServerFn } from '@tanstack/react-start'

import { PageHeader } from '#/components/PageHeader'
import {
  listAvailabilityFn,
  listStaffFn,
  saveAvailabilityFn,
  saveStaffFn,
} from '#/server/fns/app'

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
  const saveStaff = useServerFn(saveStaffFn)
  const saveAvailability = useServerFn(saveAvailabilityFn)

  return (
    <section className="island-shell rounded-2xl p-6">
      <PageHeader
        title="Equipe"
        description="Profissionais, comissões e disponibilidade."
      />
      <ul className="mb-6 space-y-3">
        {data.staff.map((member) => (
          <li
            key={member.id}
            className="rounded-xl border bg-white/50 p-3 text-sm"
          >
            <p className="font-semibold">{member.displayName}</p>
            <p className="text-[var(--sea-ink-soft)]">
              Comissão: {member.commissionPercent}%
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-lg border px-2 py-1"
                onClick={async () => {
                  await saveStaff({
                    data: {
                      id: member.id,
                      displayName: member.displayName,
                      commissionPercent: member.commissionPercent + 5,
                      active: member.active,
                    },
                  })
                  window.location.reload()
                }}
              >
                +5% comissão
              </button>
              <button
                type="button"
                className="rounded-lg border px-2 py-1"
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
              </button>
            </div>
          </li>
        ))}
      </ul>
      <h3 className="mb-2 font-semibold">Regras de disponibilidade</h3>
      <ul className="space-y-1 text-sm">
        {data.availability.map((rule) => (
          <li key={rule.id}>
            Profissional {rule.staffProfileId.slice(0, 6)} — dia{' '}
            {rule.dayOfWeek} {rule.startTime}-{rule.endTime}
          </li>
        ))}
      </ul>
    </section>
  )
}
