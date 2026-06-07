import { eq } from 'drizzle-orm'

import { createId, slugify } from '#/lib/id'
import { db } from '#/server/db/client'
import {
  memberships,
  organizationSettings,
  organizations,
  staffProfiles,
} from '#/server/db/schema'

export async function createOrganizationForUser(input: {
  userId: string
  userName: string
  organizationName: string
}) {
  const existing = await db.query.memberships.findFirst({
    where: eq(memberships.userId, input.userId),
  })

  if (existing) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, existing.organizationId),
    })
    return org
  }

  const orgId = createId()
  const baseSlug = slugify(input.organizationName) || 'negocio'
  const publicSlug = `${baseSlug}-${orgId.slice(0, 8)}`

  await db.insert(organizations).values({
    id: orgId,
    name: input.organizationName,
    publicSlug,
  })

  await db.insert(memberships).values({
    id: createId(),
    organizationId: orgId,
    userId: input.userId,
    role: 'owner',
  })

  await db.insert(organizationSettings).values({
    id: createId(),
    organizationId: orgId,
  })

  await db.insert(staffProfiles).values({
    id: createId(),
    organizationId: orgId,
    userId: input.userId,
    displayName: input.userName,
    commissionPercent: 0,
    active: true,
  })

  return db.query.organizations.findFirst({
    where: eq(organizations.id, orgId),
  })
}
