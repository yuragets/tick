import type { StorageAdapter } from './StorageAdapter'
import type { AppData } from '../types'
import { AppDataSchema } from '../schemas'
import { STORAGE_KEY } from '../utils/constants'

/**
 * Browser localStorage implementation. Used by static builds
 * (VITE_STORAGE=local — see createStorageAdapter()) and as the source for
 * the one-time migration to the backend.
 */
export class LocalStorageAdapter implements StorageAdapter {
  async load(): Promise<AppData | null> {
    return LocalStorageAdapter.readSync()
  }

  async save(data: AppData): Promise<void> {
    // Throws if localStorage is full or unavailable — the store surfaces
    // that via `saveError`.
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  async clear(): Promise<void> {
    localStorage.removeItem(STORAGE_KEY)
  }

  /** Synchronous read of legacy data — used by the migration flow. */
  static readSync(): AppData | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return null

      const parsed = JSON.parse(raw) as unknown
      const result = AppDataSchema.safeParse(parsed)
      if (!result.success) {
        console.warn('[storage] Data validation failed:', result.error.flatten())
        return null
      }
      return result.data
    } catch {
      return null
    }
  }
}
