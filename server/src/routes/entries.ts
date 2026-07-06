import { Router } from 'express'
import * as db from '../db.js'
import { EntrySchema, EntryPatchSchema } from '../schemas.js'
import { badRequest } from '../http.js'

export const entriesRouter = Router()

// GET /api/entries
entriesRouter.get('/', (_req, res) => {
  res.json(db.getAllEntries())
})

// POST /api/entries
entriesRouter.post('/', (req, res) => {
  const parsed = EntrySchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error, 'Invalid entry')
  if (db.getEntry(parsed.data.id)) {
    return res.status(409).json({ error: 'Entry id already exists' })
  }
  res.status(201).json(db.insertEntry(parsed.data))
})

// PUT /api/entries/:id
entriesRouter.put('/:id', (req, res) => {
  const parsed = EntryPatchSchema.safeParse(req.body)
  if (!parsed.success) return badRequest(res, parsed.error, 'Invalid patch')
  // Guard against inverted time ranges when both bounds are supplied.
  const existing = db.getEntry(req.params.id)
  if (!existing) return res.status(404).json({ error: 'Entry not found' })
  const next = { ...existing, ...parsed.data }
  if (next.end <= next.start) {
    return res.status(400).json({ error: 'end must be after start' })
  }
  res.json(db.updateEntry(req.params.id, parsed.data))
})

// DELETE /api/entries/:id
entriesRouter.delete('/:id', (req, res) => {
  const ok = db.deleteEntry(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Entry not found' })
  res.status(204).end()
})
