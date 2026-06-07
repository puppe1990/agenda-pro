import { describe, expect, it } from 'vitest'

import {
  ALLOWED_IMAGE_TYPES,
  getPublicUrl,
  getServiceImageKey,
  isAllowedImageType,
} from '#/server/storage'

describe('getServiceImageKey', () => {
  it('retorna o formato services/{orgId}/{serviceId}.{ext}', () => {
    const key = getServiceImageKey('org-123', 'svc-456', 'jpg')
    expect(key).toBe('services/org-123/svc-456.jpg')
  })

  it('normaliza extensão para minúsculas', () => {
    const key = getServiceImageKey('org-1', 'svc-1', 'JPG')
    expect(key).toMatch(/\.jpg$/)
  })

  it('funciona com extensão png', () => {
    const key = getServiceImageKey('org-1', 'svc-1', 'png')
    expect(key).toBe('services/org-1/svc-1.png')
  })

  it('funciona com extensão webp', () => {
    const key = getServiceImageKey('org-1', 'svc-1', 'WEBP')
    expect(key).toBe('services/org-1/svc-1.webp')
  })
})

describe('getPublicUrl', () => {
  it('retorna uma URL https válida com bucket e região', () => {
    const url = getPublicUrl(
      'services/org-1/svc-1.jpg',
      'my-bucket',
      'sa-east-1',
    )
    expect(url).toBe(
      'https://my-bucket.s3.sa-east-1.amazonaws.com/services/org-1/svc-1.jpg',
    )
  })

  it('inclui o key na URL', () => {
    const key = 'services/abc/def.png'
    const url = getPublicUrl(key, 'bucket', 'us-east-1')
    expect(url).toContain(key)
  })
})

describe('ALLOWED_IMAGE_TYPES', () => {
  it('contém image/jpeg', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg')
  })

  it('contém image/png', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/png')
  })

  it('contém image/webp', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/webp')
  })
})

describe('isAllowedImageType', () => {
  it('aceita image/jpeg', () => {
    expect(isAllowedImageType('image/jpeg')).toBe(true)
  })

  it('aceita image/png', () => {
    expect(isAllowedImageType('image/png')).toBe(true)
  })

  it('aceita image/webp', () => {
    expect(isAllowedImageType('image/webp')).toBe(true)
  })

  it('rejeita image/gif', () => {
    expect(isAllowedImageType('image/gif')).toBe(false)
  })

  it('rejeita application/pdf', () => {
    expect(isAllowedImageType('application/pdf')).toBe(false)
  })

  it('rejeita string vazia', () => {
    expect(isAllowedImageType('')).toBe(false)
  })
})
