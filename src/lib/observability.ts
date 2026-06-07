export function captureException(
  error: unknown,
  context?: Record<string, string>,
) {
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    console.error('[sentry]', context, error)
    return
  }
  console.error('[agenda-pro]', context, error)
}
