import { z } from 'zod'

// Server-side validation. Mirrors the frontend Zod schemas with the same
// length limits so imported / posted data can't bloat the database.

const MAX_STR = 500
const MAX_TAG_LEN = 100
const MAX_ENTRIES = 100_000
const MAX_PROJECTS = 1_000

export const ProjectSchema = z.object({
  id: z.string().min(1).max(64),
  name: z.string().min(1).max(MAX_STR),
  color: z.string().max(32).optional(),
})

export const EntrySchema = z.object({
  id: z.string().min(1).max(64),
  desc: z.string().max(MAX_STR).default(''),
  projectId: z.string().min(1).max(64),
  tags: z.array(z.string().max(MAX_TAG_LEN)).max(20).default([]),
  start: z.number().int().positive(),
  end: z.number().int().positive(),
}).refine(e => e.end > e.start, { message: 'end must be after start' })

export const RunningTimerSchema = z.object({
  desc: z.string().max(MAX_STR).default(''),
  projectId: z.string().min(1).max(64),
  tags: z.array(z.string().max(MAX_TAG_LEN)).max(20).default([]),
  start: z.number().int().positive(),
})

export const SettingsSchema = z.object({
  showDescriptions: z.boolean().default(true),
})

export const AppDataSchema = z.object({
  projects: z.array(ProjectSchema).max(MAX_PROJECTS).default([]),
  entries: z.array(EntrySchema).max(MAX_ENTRIES).default([]),
  running: RunningTimerSchema.nullable().default(null),
  settings: SettingsSchema.optional(),
})

// Partial schemas for PUT (patch) endpoints
export const ProjectPatchSchema = ProjectSchema.partial().omit({ id: true })
export const EntryPatchSchema = z.object({
  desc: z.string().max(MAX_STR).optional(),
  projectId: z.string().min(1).max(64).optional(),
  tags: z.array(z.string().max(MAX_TAG_LEN)).max(20).optional(),
  start: z.number().int().positive().optional(),
  end: z.number().int().positive().optional(),
})
