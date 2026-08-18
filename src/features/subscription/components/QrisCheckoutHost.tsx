import { useEffect, useState } from 'react'
import type { CheckoutOutcome } from '../utils/checkoutFlow'
import { registerQrisCheckoutListener, type QrisCheckoutRequest } from '../utils/qrisCheckoutBus'
import { QrisPaymentModal } from './QrisPaymentModal'


export function QrisCheckoutHost() {
  const [state, setState] = useState<{
    req: QrisCheckoutRequest
    resolve: (outcome: CheckoutOutcome) => void
  } | null>(null)

  useEffect(() => {
    registerQrisCheckoutListener((req, resolve) => setState({ req, resolve }))
    return () => registerQrisCheckoutListener(null)
  }, [])

  if (!state) return null

  return (
    <QrisPaymentModal
      req={state.req}
      onSettle={(outcome) => {
        state.resolve(outcome)
        setState(null)
      }}
    />
  )
}
