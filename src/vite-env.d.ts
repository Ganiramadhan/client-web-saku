/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_TARGET?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_TURNSTILE_SITE_KEY?: string
  readonly VITE_GA_MEASUREMENT_ID?: string
  readonly VITE_CLARITY_PROJECT_ID?: string
  readonly VITE_ANALYTICS_ENABLED?: 'true' | 'false'
  readonly VITE_API_LOGGER?: 'true' | 'false'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
