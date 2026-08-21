import * as Sentry from '@sentry/react'

function readSampleRate(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(Math.max(parsed, 0), 1)
}

// Third-party / non-actionable noise we don't want polluting the project:
// - Google Identity Services (GSI) injects its own script (/gsi/client) that
//   can throw unrelated to our code (e.g. "a.R is not a function") when the
//   user's browser extensions or ad blockers interfere with it.
// - Local dev machines sometimes point at the production DSN by mistake
//   (VITE_SENTRY_DSN left set in a local .env); filter those out so local
//   noise doesn't look like a production incident.
const IGNORED_ERROR_MESSAGES = [/a\.R is not a function/i, /gsi\/client/i]

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined
  if (!dsn) return

  Sentry.init({
    dsn,
    environment: (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ?? import.meta.env.MODE,
    tracesSampleRate: readSampleRate(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE as string | undefined, 0.1),
    integrations: [Sentry.browserTracingIntegration()],
    beforeSend(event, hint) {
      if (typeof window !== 'undefined' && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
        return null
      }

      const error = hint?.originalException
      const message = error instanceof Error ? error.message : String(event.message ?? '')
      if (IGNORED_ERROR_MESSAGES.some((pattern) => pattern.test(message))) {
        return null
      }

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
