import { useAuthStore } from '@/stores/authStore'

type AnalyticsValue = string | number | boolean | null | undefined
export type AnalyticsParams = Record<string, AnalyticsValue>

type GtagCommand = 'js' | 'config' | 'event' | 'set'
type GtagFn = (command: GtagCommand, target: string | Date | Record<string, unknown>, params?: Record<string, unknown>) => void
type ClarityFn = (command: string, ...args: unknown[]) => void

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: GtagFn
    clarity?: ClarityFn & { q?: unknown[] }
  }
}

const GA_MEASUREMENT_ID = String(import.meta.env.VITE_GA_MEASUREMENT_ID ?? '').trim()
const CLARITY_PROJECT_ID = String(import.meta.env.VITE_CLARITY_PROJECT_ID ?? '').trim()
const ANALYTICS_ENABLED = resolveAnalyticsEnabled()
const ATTRIBUTION_KEY = 'saku_attribution'
export const ANALYTICS_CONSENT_KEY = 'saku_cookie_consent'

let initialized = false
let lastPageView = ''
let lastIdentifiedUserId = ''

export type AnalyticsConsentChoice = 'accepted' | 'analytics_rejected'

export const analyticsEvents = {
  landingPageViewed: 'landing_page_viewed',
  pricingViewed: 'pricing_viewed',
  registerStarted: 'register_started',
  registerSuccess: 'register_success',
  loginSuccess: 'login_success',
  emailVerificationSuccess: 'email_verification_success',
  productSelected: 'product_selected',
  voucherApplied: 'voucher_applied',
  checkoutStarted: 'checkout_started',
  paymentSuccess: 'payment_success',
  paymentFailed: 'payment_failed',
  subscriptionActivated: 'subscription_activated',
  aiChatUsed: 'ai_chat_used',
  receiptScanUsed: 'receipt_scan_used',
  budgetCreated: 'budget_created',
  walletCreated: 'wallet_created',
  recurringTransactionCreated: 'recurring_transaction_created',
  splitBillCreated: 'split_bill_created',
} as const

export function initAnalytics() {
  if (!canUseBrowser()) return
  captureAttribution()
  if (initialized || !ANALYTICS_ENABLED || !isAnalyticsAllowed()) return
  initialized = true

  if (GA_MEASUREMENT_ID) {
    setGoogleAnalyticsDisabled(false)
    window.dataLayer = window.dataLayer ?? []
    window.gtag = window.gtag ?? function gtag() {
      window.dataLayer?.push(arguments)
    }
    window.gtag('js', new Date())
    window.gtag('config', GA_MEASUREMENT_ID, {
      send_page_view: false,
      anonymize_ip: true,
    })
    loadScript(`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`, 'saku-ga4')
  }

  if (CLARITY_PROJECT_ID) {
    window.clarity = window.clarity ?? function clarity() {
      ;(window.clarity!.q = window.clarity!.q ?? []).push(arguments)
    }
    loadScript(`https://www.clarity.ms/tag/${encodeURIComponent(CLARITY_PROJECT_ID)}`, 'saku-clarity')
  }
}

export function getAnalyticsConsentChoice(): AnalyticsConsentChoice | null {
  if (!canUseBrowser()) return null
  const value = window.localStorage.getItem(ANALYTICS_CONSENT_KEY)
  return value === 'accepted' || value === 'analytics_rejected' ? value : null
}

export function hasAnalyticsConsentChoice(): boolean {
  return Boolean(getAnalyticsConsentChoice())
}

export function setAnalyticsConsentChoice(choice: AnalyticsConsentChoice) {
  if (!canUseBrowser()) return
  window.localStorage.setItem(ANALYTICS_CONSENT_KEY, choice)
  if (choice === 'accepted') {
    initAnalytics()
    trackPageView(`${window.location.pathname}${window.location.search}`, document.title)
    return
  }
  disableAnalytics()
}

export function isAnalyticsAllowed(): boolean {
  return getAnalyticsConsentChoice() === 'accepted'
}

export function disableAnalytics() {
  if (!canUseBrowser()) return
  initialized = false
  setGoogleAnalyticsDisabled(true)
  document.getElementById('saku-ga4')?.remove()
  document.getElementById('saku-clarity')?.remove()
  window.dataLayer = []
  window.gtag = undefined
  window.clarity = undefined
}

export function trackPageView(path: string, title = document.title) {
  if (!canUseBrowser()) return
  initAnalytics()
  captureAttribution()
  if (!isAnalyticsAllowed()) return

  const pagePath = path || `${window.location.pathname}${window.location.search}`
  if (pagePath === lastPageView) return
  lastPageView = pagePath

  const params = withDefaultParams({
    page_title: title,
    page_location: window.location.href,
    page_path: pagePath,
  })

  safeGtag('event', 'page_view', params)
  safeClarity('set', 'page_path', pagePath)
}

