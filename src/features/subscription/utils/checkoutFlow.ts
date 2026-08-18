import type { QueryClient } from '@tanstack/react-query'
import type { NavigateFunction } from 'react-router-dom'
import type { CheckoutResponse } from '../api'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { openQrisCheckout } from './qrisCheckoutBus'

const PENDING_ORDER_KEY = 'saku-pending-payment-order'
const PAYMENT_RETURN_PATH_KEY = 'saku-payment-return-path'

export type CheckoutOutcome = 'active' | 'pending' | 'failed' | 'closed'

interface CheckoutFlowOptions {
  checkout: CheckoutResponse
  planCode: string
  locale: 'id' | 'en'
  navigate: NavigateFunction
  queryClient: QueryClient
}

export async function openSubscriptionCheckout({
  checkout,
  planCode,
  locale,
  navigate,
  queryClient,
}: CheckoutFlowOptions): Promise<CheckoutOutcome> {
  rememberPendingOrder(checkout.order_id)
  rememberPaymentReturnPath()
  trackEvent(analyticsEvents.checkoutStarted, {
    subscription_plan: planCode,
    amount: checkout.amount,
  })

  document.body.classList.add('saku-payment-open')
  try {
    return await openQrisCheckout({ checkout, planCode, locale, navigate, queryClient })
  } finally {
    document.body.classList.remove('saku-payment-open')
  }
}

export function pendingPaymentOrder(): string {
  if (typeof window === 'undefined') return ''
  return window.sessionStorage.getItem(PENDING_ORDER_KEY) ?? ''
}

export function paymentReturnPath(): string {
  if (typeof window === 'undefined') return '/app/profile'
  const value = window.sessionStorage.getItem(PAYMENT_RETURN_PATH_KEY) ?? ''
  return value.startsWith('/') && !value.startsWith('//') ? value : '/app/profile'
}

export function clearPendingOrder(orderId?: string): void {
  if (typeof window === 'undefined') return
  const stored = pendingPaymentOrder()
  if (!orderId || !stored || stored === orderId) {
    window.sessionStorage.removeItem(PENDING_ORDER_KEY)
  }
}

export function invalidateSubscriptionQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
  queryClient.invalidateQueries({ queryKey: ['subscriptions', 'me'] })
  queryClient.invalidateQueries({ queryKey: ['subscriptions', 'active'] })
  queryClient.invalidateQueries({ queryKey: ['subscription', 'active'] })
}

function rememberPendingOrder(orderId: string): void {
  if (typeof window === 'undefined' || !orderId) return
  window.sessionStorage.setItem(PENDING_ORDER_KEY, orderId)
}

function rememberPaymentReturnPath(): void {
  if (typeof window === 'undefined') return
  const path = `${window.location.pathname}${window.location.search}${window.location.hash}`
  if (path.startsWith('/') && !path.startsWith('//') && !path.startsWith('/payment/')) {
    window.sessionStorage.setItem(PAYMENT_RETURN_PATH_KEY, path)
  }
}
