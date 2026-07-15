import { z } from 'zod'

const MAX_STR = 500
const MAX_TAG_LEN = 100
const MAX_ENTRIES = 10_000
const MAX_PROJECTS = 500

const safeStr = z.string().max(MAX_STR).transform(s => s.trim())
const requiredSafeStr = z.string().min(1).max(MAX_STR).transform(s => s.trim())

export const ProjectSchema = z.object({
  id: z.string().max(64),
  name: requiredSafeStr,
  color: z.string().max(32).optional(),
})

export const EntrySchema = z.object({
  id: z.string().max(64),
  desc: safeStr,
  projectId: z.string().max(64),
  tags: z.array(z.string().max(MAX_TAG_LEN)).max(20).default([]),
  start: z.number().int().positive(),
  end: z.number().int().positive(),
}).refine(e => e.end > e.start, { message: 'end must be after start' })

export const RunningTimerSchema = z.object({
  desc: safeStr,
  projectId: z.string().max(64),
  tags: z.array(z.string().max(MAX_TAG_LEN)).max(20).default([]),
  start: z.number().int().positive(),
  pausedAt: z.number().int().positive().nullable().optional(),
  pausedMs: z.number().int().nonnegative().optional(),
})

export const SettingsSchema = z.object({
  showDescriptions: z.boolean().default(true),
  lang: z.enum(['en', 'uk']).default('en'),
})

export const AppDataSchema = z.object({
  projects: z.array(ProjectSchema).max(MAX_PROJECTS).default([]),
  entries: z.array(EntrySchema).max(MAX_ENTRIES).default([]),
  running: RunningTimerSchema.nullable().default(null),
  settings: SettingsSchema.optional(),
})

export type AppDataInput = z.input<typeof AppDataSchema>
