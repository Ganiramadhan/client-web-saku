import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { queryClient } from '@/lib/queryClient'
import { ConfirmDialogHost } from '@/components/ConfirmDialogHost'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
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
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
