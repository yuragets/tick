import type { AppData } from '../types'

/**
 * Abstract persistence layer. All methods are async so implementations
 * can talk to a network backend, IndexedDB, the filesystem, etc.
 */
export interface StorageAdapter {
  load(): Promise<AppData | null>
  save(data: AppData): Promise<void>
  clear(): Promise<void>
}

/** Thrown by adapters when the underlying data service is unreachable. */
export class StorageUnavailableError extends Error {
  constructor(message = 'Data service unavailable') {
    super(message)
    this.name = 'StorageUnavailableError'
  }
}
