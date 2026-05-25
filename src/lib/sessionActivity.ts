import { useAuthStore } from '@/stores/authStore'

const IDLE_TIMEOUT_MS = 30 * 60 * 1000
const ACTIVITY_THROTTLE_MS = 30 * 1000
const ACTIVITY_EVENTS = ['click', 'keydown', 'pointerdown', 'scroll', 'touchstart', 'visibilitychange']

let lastTouch = 0

export function initSessionActivity() {
  const touch = () => {
    const now = Date.now()
    if (now - lastTouch < ACTIVITY_THROTTLE_MS) return
    lastTouch = now
    useAuthStore.getState().touch()
  }

  const checkIdle = () => {
    const { token, remember, lastActivityAt, clear } = useAuthStore.getState()
    if (!token || remember || !lastActivityAt) return
    if (Date.now() - lastActivityAt >= IDLE_TIMEOUT_MS) {
      clear()
      if (window.location.pathname.startsWith('/app') || window.location.pathname.startsWith('/admin')) {
        window.location.assign('/login')
      }
    }
  }

  ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, touch, { passive: true }))
  const timer = window.setInterval(checkIdle, 60 * 1000)
  touch()

  return () => {
    ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, touch))
    window.clearInterval(timer)
  }
}
