import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

export async function buildReceiptPdf(input: {
  orgName: string
  description: string
  amountCents: number
  logoUrl?: string | null
}) {
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([595, 842])
  const { height } = page.getSize()
  let y = height - 72

  page.drawText('Recibo', {
    x: 48,
    y,
    size: 22,
    font: bold,
    color: rgb(0.1, 0.2, 0.25),
  })
  y -= 28

  page.drawText(input.orgName, { x: 48, y, size: 14, font: bold })
  y -= 24
  page.drawText(input.description, { x: 48, y, size: 12, font })
  y -= 20
  page.drawText(`Valor: R$ ${(input.amountCents / 100).toFixed(2)}`, {
    x: 48,
    y,
    size: 12,
    font: bold,
  })
  y -= 20
  page.drawText(`Emitido em ${new Date().toLocaleString('pt-BR')}`, {
    x: 48,
    y,
    size: 10,
    font,
    color: rgb(0.35, 0.35, 0.35),
  })

  if (input.logoUrl) {
    page.drawText(`Logo: ${input.logoUrl}`, {
      x: 48,
      y: y - 18,
      size: 8,
      font,
      color: rgb(0.5, 0.5, 0.5),
    })
  }

  const bytes = await doc.save()
  return Buffer.from(bytes).toString('base64')
}
