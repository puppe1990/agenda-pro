import { createServerFn } from '@tanstack/react-start'
import { getRequest } from '@tanstack/react-start/server'
import { and, desc, eq, like, or } from 'drizzle-orm'
import { z } from 'zod'

import { createId } from '#/lib/id'
import { assertPublicBookingRateLimit, resolveClientIp } from '#/lib/rate-limit'
import { captureException } from '#/lib/observability'
import { db } from '#/server/db/client'
import {
  extFromContentType,
  getPresignedDownloadUrl,
  getPresignedUploadUrl,
  getPublicUrl,
  getServiceImageKey,
  isAllowedImageType,
} from '#/server/storage'
import { readStorageEnv } from '#/lib/env'
import {
  anamnesisForms,
  anamnesisRecords,
  appointments,
  availabilityExceptions,
  availabilityRules,
  clients,
  clientNotes,
  expenses,
  financialGoals,
  messageTemplates,
  notificationQueue,
  organizationSettings,
  organizations,
  services,
  staffProfiles,
  transactions,
} from '#/server/db/schema'
import { seedDemoOrganization } from '#/server/db/seed'
import { assertRole, requireTenantContext } from '#/server/middleware/tenant'
import {
  cancelAppointment,
  createAppointment,
  markNoShow,
  rescheduleAppointment,
} from '#/server/services/appointments'
import { deleteClientData, exportClientData } from '#/server/services/lgpd'
import {
  calculateCommission,
  closeCashSession,
  generateReceipt,
  getFinancialSummary,
  openCashSession,
  recordExpense,
  recordTransaction,
  setFinancialGoal,
} from '#/server/services/finance'
import { createOrganizationForUser } from '#/server/services/onboarding'
import { generateSlots } from '#/server/services/slots'
import { buildWhatsAppUrl, renderTemplate } from '#/server/services/whatsapp'

async function tenantFromContext() {
  const request = getRequest()
  return requireTenantContext(request)
}

export const ensureOrganizationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      organizationName: z.string().min(2),
      userName: z.string().min(2),
      userId: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    return createOrganizationForUser(data)
  })

export const listServicesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    const rows = await db.query.services.findMany({
      where: eq(services.organizationId, ctx.organizationId),
      orderBy: [desc(services.createdAt)],
    })
    return Promise.all(
      rows.map(async (svc) => ({
        ...svc,
        imageUrl: svc.imageKey
          ? await getPresignedDownloadUrl(svc.imageKey)
          : null,
      })),
    )
  },
)

export const saveServiceFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      description: z.string().optional(),
      durationMinutes: z.number().int().positive(),
      priceCents: z.number().int().nonnegative(),
      staffProfileId: z.string().optional(),
      active: z.boolean().default(true),
      imageKey: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    if (data.id) {
      await db
        .update(services)
        .set({
          name: data.name,
          description: data.description,
          durationMinutes: data.durationMinutes,
          priceCents: data.priceCents,
          staffProfileId: data.staffProfileId,
          active: data.active,
          imageKey: data.imageKey,
          updatedAt: new Date().toISOString(),
        })
        .where(
          and(
            eq(services.id, data.id),
            eq(services.organizationId, ctx.organizationId),
          ),
        )
      return data.id
    }
    const id = createId()
    await db.insert(services).values({
      id,
      organizationId: ctx.organizationId,
      name: data.name,
      description: data.description,
      durationMinutes: data.durationMinutes,
      priceCents: data.priceCents,
      staffProfileId: data.staffProfileId,
      active: data.active,
      imageKey: data.imageKey,
    })
    return id
  })

export const getServiceImageUploadUrlFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      serviceId: z.string(),
      contentType: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()

    if (!isAllowedImageType(data.contentType)) {
      throw new Error(
        `Tipo de arquivo não permitido: ${data.contentType}. Use JPEG, PNG ou WebP.`,
      )
    }

    const env = readStorageEnv()
    const ext = extFromContentType(data.contentType)
    const imageKey = getServiceImageKey(ctx.organizationId, data.serviceId, ext)
    const uploadUrl = await getPresignedUploadUrl(imageKey, data.contentType)
    const publicUrl = getPublicUrl(imageKey, env.AWS_S3_BUCKET, env.AWS_REGION)

    return { uploadUrl, imageKey, publicUrl }
  })

