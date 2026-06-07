import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import * as schema from '#/server/db/schema'
import { deleteClientData, exportClientData } from '#/server/services/lgpd'

let ids: { orgId: string; clientId: string }

beforeAll(async () => {
  const orgId = createId()
  const clientId = createId()

  await db.insert(schema.organizations).values({
    id: orgId,
    name: 'LGPD Org',
    publicSlug: `lgpd-${createId().slice(0, 8)}`,
  })

  await db.insert(schema.clients).values({
    id: clientId,
    organizationId: orgId,
    name: 'Titular',
    phone: '11988887777',
  })

  await db.insert(schema.clientNotes).values({
    id: createId(),
    organizationId: orgId,
    clientId,
    content: 'Observação sensível',
  })

  ids = { orgId, clientId }
})

describe('lgpd service', () => {
  it('exports client bundle', async () => {
    const payload = await exportClientData(ids.orgId, ids.clientId)
    expect(payload.client.name).toBe('Titular')
    expect(payload.notes).toHaveLength(1)
    expect(payload.exportedAt).toBeTruthy()
  })

  it('deletes client data', async () => {
    await deleteClientData(ids.orgId, ids.clientId)
    const remaining = await db
      .select()
      .from(schema.clients)
      .where(eq(schema.clients.id, ids.clientId))
    expect(remaining).toHaveLength(0)
  })
})
