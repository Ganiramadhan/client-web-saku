import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

const vendorChunks: Array<[string, string[]]> = [
  ['vendor-react', ['react', 'react-dom', 'scheduler']],
  ['vendor-router', ['react-router', 'react-router-dom']],
  ['vendor-query-http', ['@tanstack/react-query', 'axios', 'zustand']],
  ['vendor-table', ['@tanstack/react-table']],
  ['vendor-charts', ['recharts', 'd3-', 'victory-vendor', 'clsx']],
  ['vendor-forms', ['react-datepicker', 'react-select', '@floating-ui', '@emotion', 'date-fns']],
  ['vendor-icons-hi2', ['react-icons/hi2']],
  ['vendor-icons-ri', ['react-icons/ri']],
]

function manualChunks(id: string) {
  if (!id.includes('node_modules')) return undefined
  const normalized = id.split(path.sep).join('/')
  if (normalized.includes('/node_modules/react-icons/hi2/')) return 'vendor-icons-hi2'
  if (normalized.includes('/node_modules/react-icons/ri/')) return 'vendor-icons-ri'
  const packageName = getPackageName(id)
  const match = vendorChunks.find(([, packages]) => packages.some((pkg) => (
    packageName === pkg || (pkg.endsWith('-') && packageName.startsWith(pkg))
  )))
  if (match) return match[0]
  return 'vendor-misc'
}

function getPackageName(id: string) {
  const normalized = id.split(path.sep).join('/')
  const parts = normalized.split('/node_modules/').pop()?.split('/') ?? []
  if (parts[0]?.startsWith('@')) return `${parts[0]}/${parts[1] ?? ''}`
  return parts[0] ?? ''
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        // target: 'http://localhost:4001',
        target: 'https://api-finance.ganipedia.com',
        changeOrigin: true,
      },
    },
  },
  build: {
    rolldownOptions: {
      output: {
        manualChunks,
      },
    },
  },
})