export const listClientsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ q: z.string().optional() }).optional())
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    const rows = await db.query.clients.findMany({
      where: data?.q
        ? and(
            eq(clients.organizationId, ctx.organizationId),
            or(
              like(clients.name, `%${data.q}%`),
              like(clients.phone, `%${data.q}%`),
            ),
          )
        : eq(clients.organizationId, ctx.organizationId),
      orderBy: [desc(clients.createdAt)],
    })
    return rows
  })

export const saveClientFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      email: z.string().email().optional().or(z.literal('')),
      phone: z.string().optional(),
      birthday: z.string().optional(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    if (data.id) {
      await db
        .update(clients)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(clients.id, data.id),
            eq(clients.organizationId, ctx.organizationId),
          ),
        )
      return data.id
    }
    const id = createId()
    await db.insert(clients).values({
      id,
      organizationId: ctx.organizationId,
      name: data.name,
      email: data.email || null,
      phone: data.phone,
      birthday: data.birthday,
      notes: data.notes,
    })
    return id
  })

export const listAppointmentsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.appointments.findMany({
      where: eq(appointments.organizationId, ctx.organizationId),
      orderBy: [desc(appointments.startsAt)],
    })
  },
)

export const createAppointmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      staffProfileId: z.string(),
      clientId: z.string(),
      serviceId: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
      notes: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    return createAppointment({
      organizationId: ctx.organizationId,
      ...data,
    })
  })

export const rescheduleAppointmentFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      appointmentId: z.string(),
      startsAt: z.string(),
      endsAt: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    await rescheduleAppointment({
      organizationId: ctx.organizationId,
      ...data,
    })
  })

export const markNoShowFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    await markNoShow({
      organizationId: ctx.organizationId,
      appointmentId: data.appointmentId,
      penaltyCents: ctx.organization.noShowPenaltyCents,
    })
  })

export const cancelAppointmentFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ appointmentId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    await cancelAppointment({
      organizationId: ctx.organizationId,
      appointmentId: data.appointmentId,
    })
  })

export const listStaffFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.staffProfiles.findMany({
      where: eq(staffProfiles.organizationId, ctx.organizationId),
    })
  },
)

export const saveStaffFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string(),
      displayName: z.string().min(1),
      commissionPercent: z.number().int().min(0).max(100),
      active: z.boolean(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    assertRole(ctx, ['owner', 'admin'])
    await db
      .update(staffProfiles)
      .set({
        displayName: data.displayName,
        commissionPercent: data.commissionPercent,
        active: data.active,
        updatedAt: new Date().toISOString(),
      })
      .where(
        and(
          eq(staffProfiles.id, data.id),
          eq(staffProfiles.organizationId, ctx.organizationId),
        ),
      )
  })

export const listTransactionsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.transactions.findMany({
      where: eq(transactions.organizationId, ctx.organizationId),
      orderBy: [desc(transactions.createdAt)],
    })
  },
)

export const saveTransactionFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      description: z.string().min(1),
      amountCents: z.number().int().positive(),
      appointmentId: z.string().optional(),
      staffProfileId: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    assertRole(ctx, ['owner', 'admin', 'receptionist'])
    const id = await recordTransaction({
      organizationId: ctx.organizationId,
      description: data.description,
      amountCents: data.amountCents,
      appointmentId: data.appointmentId,
    })
    if (data.staffProfileId) {
      await calculateCommission({
        organizationId: ctx.organizationId,
        staffProfileId: data.staffProfileId,
        transactionId: id,
        amountCents: data.amountCents,
      })
    }
    return id
  })

export const listExpensesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.expenses.findMany({
      where: eq(expenses.organizationId, ctx.organizationId),
      orderBy: [desc(expenses.expenseDate)],
    })
  },
)

export const saveExpenseFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      description: z.string().min(1),
      amountCents: z.number().int().positive(),
      category: z.string().min(1),
      type: z.enum(['fixed', 'variable']),
      recurring: z.boolean().optional(),
      expenseDate: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    assertRole(ctx, ['owner', 'admin'])
    return recordExpense({
      organizationId: ctx.organizationId,
      ...data,
    })
  })

