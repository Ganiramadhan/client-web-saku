import { subscriptionApi } from '@/features/subscription/api'

export function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const isMobile = window.matchMedia('(max-width: 767px)').matches
  const offset = isMobile ? 44 : 40
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' })
}

export function isActiveSub(sub: Awaited<ReturnType<typeof subscriptionApi.active>> | null | undefined) {
  return sub?.status === 'active' || sub?.status === 'trialing'
}
