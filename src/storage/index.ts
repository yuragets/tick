import type { StorageAdapter } from './StorageAdapter'
import { ApiAdapter } from './ApiAdapter'

/**
 * Single place that decides which persistence backend the app uses.
 *
 * Default: ApiAdapter — the local HTTP data service (server/), so data lives
 * in a SQLite file on disk and can be shared with a future native app.
 *
 * LocalStorageAdapter is kept in the codebase (fallback / migration source)
 * but is no longer the default.
 */
export function createStorageAdapter(): StorageAdapter {
  return new ApiAdapter()
}

export type { StorageAdapter } from './StorageAdapter'
export { StorageUnavailableError } from './StorageAdapter'
