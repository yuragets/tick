import type { StorageAdapter } from './StorageAdapter'
import { ApiAdapter } from './ApiAdapter'
import { LocalStorageAdapter } from './LocalStorageAdapter'

/**
 * Single place that decides which persistence backend the app uses.
 *
 * Default: ApiAdapter — the local HTTP data service (server/), so data lives
 * in a SQLite file on disk and can be shared with a future native app.
 *
 * VITE_STORAGE=local at build time selects LocalStorageAdapter instead, for
 * static hosting without a backend (e.g. GitHub Pages).
 */
export function createStorageAdapter(): StorageAdapter {
  if (import.meta.env.VITE_STORAGE === 'local') return new LocalStorageAdapter()
  return new ApiAdapter()
}

export type { StorageAdapter } from './StorageAdapter'
export { StorageUnavailableError } from './StorageAdapter'
