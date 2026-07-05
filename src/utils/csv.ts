import type { Entry, Project } from '../types'
import { AppDataSchema } from '../schemas'
import { sanitizeCsvCell } from './sanitize'
import { IMPORT_MAX_BYTES, IMPORT_MAX_ENTRIES } from './constants'
import { t, getLocale } from '../i18n'

const pName = (projects: Project[], id: string) =>
  projects.find(p => p.id === id)?.name ?? '—'

function quoteCell(value: string): string {
  const safe = sanitizeCsvCell(value)
  return `"${safe.replace(/"/g, '""')}"`
}

export function exportCSV(entries: Entry[], projects: Project[], rangeLabel: string): void {
  if (!entries.length) {
    alert(t('csvNoEntries'))
    return
  }

  const locale = getLocale()
  const head = [
    t('csvColDescription'), t('csvColProject'), t('csvColTags'),
    t('csvColStart'), t('csvColEnd'), t('csvColHours'),
  ]
  const rows = [...entries].sort((a, b) => a.start - b.start).map(e => [
    quoteCell(e.desc || ''),
    quoteCell(pName(projects, e.projectId)),
    quoteCell((e.tags ?? []).join('; ')),
    quoteCell(new Date(e.start).toLocaleString(locale)),
    quoteCell(new Date(e.end).toLocaleString(locale)),
    quoteCell(((e.end - e.start) / 3_600_000).toFixed(2)),
  ])

  const csv = [head.map(quoteCell).join(','), ...rows.map(r => r.join(','))].join('\n')
  // BOM for UTF-8 Excel compatibility
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `tick-${rangeLabel}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export type ImportResult =
  | { ok: true; projects: Project[]; entries: Entry[] }
  | { ok: false; error: string }

export async function importFile(file: File): Promise<ImportResult> {
  if (file.size > IMPORT_MAX_BYTES) {
    return { ok: false, error: t('importFileTooBig', { mb: IMPORT_MAX_BYTES / 1024 / 1024 }) }
  }

  const text = await file.text()

  if (file.name.endsWith('.json')) {
    return importJSON(text)
  } else if (file.name.endsWith('.csv')) {
    return importCSV(text)
  }

  return { ok: false, error: t('importUnsupported') }
}

function importJSON(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, error: t('importInvalidJson') }
  }

  const result = AppDataSchema.safeParse(parsed)
  if (!result.success) {
    return { ok: false, error: t('importBadStructure', { detail: result.error.issues[0]?.message ?? '' }) }
  }

  if (result.data.entries.length > IMPORT_MAX_ENTRIES) {
    return { ok: false, error: t('importTooManyEntries', { max: IMPORT_MAX_ENTRIES }) }
  }

  return { ok: true, projects: result.data.projects, entries: result.data.entries }
}

function importCSV(text: string): ImportResult {
  const lines = text.replace(/^﻿/, '').split('\n').filter(Boolean)
  if (lines.length < 2) return { ok: false, error: t('importCsvEmpty') }

  if (lines.length - 1 > IMPORT_MAX_ENTRIES) {
    return { ok: false, error: t('importTooManyRows', { max: IMPORT_MAX_ENTRIES }) }
  }

  const entries: Entry[] = []
  const projectMap = new Map<string, Project>()

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i] ?? '')
    if (cols.length < 6) continue

    const [desc, projName, tagsRaw, startStr, endStr] = cols
    const start = new Date(startStr ?? '').getTime()
    const end = new Date(endStr ?? '').getTime()
    if (!start || !end || end <= start) continue

    const pName = (projName ?? '').slice(0, 100)
    if (!projectMap.has(pName)) {
      projectMap.set(pName, { id: 'p' + Date.now() + projectMap.size, name: pName })
    }
    const proj = projectMap.get(pName)!

    entries.push({
      id: 'e' + Date.now() + i,
      desc: (desc ?? '').slice(0, 500),
      projectId: proj.id,
      tags: (tagsRaw ?? '').split(';').map(t => t.trim()).filter(Boolean).slice(0, 20),
      start,
      end,
    })
  }

  return { ok: true, projects: Array.from(projectMap.values()), entries }
}

function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let cur = ''
  let inQuote = false

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        inQuote = !inQuote
      }
    } else if (ch === ',' && !inQuote) {
      result.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  result.push(cur)
  return result
}
