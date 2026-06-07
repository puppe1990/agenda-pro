import { describe, expect, it } from 'vitest'

import {
  LANDING_FAQ,
  LANDING_FEATURES,
  LANDING_FOOTER_LINKS,
  LANDING_STATS,
  LANDING_STEPS,
  LANDING_TESTIMONIALS,
  WHATSAPP_BUTTONS,
  DEFAULT_APP_URL,
  getAppBaseUrl,
  getAppUrl,
  getDefaultWhatsAppPhone,
  getLandingFeatureIds,
  getLandingMeta,
  getWhatsAppLinks,
  getWhatsAppUrl,
} from '../../src/lib/landing-content'

describe('landing content', () => {
  it('exposes four product features', () => {
    expect(LANDING_FEATURES).toHaveLength(4)
    expect(getLandingFeatureIds()).toEqual([
      'agenda',
      'crm',
      'financeiro',
      'relatorios',
    ])
  })

  it('resolves app base url from env, dev fallback or production default', () => {
    expect(getAppBaseUrl('https://app.gestaobem.com')).toBe(
      'https://app.gestaobem.com',
    )
    expect(getAppBaseUrl(undefined, true)).toBe('http://localhost:3000')
    expect(getAppBaseUrl(undefined, false)).toBe(DEFAULT_APP_URL)
  })

  it('builds signup and login urls from app base url', () => {
    expect(getAppUrl('/signup', 'http://localhost:3000')).toBe(
      'http://localhost:3000/signup',
    )
    expect(getAppUrl('login', 'https://app.gestaobem.com/')).toBe(
      'https://app.gestaobem.com/login',
    )
  })

  it('defines landing page metadata', () => {
    expect(getLandingMeta()).toMatchObject({
      title: 'Gestão Bem',
      kicker: expect.stringContaining('salões'),
      headline: expect.stringContaining('Agenda'),
      ctaTitle: expect.stringContaining('organizar'),
    })
  })

  it('exposes stats, steps, testimonials and faq sections', () => {
    expect(LANDING_STATS.length).toBeGreaterThanOrEqual(3)
    expect(LANDING_STEPS).toHaveLength(3)
    expect(LANDING_TESTIMONIALS.length).toBeGreaterThanOrEqual(2)
    expect(LANDING_FAQ.length).toBeGreaterThanOrEqual(3)
    expect(LANDING_FOOTER_LINKS.length).toBeGreaterThanOrEqual(3)
  })

  it('builds whatsapp urls with encoded messages', () => {
    const url = getWhatsAppUrl('5511987654321', 'Olá! Quero testar.')
    expect(url).toBe(
      'https://wa.me/5511987654321?text=Ol%C3%A1%21+Quero+testar.',
    )
  })

  it('maps floating whatsapp buttons to links', () => {
    const links = getWhatsAppLinks('5511999999999')
    expect(links).toHaveLength(WHATSAPP_BUTTONS.length)
    expect(links[0]?.href).toContain('5511999999999')
    expect(links[0]?.label).toBe('Suporte')
    expect(links[1]?.label).toBe('Demonstração')
  })

  it('provides a default whatsapp phone fallback', () => {
    expect(getDefaultWhatsAppPhone()).toMatch(/^\d+$/)
  })
})
