import type { QueryClient } from '@tanstack/react-query'
import type { NavigateFunction } from 'react-router-dom'
import { subscriptionApi, type CheckoutResponse, type Subscription } from '../api'
import { loadSnap } from '@/lib/snap'
import { analyticsEvents, trackEvent } from '@/lib/analytics'
import { toast } from '@/lib/toast'

const PENDING_ORDER_KEY = 'saku-pending-payment-order'
const PAYMENT_RETURN_PATH_KEY = 'saku-payment-return-path'

export type CheckoutOutcome = 'active' | 'pending' | 'failed' | 'closed' | 'redirected'

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

  await loadSnap(checkout.client_key, checkout.is_production)
  if (!window.snap) {
    window.location.assign(checkout.redirect_url)
    return 'redirected'
  }

  document.body.classList.add('saku-payment-open')

  return new Promise<CheckoutOutcome>((resolve) => {
    let settled = false
    const finish = (outcome: CheckoutOutcome) => {
      if (settled) return
      settled = true
      document.body.classList.remove('saku-payment-open')
      invalidateSubscriptionQueries(queryClient)
      resolve(outcome)
    }

    try {
      window.snap!.pay(checkout.snap_token, {
        onSuccess: async (result) => {
          const orderId = paymentResultValue(result, 'order_id') || checkout.order_id
          rememberPendingOrder(orderId)
          const subscription = await confirmPaymentWithRetry(orderId)
          const active = subscription?.status === 'active' && subscription.payment_status === 'paid'

          if (active) {
            clearPendingOrder(orderId)
            trackEvent(analyticsEvents.paymentSuccess, {
              subscription_plan: planCode,
              payment_method: paymentResultValue(result, 'payment_type') || undefined,
              amount: checkout.amount,
            })
            finish('active')
            navigate(paymentStatusPath(orderId))
            return
          }

          toast.info(locale === 'id'
            ? 'Pembayaran diterima dan sedang disinkronkan. Kamu tetap bisa melanjutkannya dari halaman ini.'
            : 'Payment was received and is syncing. You can continue it from this page.')
          finish('pending')
        },
        onPending: (result) => {
          const orderId = paymentResultValue(result, 'order_id') || checkout.order_id
          rememberPendingOrder(orderId)
          toast.info(locale === 'id'
            ? 'Pembayaran masih pending. Kamu tetap di halaman ini dan bisa membuka Snap lagi.'
            : 'Payment is still pending. You can stay here and reopen Snap.')
          finish('pending')
        },
        onError: (result) => {
          trackEvent(analyticsEvents.paymentFailed, {
            subscription_plan: planCode,
            payment_status: paymentResultValue(result, 'transaction_status') || 'failed',
            amount: checkout.amount,
          })
          toast.error(locale === 'id'
            ? 'Pembayaran tidak berhasil diproses. Silakan coba lagi dari halaman ini.'
            : 'Payment could not be processed. Please try again from this page.')
          finish('failed')
        },
        onClose: () => {
          toast.info(locale === 'id'
            ? 'Checkout ditutup. Kamu tetap di halaman ini dan bisa membuka Snap lagi.'
            : 'Checkout was closed. You can stay here and reopen Snap.')
          finish('closed')
        },
      })
    } catch {
      toast.error(locale === 'id'
        ? 'Checkout tidak dapat dibuka. Silakan coba lagi.'
        : 'Checkout could not be opened. Please try again.')
      finish('failed')
    }
  })
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

async function confirmPaymentWithRetry(orderId: string): Promise<Subscription | null> {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    try {
      const subscription = await subscriptionApi.confirm(orderId)
      if (subscription.status === 'active' || subscription.payment_status !== 'pending') {
        return subscription
      }
    } catch {
      // Webhook or gateway status can lag briefly after the Snap success callback.
    }
    await delay(900 * (attempt + 1))
  }
  return null
}

function paymentStatusPath(orderId: string): string {
  const params = new URLSearchParams({ order_id: orderId, state: 'active' })
  return `/app/subscription/thanks?${params.toString()}`
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

function paymentResultValue(result: unknown, key: string): string {
  if (!result || typeof result !== 'object' || !(key in result)) return ''
  return String((result as Record<string, unknown>)[key] ?? '').trim()
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}
