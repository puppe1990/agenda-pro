import { and, eq, gt, lt, ne, or } from 'drizzle-orm'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import {
  appointmentStatusHistory,
  appointments,
  noShowPenalties,
  noShows,
} from '#/server/db/schema'

export type CreateAppointmentInput = {
  organizationId: string
  staffProfileId: string
  clientId: string
  serviceId: string
  startsAt: string
  endsAt: string
  notes?: string
}

export async function hasAppointmentOverlap(input: {
  organizationId: string
  staffProfileId: string
  startsAt: string
  endsAt: string
  excludeAppointmentId?: string
}) {
  const conditions = [
    eq(appointments.organizationId, input.organizationId),
    eq(appointments.staffProfileId, input.staffProfileId),
    ne(appointments.status, 'cancelled'),
    or(
      and(
        lt(appointments.startsAt, input.endsAt),
        gt(appointments.endsAt, input.startsAt),
      ),
    ),
  ]

  if (input.excludeAppointmentId) {
    conditions.push(ne(appointments.id, input.excludeAppointmentId))
  }

  const conflict = await db.query.appointments.findFirst({
    where: and(...conditions),
  })

  return Boolean(conflict)
}

export async function createAppointment(input: CreateAppointmentInput) {
  const overlap = await hasAppointmentOverlap(input)
  if (overlap) {
    throw new Error('APPOINTMENT_CONFLICT')
  }

  const id = createId()
  await db.insert(appointments).values({
    id,
    organizationId: input.organizationId,
    staffProfileId: input.staffProfileId,
    clientId: input.clientId,
    serviceId: input.serviceId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    notes: input.notes,
    status: 'scheduled',
  })

  await db.insert(appointmentStatusHistory).values({
    id: createId(),
    organizationId: input.organizationId,
    appointmentId: id,
    fromStatus: null,
    toStatus: 'scheduled',
  })

  return id
}

export async function rescheduleAppointment(input: {
  organizationId: string
  appointmentId: string
  startsAt: string
  endsAt: string
}) {
  const existing = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, input.appointmentId),
      eq(appointments.organizationId, input.organizationId),
    ),
  })

  if (!existing) {
    throw new Error('NOT_FOUND')
  }

  const overlap = await hasAppointmentOverlap({
    organizationId: input.organizationId,
    staffProfileId: existing.staffProfileId,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    excludeAppointmentId: input.appointmentId,
  })

  if (overlap) {
    throw new Error('APPOINTMENT_CONFLICT')
  }

  await db
    .update(appointments)
    .set({
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(appointments.id, input.appointmentId))

  await db.insert(appointmentStatusHistory).values({
    id: createId(),
    organizationId: input.organizationId,
    appointmentId: input.appointmentId,
    fromStatus: existing.status,
    toStatus: existing.status,
  })
}

export async function markNoShow(input: {
  organizationId: string
  appointmentId: string
  penaltyCents: number
}) {
  const existing = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, input.appointmentId),
      eq(appointments.organizationId, input.organizationId),
    ),
  })

  if (!existing) {
    throw new Error('NOT_FOUND')
  }

  await db
    .update(appointments)
    .set({ status: 'no_show', updatedAt: new Date().toISOString() })
    .where(eq(appointments.id, input.appointmentId))

  await db.insert(noShows).values({
    id: createId(),
    organizationId: input.organizationId,
    appointmentId: input.appointmentId,
  })

  if (input.penaltyCents > 0) {
    await db.insert(noShowPenalties).values({
      id: createId(),
      organizationId: input.organizationId,
      appointmentId: input.appointmentId,
      amountCents: input.penaltyCents,
      paid: false,
    })
  }

  await db.insert(appointmentStatusHistory).values({
    id: createId(),
    organizationId: input.organizationId,
    appointmentId: input.appointmentId,
    fromStatus: existing.status,
    toStatus: 'no_show',
  })
}

export async function cancelAppointment(input: {
  organizationId: string
  appointmentId: string
}) {
  const existing = await db.query.appointments.findFirst({
    where: and(
      eq(appointments.id, input.appointmentId),
      eq(appointments.organizationId, input.organizationId),
    ),
  })

  if (!existing) {
    throw new Error('NOT_FOUND')
  }

  await db
    .update(appointments)
    .set({ status: 'cancelled', updatedAt: new Date().toISOString() })
    .where(eq(appointments.id, input.appointmentId))

  await db.insert(appointmentStatusHistory).values({
    id: createId(),
    organizationId: input.organizationId,
    appointmentId: input.appointmentId,
    fromStatus: existing.status,
    toStatus: 'cancelled',
  })
}
