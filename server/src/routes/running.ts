import { Router } from 'express'
import * as db from '../db.js'
import { RunningTimerSchema } from '../schemas.js'

export const runningRouter = Router()

// GET /api/running → RunningTimer | null
runningRouter.get('/', (_req, res) => {
  res.json(db.getRunning())
})

// PUT /api/running → set the active timer
runningRouter.put('/', (req, res) => {
  const parsed = RunningTimerSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid running timer' })
  }
  res.json(db.setRunning(parsed.data))
})

// DELETE /api/running → clear the active timer
runningRouter.delete('/', (_req, res) => {
  db.clearRunning()
  res.status(204).end()
})
