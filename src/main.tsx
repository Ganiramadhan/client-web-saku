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

// After a new deploy, module chunks referenced by an already-open tab can
// 404 (old hash no longer exists). Vite fires `vite:preloadError` for these
// failures; reload once to pick up the current chunk manifest instead of
// leaving the user stuck on the ErrorBoundary fallback.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    const key = 'saku_chunk_reload_at'
    const lastReload = Number(window.sessionStorage.getItem(key) || 0)
    const now = Date.now()
    if (now - lastReload > 10_000) {
      window.sessionStorage.setItem(key, String(now))
      window.location.reload()
    }
  })
}

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
