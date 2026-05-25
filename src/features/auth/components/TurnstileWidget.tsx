import { useEffect, useRef, useState } from 'react'
import { useLocale } from '@/i18n'

const SITE_KEY = (import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined) ?? ''
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
let scriptPromise: Promise<void> | null = null

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

export function isTurnstileEnabled() {
  return Boolean(SITE_KEY)
}

export function preloadTurnstileScript() {
  if (!SITE_KEY) return Promise.resolve()
  if (window.turnstile) return Promise.resolve()
  if (scriptPromise) return scriptPromise

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener('error', () => reject(new Error('Turnstile script failed to load')), { once: true })
      return
    }
    const script = document.createElement('script')
    script.src = SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Turnstile script failed to load'))
    document.head.appendChild(script)
  })

  return scriptPromise
}

export function TurnstileWidget({ onVerify }: { onVerify: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const { locale } = useLocale()

  useEffect(() => {
    if (!SITE_KEY) return
    let cancelled = false
    preloadTurnstileScript()
      .then(() => {
        if (!cancelled) setLoaded(true)
      })
      .catch(() => {
        if (!cancelled) setLoaded(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!SITE_KEY || !loaded || !ref.current || !window.turnstile || widgetIdRef.current) return
    widgetIdRef.current = window.turnstile.render(ref.current, {
      sitekey: SITE_KEY,
      theme: 'light',
      language: locale === 'id' ? 'id' : 'en',
      callback: (token: string) => onVerify(token),
      'expired-callback': () => onVerify(''),
      'error-callback': () => onVerify(''),
    })
    return () => {
      if (widgetIdRef.current) window.turnstile?.remove(widgetIdRef.current)
      widgetIdRef.current = null
    }
  }, [loaded, locale, onVerify])

  if (!SITE_KEY) return null
  return <div ref={ref} className="min-h-[65px] overflow-hidden rounded-xl" />
}
