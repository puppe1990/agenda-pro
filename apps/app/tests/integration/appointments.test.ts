import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import * as schema from '#/server/db/schema'
import {
  createAppointment,
  hasAppointmentOverlap,
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
    name: 'Test User',
    email: `test-${createId()}@example.com`,
    emailVerified: true,
  })
  await db.insert(schema.organizations).values({
    id: orgId,
    name: 'Salão Teste',
    publicSlug: `salao-${createId().slice(0, 8)}`,
  })
  await db.insert(schema.staffProfiles).values({
    id: staffId,
    organizationId: orgId,
    userId,
    displayName: 'Profissional',
  })
  await db.insert(schema.clients).values({
    id: clientId,
    organizationId: orgId,
    name: 'Cliente',
    phone: '11999990000',
  })
  await db.insert(schema.services).values({
    id: serviceId,
    organizationId: orgId,
    name: 'Corte',
    durationMinutes: 30,
    priceCents: 5000,
  })

  ids = { orgId, staffId, clientId, serviceId }
})

describe('appointments service', () => {
  it('detects overlap for same professional', async () => {
    await createAppointment({
      organizationId: ids.orgId,
      staffProfileId: ids.staffId,
      clientId: ids.clientId,
      serviceId: ids.serviceId,
      startsAt: '2026-06-10T14:00:00.000Z',
      endsAt: '2026-06-10T14:30:00.000Z',
    })

    const overlap = await hasAppointmentOverlap({
      organizationId: ids.orgId,
      staffProfileId: ids.staffId,
      startsAt: '2026-06-10T14:15:00.000Z',
      endsAt: '2026-06-10T14:45:00.000Z',
    })

    expect(overlap).toBe(true)
  })

  it('isolates appointments by organization', async () => {
    const otherOrgId = createId()

    await db.insert(schema.organizations).values({
      id: otherOrgId,
      name: 'Outro',
      publicSlug: `outro-${createId().slice(0, 8)}`,
    })

    const overlap = await hasAppointmentOverlap({
      organizationId: otherOrgId,
      staffProfileId: ids.staffId,
      startsAt: '2026-06-10T14:00:00.000Z',
      endsAt: '2026-06-10T14:30:00.000Z',
    })

    expect(overlap).toBe(false)

    const rows = await db
      .select()
      .from(schema.appointments)
      .where(eq(schema.appointments.organizationId, ids.orgId))

    expect(rows.length).toBeGreaterThan(0)
  })
})
