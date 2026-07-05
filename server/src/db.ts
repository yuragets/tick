import Database from 'better-sqlite3'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { mkdirSync } from 'node:fs'
import type { AppData, Entry, Project, RunningTimer, Settings } from './types.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA_DIR = join(__dirname, '..', 'data')
const DB_PATH = join(DATA_DIR, 'tracker.db')

// Ensure the data directory exists before opening the database.
mkdirSync(DATA_DIR, { recursive: true })

export const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ── Schema ─────────────────────────────────────────────
// tags are stored as a JSON string (string[]) directly on the entry —
// they're never queried independently, so a join table would add complexity
// with no benefit. `running` is a singleton table holding 0 or 1 row.
db.exec(`
  CREATE TABLE IF NOT EXISTS projects (
    id    TEXT PRIMARY KEY,
    name  TEXT NOT NULL,
    color TEXT
  );

  CREATE TABLE IF NOT EXISTS entries (
    id         TEXT PRIMARY KEY,
    desc       TEXT    NOT NULL DEFAULT '',
    project_id TEXT    NOT NULL,
    tags       TEXT    NOT NULL DEFAULT '[]',
    start      INTEGER NOT NULL,
    end        INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_entries_start ON entries(start);
  CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(project_id);

  CREATE TABLE IF NOT EXISTS running (
    id         INTEGER PRIMARY KEY CHECK (id = 1),
    desc       TEXT    NOT NULL DEFAULT '',
    project_id TEXT    NOT NULL,
    tags       TEXT    NOT NULL DEFAULT '[]',
    start      INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id   INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );
`)

const DEFAULT_SETTINGS: Settings = { showDescriptions: true }

// ── Row types & mappers ────────────────────────────────
interface ProjectRow { id: string; name: string; color: string | null }
interface EntryRow {
  id: string; desc: string; project_id: string
  tags: string; start: number; end: number
}
interface RunningRow {
  id: number; desc: string; project_id: string
  tags: string; start: number
}

function toProject(r: ProjectRow): Project {
  return r.color ? { id: r.id, name: r.name, color: r.color } : { id: r.id, name: r.name }
}
function toEntry(r: EntryRow): Entry {
  return {
    id: r.id,
    desc: r.desc,
    projectId: r.project_id,
    tags: safeParseTags(r.tags),
    start: r.start,
    end: r.end,
  }
}
function toRunning(r: RunningRow): RunningTimer {
  return { desc: r.desc, projectId: r.project_id, tags: safeParseTags(r.tags), start: r.start }
}
function safeParseTags(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    return []
  }
}

// ── Projects ───────────────────────────────────────────
const stmtAllProjects = db.prepare('SELECT * FROM projects')
const stmtGetProject = db.prepare('SELECT * FROM projects WHERE id = ?')
const stmtInsertProject = db.prepare(
  'INSERT INTO projects (id, name, color) VALUES (@id, @name, @color)'
)
const stmtDeleteProject = db.prepare('DELETE FROM projects WHERE id = ?')

export function getAllProjects(): Project[] {
  return (stmtAllProjects.all() as ProjectRow[]).map(toProject)
}
export function getProject(id: string): Project | null {
  const row = stmtGetProject.get(id) as ProjectRow | undefined
  return row ? toProject(row) : null
}
export function insertProject(p: Project): Project {
  stmtInsertProject.run({ id: p.id, name: p.name, color: p.color ?? null })
  return p
}
export function updateProject(id: string, patch: { name?: string; color?: string }): Project | null {
  const existing = getProject(id)
  if (!existing) return null
  const next: Project = { ...existing, ...patch }
  db.prepare('UPDATE projects SET name = @name, color = @color WHERE id = @id')
    .run({ id, name: next.name, color: next.color ?? null })
  return next
}
export function deleteProject(id: string): boolean {
  return stmtDeleteProject.run(id).changes > 0
}

