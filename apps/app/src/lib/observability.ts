import * as Sentry from '@sentry/node'

let sentryReady = false

function initSentry() {
  if (sentryReady || !process.env.SENTRY_DSN) return
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV ?? 'development',
    tracesSampleRate: 0.1,
  })
  sentryReady = true
}

export function captureException(
  error: unknown,
  context?: Record<string, string>,
) {
  initSentry()
  if (process.env.SENTRY_DSN) {
    Sentry.captureException(error, { extra: context })
    return
  }
  console.error('[agenda-bem]', context, error)
}

export function captureMessage(
  message: string,
  context?: Record<string, string>,
) {
  initSentry()
  if (process.env.SENTRY_DSN) {
    Sentry.captureMessage(message, { extra: context })
    return
  }
  console.info('[agenda-bem]', context, message)
}
