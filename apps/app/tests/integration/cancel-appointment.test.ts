import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import * as schema from '#/server/db/schema'
import {
  cancelAppointment,
  createAppointment,
} from '#/server/services/appointments'

let ids: {
  orgId: string
  staffId: string
  clientId: string
  serviceId: string
}

beforeAll(async () => {
  const orgId = createId()
  const staffId = createId()
  const clientId = createId()
  const serviceId = createId()
  const userId = createId()

  await db.insert(schema.users).values({
    id: userId,
    name: 'Cancel Test',
    email: `cancel-${createId()}@example.com`,
    emailVerified: true,
  })
  await db.insert(schema.organizations).values({
    id: orgId,
    name: 'Cancel Org',
    publicSlug: `cancel-${createId().slice(0, 8)}`,
  })
  await db.insert(schema.staffProfiles).values({
    id: staffId,
    organizationId: orgId,
    userId,
    displayName: 'Pro',
  })
  await db.insert(schema.clients).values({
    id: clientId,
    organizationId: orgId,
    name: 'Cliente',
  })
  await db.insert(schema.services).values({
    id: serviceId,
    organizationId: orgId,
    name: 'Serviço',
    durationMinutes: 30,
    priceCents: 1000,
  })

  ids = { orgId, staffId, clientId, serviceId }
})

describe('cancelAppointment', () => {
  it('marks appointment as cancelled', async () => {
    const appointmentId = await createAppointment({
      organizationId: ids.orgId,
      staffProfileId: ids.staffId,
      clientId: ids.clientId,
      serviceId: ids.serviceId,
      startsAt: '2026-07-01T10:00:00.000Z',
      endsAt: '2026-07-01T10:30:00.000Z',
    })

    await cancelAppointment({
      organizationId: ids.orgId,
      appointmentId,
    })

    const row = await db.query.appointments.findFirst({
      where: eq(schema.appointments.id, appointmentId),
    })

    expect(row?.status).toBe('cancelled')
  })
})
