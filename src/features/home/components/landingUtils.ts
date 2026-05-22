import { subscriptionApi } from '@/features/subscription/api'

export function smoothScrollTo(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function isActiveSub(sub: Awaited<ReturnType<typeof subscriptionApi.active>> | null | undefined) {
  return sub?.status === 'active' || sub?.status === 'trialing'
}
