import { Router } from 'express'
import * as db from '../db.js'
import { ProjectSchema, ProjectPatchSchema } from '../schemas.js'

export const projectsRouter = Router()

// GET /api/projects
projectsRouter.get('/', (_req, res) => {
  res.json(db.getAllProjects())
})

// POST /api/projects
projectsRouter.post('/', (req, res) => {
  const parsed = ProjectSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid project' })
  }
  if (db.getProject(parsed.data.id)) {
    return res.status(409).json({ error: 'Project id already exists' })
  }
  res.status(201).json(db.insertProject(parsed.data))
})

// PUT /api/projects/:id
projectsRouter.put('/:id', (req, res) => {
  const parsed = ProjectPatchSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Invalid patch' })
  }
  const updated = db.updateProject(req.params.id, parsed.data)
  if (!updated) return res.status(404).json({ error: 'Project not found' })
  res.json(updated)
})

// DELETE /api/projects/:id
projectsRouter.delete('/:id', (req, res) => {
  const ok = db.deleteProject(req.params.id)
  if (!ok) return res.status(404).json({ error: 'Project not found' })
  res.status(204).end()
})
