import { describe, expect, it } from 'vitest'

import { buildReceiptPdf } from '#/server/services/receipt-pdf'

describe('buildReceiptPdf', () => {
  it('generates a valid PDF payload', async () => {
    const pdfBase64 = await buildReceiptPdf({
      orgName: 'Studio Demo',
      description: 'Consulta',
      amountCents: 8000,
    })

    const bytes = Buffer.from(pdfBase64, 'base64')
    expect(bytes.subarray(0, 4).toString()).toBe('%PDF')
    expect(bytes.length).toBeGreaterThan(500)
  })
})
