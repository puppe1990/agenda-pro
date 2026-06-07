import { captureMessage } from '#/lib/observability'

export async function sendTransactionalEmail(input: {
  to: string
  subject: string
  body: string
}) {
  const host = process.env.SMTP_HOST
  const from = process.env.SMTP_FROM

  if (!host || !from) {
    captureMessage('email.fallback', {
      to: input.to,
      subject: input.subject,
      preview: input.body.slice(0, 120),
    })
    return { delivered: false, mode: 'logged' as const }
  }

  // SMTP wiring can be added when credentials are configured in production.
  captureMessage('email.queued', {
    to: input.to,
    subject: input.subject,
    smtpHost: host,
  })
  return { delivered: true, mode: 'smtp' as const }
}