export const financialSummaryFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    const now = new Date()
    const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const to = now.toISOString()
    return getFinancialSummary(ctx.organizationId, from, to)
  },
)

export const setGoalFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      year: z.number().int(),
      month: z.number().int().min(1).max(12),
      targetRevenueCents: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    return setFinancialGoal({
      organizationId: ctx.organizationId,
      ...data,
    })
  })

export const openCashFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ openingBalanceCents: z.number().int() }))
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    return openCashSession({
      organizationId: ctx.organizationId,
      openingBalanceCents: data.openingBalanceCents,
    })
  })

export const closeCashFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      sessionId: z.string(),
      closingBalanceCents: z.number().int(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    await closeCashSession({
      organizationId: ctx.organizationId,
      ...data,
    })
  })

export const listTemplatesFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.messageTemplates.findMany({
      where: eq(messageTemplates.organizationId, ctx.organizationId),
    })
  },
)

export const saveTemplateFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      type: z.enum(['reminder', 'confirmation', 'birthday', 'custom']),
      name: z.string().min(1),
      body: z.string().min(1),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    if (data.id) {
      await db
        .update(messageTemplates)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(messageTemplates.id, data.id),
            eq(messageTemplates.organizationId, ctx.organizationId),
          ),
        )
      return data.id
    }
    const id = createId()
    await db.insert(messageTemplates).values({
      id,
      organizationId: ctx.organizationId,
      type: data.type,
      name: data.name,
      body: data.body,
    })
    return id
  })

export const listQueueFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.notificationQueue.findMany({
      where: eq(notificationQueue.organizationId, ctx.organizationId),
      orderBy: [desc(notificationQueue.scheduledAt)],
    })
  },
)

export const enqueueNotificationFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string().optional(),
      phone: z.string(),
      message: z.string().min(1),
      scheduledAt: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    const id = createId()
    await db.insert(notificationQueue).values({
      id,
      organizationId: ctx.organizationId,
      clientId: data.clientId,
      phone: data.phone,
      message: data.message,
      scheduledAt: data.scheduledAt,
      channel: 'whatsapp',
      status: 'pending',
    })
    return { id, whatsappUrl: buildWhatsAppUrl(data.phone, data.message) }
  })

export const listAnamnesisFormsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.anamnesisForms.findMany({
      where: eq(anamnesisForms.organizationId, ctx.organizationId),
    })
  },
)

export const saveAnamnesisFormFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      id: z.string().optional(),
      name: z.string().min(1),
      fieldsJson: z.string().min(2),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    if (data.id) {
      await db
        .update(anamnesisForms)
        .set({ ...data, updatedAt: new Date().toISOString() })
        .where(
          and(
            eq(anamnesisForms.id, data.id),
            eq(anamnesisForms.organizationId, ctx.organizationId),
          ),
        )
      return data.id
    }
    const id = createId()
    await db.insert(anamnesisForms).values({
      id,
      organizationId: ctx.organizationId,
      name: data.name,
      fieldsJson: data.fieldsJson,
    })
    return id
  })

export const saveAnamnesisRecordFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      clientId: z.string(),
      formId: z.string(),
      responsesJson: z.string().min(2),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    const id = createId()
    await db.insert(anamnesisRecords).values({
      id,
      organizationId: ctx.organizationId,
      clientId: data.clientId,
      formId: data.formId,
      responsesJson: data.responsesJson,
    })
    return id
  })

export const listAnamnesisRecordsFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    return db.query.anamnesisRecords.findMany({
      where: and(
        eq(anamnesisRecords.organizationId, ctx.organizationId),
        eq(anamnesisRecords.clientId, data.clientId),
      ),
      orderBy: [desc(anamnesisRecords.recordedAt)],
    })
  })

export const listRecentAnamnesisRecordsFn = createServerFn({
  method: 'GET',
}).handler(async () => {
  const ctx = await tenantFromContext()
  return db.query.anamnesisRecords.findMany({
    where: eq(anamnesisRecords.organizationId, ctx.organizationId),
    orderBy: [desc(anamnesisRecords.recordedAt)],
    limit: 50,
  })
})

