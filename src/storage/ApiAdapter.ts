import type { StorageAdapter } from './StorageAdapter'
import { StorageUnavailableError } from './StorageAdapter'
import type { AppData } from '../types'
import { AppDataSchema } from '../schemas'
import { API_BASE_URL } from '../config'

/**
 * Talks to the local data service (server/) over HTTP.
 *
 * The whole state is loaded via GET /api/export and saved via
 * POST /api/import (replace-all) — this mirrors the previous localStorage
 * "write the whole blob" behaviour. The backend also exposes granular
 * per-entity endpoints for the future native app / sync layer.
 */
export class ApiAdapter implements StorageAdapter {
  constructor(private readonly baseUrl: string = API_BASE_URL) {}

  async load(): Promise<AppData | null> {
    const res = await this.request('/export', { method: 'GET' })
    const json = (await res.json()) as unknown
    const parsed = AppDataSchema.safeParse(json)
    if (!parsed.success) {
      console.warn('[api] Export failed validation:', parsed.error.flatten())
      return null
    }
    return parsed.data
  }

  async save(data: AppData): Promise<void> {
    await this.request('/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
  }

  async clear(): Promise<void> {
    const empty: AppData = { projects: [], entries: [], running: null }
    await this.save(empty)
  }

  /** Wraps fetch: network failures become StorageUnavailableError. */
  private async request(path: string, init: RequestInit): Promise<Response> {
    let res: Response
    try {
      res = await fetch(`${this.baseUrl}${path}`, init)
    } catch {
      // fetch rejects only on network-level failure (server down, DNS, CORS)
      throw new StorageUnavailableError()
    }
    if (!res.ok) {
      let message = `HTTP ${res.status}`
      try {
        const body = (await res.json()) as { error?: string }
        if (body.error) message = body.error
      } catch {
        /* non-JSON error body — keep the status message */
      }
      throw new Error(message)
    }
    return res
  }
}