export function trackEvent(name: string, params: AnalyticsParams = {}) {
  if (!canUseBrowser()) return
  initAnalytics()
  captureAttribution()
  if (!isAnalyticsAllowed()) return
  const cleanParams = withDefaultParams(params)
  safeGtag('event', name, cleanParams)
  safeClarity('event', name)
}

export function identifyAnalyticsUser(userId?: string | null, role?: string | null) {
  if (!canUseBrowser()) return
  initAnalytics()
  const safeUserId = String(sanitizeAnalyticsValue(userId) ?? '')
  if (!safeUserId || safeUserId === lastIdentifiedUserId) return
  lastIdentifiedUserId = safeUserId

  safeGtag('set', 'user_properties', {
    user_id: safeUserId,
    role: sanitizeAnalyticsValue(role),
  })
  if (GA_MEASUREMENT_ID) {
    safeGtag('config', GA_MEASUREMENT_ID, { user_id: safeUserId })
  }
  safeClarity('identify', safeUserId)
  if (role) safeClarity('set', 'role', sanitizeAnalyticsValue(role))
}

export function trackFeatureUsage(featureName: string, params: AnalyticsParams = {}) {
  trackEvent(`${featureName}_used`, { feature_name: featureName, ...params })
}

function withDefaultParams(params: AnalyticsParams): Record<string, unknown> {
  const user = useAuthStore.getState().user
  return sanitizeParams({
    ...readAttribution(),
    user_id: user?.id,
    user_role: user?.role,
    ...params,
  })
}

function captureAttribution() {
  if (!canUseBrowser()) return
  const url = new URL(window.location.href)
  const known = readAttribution()
  const next = {
    utm_source: url.searchParams.get('utm_source') || known.utm_source,
    utm_medium: url.searchParams.get('utm_medium') || known.utm_medium,
    utm_campaign: url.searchParams.get('utm_campaign') || known.utm_campaign,
    utm_content: url.searchParams.get('utm_content') || known.utm_content,
    utm_term: url.searchParams.get('utm_term') || known.utm_term,
    referrer: document.referrer || known.referrer,
  }
  const sourceCampaign = [next.utm_source, next.utm_medium, next.utm_campaign].filter(Boolean).join(' / ')
  try {
    window.sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify({
      ...next,
      source_campaign: sourceCampaign || known.source_campaign || 'direct',
    }))
  } catch {
    // Ignore storage failures. Analytics must never block the app.
  }
}

function readAttribution(): AnalyticsParams {
  if (!canUseBrowser()) return {}
  try {
    const parsed = JSON.parse(window.sessionStorage.getItem(ATTRIBUTION_KEY) || '{}') as AnalyticsParams
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function sanitizeParams(params: AnalyticsParams): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(params)
      .map(([key, value]) => [key, sanitizeAnalyticsValue(value)] as const)
      .filter(([, value]) => value !== undefined && value !== ''),
  )
}

function sanitizeAnalyticsValue(value: AnalyticsValue) {
  if (value === null || value === undefined) return undefined
  if (typeof value === 'string') return value.slice(0, 120)
  return value
}

function safeGtag(command: GtagCommand, target: string | Date | Record<string, unknown>, params?: Record<string, unknown>) {
  try {
    if (!isAnalyticsAllowed() || !GA_MEASUREMENT_ID || !window.gtag) return
    window.gtag(command, target, params)
  } catch {
    // Analytics failures are intentionally ignored.
  }
}

function safeClarity(command: string, ...args: unknown[]) {
  try {
    if (!isAnalyticsAllowed() || !CLARITY_PROJECT_ID || !window.clarity) return
    window.clarity(command, ...args)
  } catch {
    // Analytics failures are intentionally ignored.
  }
}

function loadScript(src: string, id: string) {
  if (document.getElementById(id)) return
  const script = document.createElement('script')
  script.id = id
  script.async = true
  script.src = src
  script.onerror = () => undefined
  document.head.appendChild(script)
}

function setGoogleAnalyticsDisabled(disabled: boolean) {
  if (!GA_MEASUREMENT_ID || !canUseBrowser()) return
  ;(window as unknown as Record<string, boolean>)[`ga-disable-${GA_MEASUREMENT_ID}`] = disabled
}

function resolveAnalyticsEnabled() {
  const raw = String(import.meta.env.VITE_ANALYTICS_ENABLED ?? '').toLowerCase()
  if (raw === 'true') return true
  if (raw === 'false') return false
  return Boolean(import.meta.env.PROD)
}

function canUseBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}
