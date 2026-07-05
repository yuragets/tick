import type { AppData } from '../types'
import { LocalStorageAdapter } from './LocalStorageAdapter'

/**
 * One-time migration from the old browser localStorage store (key
 * "chronos-v1") to the backend. We never delete the localStorage copy —
 * it stays as a safety net after the data is copied to the server.
 */

/** Reads legacy browser data, or null if there is none / it's invalid. */
export function readLegacyData(): AppData | null {
  return LocalStorageAdapter.readSync()
}

/** True if the browser holds legacy data worth migrating. */
export function hasLegacyData(data: AppData | null): data is AppData {
  return !!data && (data.projects.length > 0 || data.entries.length > 0)
}

/** True if the backend has no meaningful data yet. */
export function isBackendEmpty(data: AppData | null): boolean {
  return !data || (data.projects.length === 0 && data.entries.length === 0)
}
