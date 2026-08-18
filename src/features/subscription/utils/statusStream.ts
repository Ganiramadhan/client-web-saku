import { useAuthStore } from '@/stores/authStore'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'
const MAX_RECONNECT_ATTEMPTS = 5

export interface StreamHandle {
  close: () => void
}


export function streamOrderStatus<T>(
  orderId: string,
  onEvent: (data: T) => void,
  onError?: () => void,
): StreamHandle {
  let closed = false
  let controller: AbortController | null = null
  let attempt = 0
  let retryTimer: number | null = null

  const connect = () => {
    if (closed) return
    controller = new AbortController()

    void (async () => {
      try {
        const token = useAuthStore.getState().token
        const res = await fetch(`${API_BASE}/subscriptions/orders/${encodeURIComponent(orderId)}/stream`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          credentials: 'include',
          signal: controller!.signal,
        })
        if (!res.ok || !res.body) throw new Error(`stream failed: ${res.status}`)

        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        for (;;) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          let sep: number
          while ((sep = buffer.indexOf('\n\n')) >= 0) {
            const rawEvent = buffer.slice(0, sep)
            buffer = buffer.slice(sep + 2)
            const dataLines = rawEvent
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trimStart())
            if (dataLines.length === 0) continue // heartbeat comment line (": ping"), nothing to parse
            attempt = 0
            try {
              onEvent(JSON.parse(dataLines.join('\n')) as T)
            } catch {
              // Malformed frame — ignore and keep reading.
            }
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') return
      }

      if (closed) return
      attempt += 1
      if (attempt > MAX_RECONNECT_ATTEMPTS) {
        onError?.()
        return
      }
      retryTimer = window.setTimeout(connect, Math.min(1000 * attempt, 5000))
    })()
  }

  connect()

  return {
    close: () => {
      closed = true
      if (retryTimer !== null) window.clearTimeout(retryTimer)
      controller?.abort()
    },
  }
}
