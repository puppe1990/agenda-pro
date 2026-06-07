import { and, eq } from 'drizzle-orm'

import { db } from '#/server/db/client'
import { memberships, organizations } from '#/server/db/schema'
import { auth } from '#/server/auth'

export type TenantContext = {
  userId: string
  organizationId: string
  role: 'owner' | 'admin' | 'professional' | 'receptionist'
  organization: typeof organizations.$inferSelect
}

export async function getSessionFromHeaders(request: Request) {
  return auth.api.getSession({ headers: request.headers })
}

export async function requireTenantContext(
  request: Request,
): Promise<TenantContext> {
  const session = await getSessionFromHeaders(request)
  if (!session?.user) {
    throw new Error('UNAUTHORIZED')
  }

  const membership = await db.query.memberships.findFirst({
    where: eq(memberships.userId, session.user.id),
  })

  if (!membership) {
    throw new Error('NO_ORGANIZATION')
  }

  const organization = await db.query.organizations.findFirst({
    where: eq(organizations.id, membership.organizationId),
  })

  if (!organization) {
    throw new Error('NO_ORGANIZATION')
  }

  return {
    userId: session.user.id,
    organizationId: membership.organizationId,
    role: membership.role,
    organization,
  }
}

export function assertRole(ctx: TenantContext, roles: TenantContext['role'][]) {
  if (!roles.includes(ctx.role)) {
    throw new Error('FORBIDDEN')
  }
}

export async function getMembershipForOrg(
  userId: string,
  organizationId: string,
) {
  return db.query.memberships.findFirst({
    where: and(
      eq(memberships.userId, userId),
      eq(memberships.organizationId, organizationId),
    ),
  })
}
