import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { createId } from '#/lib/id'
import { db } from '#/server/db/client'
import * as schema from '#/server/db/schema'
import {
  getPresignedDownloadUrl,
  getServiceImageKey,
  isAllowedImageType,
} from '#/server/storage'

vi.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: vi.fn((_client, command) => {
    const bucket = 'gestao-bem-uploads'
    const region = 'sa-east-1'
    const key = (command as { input: { Key: string } }).input.Key
    return Promise.resolve(
      `https://${bucket}.s3.${region}.amazonaws.com/${key}?X-Amz-Signature=fakesig`,
    )
  }),
}))

let orgId: string
let serviceId: string

beforeAll(async () => {
  orgId = createId()
  serviceId = createId()
  const userId = createId()

  await db.insert(schema.users).values({
    id: userId,
    name: 'Test Upload User',
    email: `upload-${createId()}@example.com`,
    emailVerified: true,
  })
  await db.insert(schema.organizations).values({
    id: orgId,
    name: 'Org Upload Teste',
    publicSlug: `org-upload-${createId().slice(0, 8)}`,
  })
})

describe('services.imageKey — schema e DB', () => {
  it('persiste imageKey ao inserir um serviço', async () => {
    const imageKey = getServiceImageKey(orgId, serviceId, 'jpg')

    await db.insert(schema.services).values({
      id: serviceId,
      organizationId: orgId,
      name: 'Serviço com Foto',
      durationMinutes: 45,
      priceCents: 12000,
      imageKey,
    })

    const [saved] = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.id, serviceId))

    expect(saved.imageKey).toBe(imageKey)
    expect(saved.imageKey).toMatch(/^services\//)
  })

  it('permite imageKey nulo (serviço sem foto)', async () => {
    const id = createId()
    await db.insert(schema.services).values({
      id,
      organizationId: orgId,
      name: 'Serviço sem Foto',
      durationMinutes: 30,
      priceCents: 5000,
    })

    const [saved] = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.id, id))

    expect(saved.imageKey).toBeNull()
  })

  it('atualiza imageKey ao editar um serviço', async () => {
    const newKey = getServiceImageKey(orgId, serviceId, 'png')

    await db
      .update(schema.services)
      .set({ imageKey: newKey, updatedAt: new Date().toISOString() })
      .where(eq(schema.services.id, serviceId))

    const [updated] = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.id, serviceId))

    expect(updated.imageKey).toBe(newKey)
    expect(updated.imageKey).toMatch(/\.png$/)
  })
})

describe('validação de tipo de imagem na fn de upload', () => {
  it('aceita jpeg para upload', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true)
  })

  it('rejeita gif — não deve gerar URL de upload', () => {
    expect(isAllowedImageType('image/gif')).toBe(false)
  })

  it('rejeita content-type arbitrário', () => {
    expect(isAllowedImageType('text/html')).toBe(false)
  })
})

describe('getPresignedDownloadUrl', () => {
  it('gera uma URL presignada com https para uma key válida', async () => {
    const key = getServiceImageKey(orgId, serviceId, 'jpg')
    const url = await getPresignedDownloadUrl(key)

    expect(url).toMatch(/^https:\/\//)
    expect(url).toContain('gestao-bem-uploads')
    expect(url).toContain(key)
    expect(url).toContain('X-Amz-Signature')
  })
})
