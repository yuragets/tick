import type { Response } from 'express'
import type { ZodError } from 'zod'

/**
 * Send a 400 with the first Zod issue message (or a fallback). Keeps the
 * per-route validation blocks to a single line.
 */
export function badRequest(res: Response, error: ZodError, fallback = 'Invalid data'): void {
  res.status(400).json({ error: error.issues[0]?.message ?? fallback })
}
