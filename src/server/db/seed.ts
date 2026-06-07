import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import {
  clients,
  messageTemplates,
  organizations,
  services,
  staffProfiles,
  users,
} from '#/server/db/schema'

export async function seedDemoOrganization() {
  const orgId = createId()
  const userId = createId()
  const staffId = createId()

  await db.insert(users).values({
    id: userId,
    name: 'Demo Owner',
    email: 'demo@agendapro.local',
    emailVerified: true,
  })

  await db.insert(organizations).values({
    id: orgId,
    name: 'Studio Demo',
    publicSlug: 'studio-demo',
  })

  await db.insert(staffProfiles).values({
    id: staffId,
    organizationId: orgId,
    userId,
    displayName: 'Profissional Demo',
    commissionPercent: 10,
  })

  await db.insert(services).values({
    id: createId(),
    organizationId: orgId,
    staffProfileId: staffId,
    name: 'Consulta',
    durationMinutes: 30,
    priceCents: 8000,
  })

  await db.insert(clients).values({
    id: createId(),
    organizationId: orgId,
    name: 'Cliente Demo',
    phone: '11999990000',
  })

  await db.insert(messageTemplates).values({
    id: createId(),
    organizationId: orgId,
    type: 'confirmation',
    name: 'Confirmação',
    body: 'Olá {cliente}, confirmado {servico} em {data}.',
  })

  return orgId
}
