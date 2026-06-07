import { describe, expect, it } from 'vitest'

import { buildWhatsAppUrl, renderTemplate } from '#/server/services/whatsapp'

describe('whatsapp service', () => {
  it('builds wa.me url with encoded message', () => {
    const url = buildWhatsAppUrl('11999998888', 'Olá {cliente}')
    expect(url).toContain('https://wa.me/5511999998888')
    expect(url).toContain(encodeURIComponent('Olá {cliente}'))
  })

  it('renders template variables', () => {
    const message = renderTemplate('Olá {cliente}, seu horário é {data}', {
      cliente: 'Ana',
      data: '10:00',
    })
    expect(message).toBe('Olá Ana, seu horário é 10:00')
  })
})
