import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { ConfirmDialogHost } from '@/components/ConfirmDialogHost'
import { QrisCheckoutHost } from '@/features/subscription/components/QrisCheckoutHost'
import { initSentry, Sentry } from '@/lib/sentry'
import App from './App'
import './index.css'

initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={<div className="p-6 text-sm text-slate-600">Terjadi kendala sementara. Silakan muat ulang halaman.</div>}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            richColors
            closeButton
            expand
            toastOptions={{ duration: 3500, className: 'font-sans' }}
          />
          <ConfirmDialogHost />
          <QrisCheckoutHost />
        </BrowserRouter>
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>,
)
