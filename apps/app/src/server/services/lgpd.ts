import { and, eq } from 'drizzle-orm'

import { db } from '#/server/db/client'
import {
  anamnesisRecords,
  appointments,
  clientNotes,
  clients,
} from '#/server/db/schema'

export async function exportClientData(
  organizationId: string,
  clientId: string,
) {
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, clientId),
      eq(clients.organizationId, organizationId),
    ),
  })

  if (!client) {
    throw new Error('NOT_FOUND')
  }

  const notes = await db.query.clientNotes.findMany({
    where: and(
      eq(clientNotes.clientId, clientId),
      eq(clientNotes.organizationId, organizationId),
    ),
  })

  const clientAppointments = await db.query.appointments.findMany({
    where: and(
      eq(appointments.clientId, clientId),
      eq(appointments.organizationId, organizationId),
    ),
  })

  const records = await db.query.anamnesisRecords.findMany({
    where: and(
      eq(anamnesisRecords.clientId, clientId),
      eq(anamnesisRecords.organizationId, organizationId),
    ),
  })

  return {
    client,
    notes,
    appointments: clientAppointments,
    anamnesisRecords: records,
    exportedAt: new Date().toISOString(),
  }
}

export async function deleteClientData(
  organizationId: string,
  clientId: string,
) {
  const client = await db.query.clients.findFirst({
    where: and(
      eq(clients.id, clientId),
      eq(clients.organizationId, organizationId),
    ),
  })

  if (!client) {
    throw new Error('NOT_FOUND')
  }

  await db
    .delete(anamnesisRecords)
    .where(
      and(
        eq(anamnesisRecords.clientId, clientId),
        eq(anamnesisRecords.organizationId, organizationId),
      ),
    )
  await db
    .delete(clientNotes)
    .where(
      and(
        eq(clientNotes.clientId, clientId),
        eq(clientNotes.organizationId, organizationId),
      ),
    )
  await db
    .delete(clients)
    .where(
      and(eq(clients.id, clientId), eq(clients.organizationId, organizationId)),
    )

  return { deleted: true, clientId }
}
