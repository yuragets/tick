import { Router } from 'express'
import * as db from '../db.js'
import { AppDataSchema } from '../schemas.js'
import { badRequest } from '../http.js'

export const stateRouter = Router()

// GET /api/export → whole state as one JSON object
stateRouter.get('/export', (_req, res) => {
  res.json(db.exportState())
})

// POST /api/import → replace ALL data (validated) in a single transaction
stateRouter.post('/import', (req, res) => {
  const parsed = AppDataSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error)
  db.importState(parsed.data)
  res.json(db.exportState())
})
