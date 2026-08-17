import type { NavigateFunction } from 'react-router-dom'
import type { QueryClient } from '@tanstack/react-query'
import type { CheckoutResponse } from '../api'
import type { CheckoutOutcome } from './checkoutFlow'

export interface QrisCheckoutRequest {
  checkout: CheckoutResponse
  planCode: string
  locale: 'id' | 'en'
  navigate: NavigateFunction
  queryClient: QueryClient
}

type Resolver = (outcome: CheckoutOutcome) => void
type Listener = (req: QrisCheckoutRequest, resolve: Resolver) => void

let listener: Listener | null = null

export function registerQrisCheckoutListener(fn: Listener | null): void {
  listener = fn
}


export function openQrisCheckout(req: QrisCheckoutRequest): Promise<CheckoutOutcome> {
  return new Promise((resolve) => {
    if (!listener) {
      resolve('failed')
      return
    }
    listener(req, resolve)
  })
}
