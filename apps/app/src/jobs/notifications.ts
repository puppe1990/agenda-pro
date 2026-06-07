import { and, eq, lte } from 'drizzle-orm'

import { db } from '#/server/db/client'
import { clients, notificationQueue } from '#/server/db/schema'
import { sendTransactionalEmail } from '#/server/services/email'
import { renderTemplate } from '#/server/services/whatsapp'

export async function processDueNotifications(now = new Date()) {
  const due = await db.query.notificationQueue.findMany({
    where: and(
      eq(notificationQueue.status, 'pending'),
      lte(notificationQueue.scheduledAt, now.toISOString()),
    ),
  })

  for (const item of due) {
    if (item.channel === 'email' && item.clientId) {
      const client = await db.query.clients.findFirst({
        where: eq(clients.id, item.clientId),
      })
      if (client?.email) {
        await sendTransactionalEmail({
          to: client.email,
          subject: 'Gestão Bem',
          body: item.message,
        })
      }
    }

    await db
      .update(notificationQueue)
      .set({
        status: 'sent',
        sentAt: now.toISOString(),
        updatedAt: now.toISOString(),
      })
      .where(eq(notificationQueue.id, item.id))
  }

  return due.length
}

export async function enqueueBirthdayMessages(organizationId: string) {
  const today = new Date().toISOString().slice(5, 10)
  const birthdayClients = await db.query.clients.findMany({
    where: and(
      eq(clients.organizationId, organizationId),
      eq(clients.birthday, today),
    ),
  })

  return birthdayClients.length
}

export function buildReminderMessage(
  template: string,
  vars: Record<string, string>,
) {
  return renderTemplate(template, vars)
}