export const addClientNoteFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({ clientId: z.string(), content: z.string().min(1) }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    const id = createId()
    await db.insert(clientNotes).values({
      id,
      organizationId: ctx.organizationId,
      clientId: data.clientId,
      content: data.content,
    })
    return id
  })

export const generateReceiptFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      transactionId: z.string(),
      description: z.string(),
      amountCents: z.number().int().positive(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    return generateReceipt({
      organizationId: ctx.organizationId,
      transactionId: data.transactionId,
      orgName: ctx.organization.name,
      amountCents: data.amountCents,
      description: data.description,
      logoUrl: ctx.organization.logoUrl,
    })
  })

export const getBookingDataFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ slug: z.string() }))
  .handler(async ({ data }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.publicSlug, data.slug),
    })
    if (!org) throw new Error('NOT_FOUND')

    const orgServicesRaw = await db.query.services.findMany({
      where: and(
        eq(services.organizationId, org.id),
        eq(services.active, true),
      ),
    })
    const orgServices = await Promise.all(
      orgServicesRaw.map(async (svc) => ({
        ...svc,
        imageUrl: svc.imageKey
          ? await getPresignedDownloadUrl(svc.imageKey)
          : null,
      })),
    )
    const staff = await db.query.staffProfiles.findMany({
      where: and(
        eq(staffProfiles.organizationId, org.id),
        eq(staffProfiles.active, true),
      ),
    })
    return { org, services: orgServices, staff }
  })

export const getPublicSlotsFn = createServerFn({ method: 'GET' })
  .inputValidator(
    z.object({
      slug: z.string(),
      staffProfileId: z.string(),
      serviceId: z.string(),
      date: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.publicSlug, data.slug),
    })
    if (!org) throw new Error('NOT_FOUND')

    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, data.serviceId),
        eq(services.organizationId, org.id),
      ),
    })
    if (!service) throw new Error('NOT_FOUND')

    const rules = await db.query.availabilityRules.findMany({
      where: and(
        eq(availabilityRules.organizationId, org.id),
        eq(availabilityRules.staffProfileId, data.staffProfileId),
      ),
    })

    const booked = await db.query.appointments.findMany({
      where: and(
        eq(appointments.organizationId, org.id),
        eq(appointments.staffProfileId, data.staffProfileId),
      ),
    })

    return generateSlots({
      date: data.date,
      durationMinutes: service.durationMinutes,
      rules,
      bookedRanges: booked
        .filter((item) => item.status !== 'cancelled')
        .map((item) => ({
          startsAt: item.startsAt,
          endsAt: item.endsAt,
        })),
    })
  })