// ── Entries ────────────────────────────────────────────
const stmtAllEntries = db.prepare('SELECT * FROM entries ORDER BY start DESC')
const stmtGetEntry = db.prepare('SELECT * FROM entries WHERE id = ?')
const stmtInsertEntry = db.prepare(
  `INSERT INTO entries (id, desc, project_id, tags, start, end)
   VALUES (@id, @desc, @project_id, @tags, @start, @end)`
)
const stmtDeleteEntry = db.prepare('DELETE FROM entries WHERE id = ?')

export function getAllEntries(): Entry[] {
  return (stmtAllEntries.all() as EntryRow[]).map(toEntry)
}
export function getEntry(id: string): Entry | null {
  const row = stmtGetEntry.get(id) as EntryRow | undefined
  return row ? toEntry(row) : null
}
export function insertEntry(e: Entry): Entry {
  stmtInsertEntry.run({
    id: e.id, desc: e.desc, project_id: e.projectId,
    tags: JSON.stringify(e.tags), start: e.start, end: e.end,
  })
  return e
}
export function updateEntry(id: string, patch: Partial<Omit<Entry, 'id'>>): Entry | null {
  const existing = getEntry(id)
  if (!existing) return null
  const next: Entry = { ...existing, ...patch }
  db.prepare(
    `UPDATE entries SET desc=@desc, project_id=@project_id, tags=@tags,
     start=@start, end=@end WHERE id=@id`
  ).run({
    id, desc: next.desc, project_id: next.projectId,
    tags: JSON.stringify(next.tags), start: next.start, end: next.end,
  })
  return next
}
export function deleteEntry(id: string): boolean {
  return stmtDeleteEntry.run(id).changes > 0
}

// ── Running (singleton) ────────────────────────────────
const stmtGetRunning = db.prepare('SELECT * FROM running WHERE id = 1')
const stmtClearRunning = db.prepare('DELETE FROM running')
const stmtSetRunning = db.prepare(
  `INSERT OR REPLACE INTO running (id, desc, project_id, tags, start)
   VALUES (1, @desc, @project_id, @tags, @start)`
)

export function getRunning(): RunningTimer | null {
  const row = stmtGetRunning.get() as RunningRow | undefined
  return row ? toRunning(row) : null
}
export function setRunning(r: RunningTimer): RunningTimer {
  stmtSetRunning.run({
    desc: r.desc, project_id: r.projectId,
    tags: JSON.stringify(r.tags), start: r.start,
  })
  return r
}
export function clearRunning(): void {
  stmtClearRunning.run()
}

// ── Settings (singleton) ───────────────────────────────
const stmtGetSettings = db.prepare('SELECT data FROM settings WHERE id = 1')
const stmtSetSettings = db.prepare(
  'INSERT OR REPLACE INTO settings (id, data) VALUES (1, @data)'
)

export function getSettings(): Settings {
  const row = stmtGetSettings.get() as { data: string } | undefined
  if (!row) return DEFAULT_SETTINGS
  try {
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.data) }
  } catch {
    return DEFAULT_SETTINGS
  }
}
export function setSettings(s: Settings): Settings {
  stmtSetSettings.run({ data: JSON.stringify(s) })
  return s
}

// ── Whole-state export / import ────────────────────────
export function exportState(): AppData {
  return {
    projects: getAllProjects(),
    entries: getAllEntries(),
    running: getRunning(),
    settings: getSettings(),
  }
}

/** Replace ALL data in a single transaction (used by import + migration). */
export const importState = db.transaction((data: AppData) => {
  db.prepare('DELETE FROM entries').run()
  db.prepare('DELETE FROM projects').run()
  db.prepare('DELETE FROM running').run()

  for (const p of data.projects) insertProject(p)
  for (const e of data.entries) insertEntry(e)
  if (data.running) setRunning(data.running)
  if (data.settings) setSettings(data.settings)
})
