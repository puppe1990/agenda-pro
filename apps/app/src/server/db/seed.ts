import { eq } from 'drizzle-orm'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import {
  availabilityRules,
  clients,
  memberships,
  messageTemplates,
  organizationSettings,
  organizations,
  services,
  staffProfiles,
  users,
} from '#/server/db/schema'

export async function seedDemoOrganization() {
  const existing = await db.query.organizations.findFirst({
    where: eq(organizations.publicSlug, 'studio-demo'),
  })

  if (existing) {
    return existing.id
  }

  const orgId = createId()
  const userId = createId()
  const staffId = createId()
  const serviceId = createId()

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
    noShowPenaltyCents: 3000,
  })

  await db.insert(memberships).values({
    id: createId(),
    organizationId: orgId,
    userId,
    role: 'owner',
  })

  await db.insert(organizationSettings).values({
    id: createId(),
    organizationId: orgId,
    bookingEnabled: true,
  })

  await db.insert(staffProfiles).values({
    id: staffId,
    organizationId: orgId,
    userId,
    displayName: 'Profissional Demo',
    commissionPercent: 10,
  })

  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    await db.insert(availabilityRules).values({
      id: createId(),
      organizationId: orgId,
      staffProfileId: staffId,
      dayOfWeek,
      startTime: '09:00',
      endTime: '18:00',
    })
  }

  await db.insert(services).values({
    id: serviceId,
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
    email: 'cliente@demo.local',
  })

  await db.insert(messageTemplates).values({
    id: createId(),
    organizationId: orgId,
    type: 'confirmation',
    name: 'Confirmação',
    body: 'Olá {cliente}, confirmado {servico} em {data}.',
  })

  await db.insert(messageTemplates).values({
    id: createId(),
    organizationId: orgId,
    type: 'reminder',
    name: 'Lembrete',
    body: 'Olá {cliente}, lembramos seu horário {data} para {servico}.',
  })

  return orgId
}