export const publicBookFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      slug: z.string(),
      staffProfileId: z.string(),
      serviceId: z.string(),
      name: z.string().min(1),
      phone: z.string().min(8),
      email: z.string().email().optional(),
      date: z.string(),
      time: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    try {
      const request = getRequest()
      const ip = resolveClientIp(request.headers)
      await assertPublicBookingRateLimit(`public-book:${data.slug}:${ip}`)
    } catch (error) {
      if (error instanceof Error && error.message === 'RATE_LIMITED') {
        throw error
      }
      captureException(error, { scope: 'publicBookFn.rateLimit' })
    }

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.publicSlug, data.slug),
    })
    if (!org) throw new Error('NOT_FOUND')

    const settings = await db.query.organizationSettings.findFirst({
      where: eq(organizationSettings.organizationId, org.id),
    })
    if (settings && !settings.bookingEnabled) {
      throw new Error('BOOKING_DISABLED')
    }

    const service = await db.query.services.findFirst({
      where: and(
        eq(services.id, data.serviceId),
        eq(services.organizationId, org.id),
      ),
    })
    if (!service) throw new Error('NOT_FOUND')

    let client = await db.query.clients.findFirst({
      where: and(
        eq(clients.organizationId, org.id),
        eq(clients.phone, data.phone),
      ),
    })

    if (!client) {
      const clientId = createId()
      await db.insert(clients).values({
        id: clientId,
        organizationId: org.id,
        name: data.name,
        phone: data.phone,
        email: data.email,
      })
      client = await db.query.clients.findFirst({
        where: eq(clients.id, clientId),
      })
    }

    if (!client) throw new Error('CLIENT_ERROR')

    const startsAt = new Date(`${data.date}T${data.time}:00`).toISOString()
    const endsAt = new Date(
      new Date(startsAt).getTime() + service.durationMinutes * 60_000,
    ).toISOString()

    const appointmentId = await createAppointment({
      organizationId: org.id,
      staffProfileId: data.staffProfileId,
      clientId: client.id,
      serviceId: data.serviceId,
      startsAt,
      endsAt,
    })

    const template = await db.query.messageTemplates.findFirst({
      where: and(
        eq(messageTemplates.organizationId, org.id),
        eq(messageTemplates.type, 'confirmation'),
      ),
    })

    const message = template
      ? renderTemplate(template.body, {
          cliente: client.name,
          data: `${data.date} ${data.time}`,
          servico: service.name,
        })
      : `Olá ${client.name}, seu agendamento de ${service.name} foi confirmado para ${data.date} às ${data.time}.`

    if (client.phone) {
      await db.insert(notificationQueue).values({
        id: createId(),
        organizationId: org.id,
        clientId: client.id,
        phone: client.phone,
        message,
        scheduledAt: new Date().toISOString(),
        channel: 'whatsapp',
        status: 'pending',
      })
    }

    return { appointmentId, whatsappUrl: buildWhatsAppUrl(data.phone, message) }
  })

export const saveAvailabilityFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      staffProfileId: z.string(),
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string(),
      endTime: z.string(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    const id = createId()
    await db.insert(availabilityRules).values({
      id,
      organizationId: ctx.organizationId,
      staffProfileId: data.staffProfileId,
      dayOfWeek: data.dayOfWeek,
      startTime: data.startTime,
      endTime: data.endTime,
    })
    return id
  })

export const listAvailabilityFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.availabilityRules.findMany({
      where: eq(availabilityRules.organizationId, ctx.organizationId),
    })
  },
)

export const blockAvailabilityFn = createServerFn({ method: 'POST' })
  .inputValidator(
    z.object({
      staffProfileId: z.string(),
      date: z.string(),
      reason: z.string().optional(),
    }),
  )
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    const id = createId()
    await db.insert(availabilityExceptions).values({
      id,
      organizationId: ctx.organizationId,
      staffProfileId: data.staffProfileId,
      date: data.date,
      isBlocked: true,
      reason: data.reason,
    })
    return id
  })

export const listGoalsFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    return db.query.financialGoals.findMany({
      where: eq(financialGoals.organizationId, ctx.organizationId),
    })
  },
)

export const exportClientDataFn = createServerFn({ method: 'GET' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    assertRole(ctx, ['owner', 'admin'])
    return exportClientData(ctx.organizationId, data.clientId)
  })

export const deleteClientDataFn = createServerFn({ method: 'POST' })
  .inputValidator(z.object({ clientId: z.string() }))
  .handler(async ({ data }) => {
    const ctx = await tenantFromContext()
    assertRole(ctx, ['owner', 'admin'])
    return deleteClientData(ctx.organizationId, data.clientId)
  })

export const getPublicBookingLinkFn = createServerFn({ method: 'GET' }).handler(
  async () => {
    const ctx = await tenantFromContext()
    const settings = await db.query.organizationSettings.findFirst({
      where: eq(organizationSettings.organizationId, ctx.organizationId),
    })
    const bookingPath = `/book/${ctx.organization.publicSlug}`

    return {
      organizationName: ctx.organization.name,
      publicSlug: ctx.organization.publicSlug,
      bookingPath,
      bookingEnabled: settings?.bookingEnabled ?? true,
    }
  },
)

export const seedDemoFn = createServerFn({ method: 'POST' }).handler(
  async () => {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FORBIDDEN')
    }
    const orgId = await seedDemoOrganization()
    return { orgId, bookingPath: '/book/studio-demo' }
  },
)
