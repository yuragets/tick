/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  /** 'local' → browser localStorage instead of the HTTP data service. */
  readonly VITE_STORAGE?: 'local' | 'api'
}
