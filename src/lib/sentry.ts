import * as Sentry from '@sentry/react'

function readSampleRate(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, 0), 1)
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? import.meta.env.MODE,
    tracesSampleRate: readSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined, 0.1),
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event) {
      if (event.request?.headers) {
        delete event.request.headers.Authorization
        delete event.request.headers.Cookie
      }
      return event
    },
  })
}

export function setSentryUser(user?: { id?: string; email?: string; role?: string } | null) {
  if (!user?.id) {
    Sentry.setUser(null)
    return
  }
  Sentry.setUser({ id: user.id, email: user.email, role: user.role })
}

export { Sentry }
