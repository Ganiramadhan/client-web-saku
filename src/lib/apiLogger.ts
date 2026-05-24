import type { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios'

const enabled =
  import.meta.env.VITE_API_LOGGER === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_API_LOGGER !== 'false')

const startedAt = new WeakMap<AxiosRequestConfig, number>()

export function markApiRequest(config: AxiosRequestConfig) {
  if (!enabled) return
  startedAt.set(config, performance.now())
  console.info('[api:req]', {
    method: config.method?.toUpperCase(),
    url: config.url,
    params: config.params,
    data: maskSensitive(config.data),
  })
}

export function logApiResponse(response: AxiosResponse) {
  if (!enabled) return
  const durationMs = getDuration(response.config)
  console.info('[api:res]', {
    method: response.config.method?.toUpperCase(),
    url: response.config.url,
    status: response.status,
    durationMs,
    data: maskSensitive(response.data),
  })
}

export function logApiError(error: AxiosError) {
  if (!enabled) return
  const durationMs = error.config ? getDuration(error.config) : undefined
  console.error('[api:err]', {
    method: error.config?.method?.toUpperCase(),
    url: error.config?.url,
    status: error.response?.status,
    durationMs,
    message: error.message,
    data: maskSensitive(error.response?.data),
  })
}

function getDuration(config: AxiosRequestConfig) {
  const started = startedAt.get(config)
  return started ? Math.round(performance.now() - started) : undefined
}

function maskSensitive(value: unknown): unknown {
  if (!value || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(maskSensitive)

  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    if (/password|token|authorization|secret|otp|image_base64|base64/i.test(key)) {
      out[key] = '[redacted]'
    }
    else out[key] = maskSensitive(item)
  }
  return out
}
