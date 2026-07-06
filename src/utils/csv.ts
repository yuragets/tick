import type { Entry, Project } from '../types'
import { AppDataSchema } from '../schemas'
import { sanitizeCsvCell } from './sanitize'
import { projectName } from './projects'
import { IMPORT_MAX_BYTES, IMPORT_MAX_ENTRIES, MAX_DESC_LEN, MAX_NAME_LEN, MAX_TAGS } from './constants'
import { t } from '../i18n'

// day/month/year, zero-padded (e.g. 06/07/2026)
function fmtDMY(ms: number): string {
  const d = new Date(ms)
  const dd = String(d.getDate()).padStart(2, '0')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${d.getFullYear()}`
}

function quoteCell(value: string): string {
  const safe = sanitizeCsvCell(value)
  return `"${safe.replace(/"/g, '""')}"`
}

export function exportCSV(entries: Entry[], projects: Project[], rangeLabel: string): void {
  if (!entries.length) {
    alert(t('csvNoEntries'))
    return
  }

  const head = [
    t('csvColProject'), t('csvColHours'), t('csvColDate'),
    t('csvColTags'), t('csvColDescription'),
  ]
  // Merge entries of the same project on the same day into one row.
  type Group = { projectId: string; start: number; ms: number; descs: string[]; tags: Set<string> }
  const groups = new Map<string, Group>()
  for (const e of entries) {
    const d = new Date(e.start)
    const key = `${e.projectId}|${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
    let g = groups.get(key)
    if (!g) {
      g = { projectId: e.projectId, start: e.start, ms: 0, descs: [], tags: new Set() }
      groups.set(key, g)
    }
    g.ms += e.end - e.start
    g.start = Math.min(g.start, e.start)
    const desc = (e.desc || '').trim()
    if (desc) g.descs.push(desc)
    for (const tag of e.tags ?? []) g.tags.add(tag)
  }

  const rows = [...groups.values()].sort((a, b) => a.start - b.start).map(g => [
    quoteCell(projectName(projects, g.projectId)),
    quoteCell((g.ms / 3_600_000).toFixed(2)),
    quoteCell(fmtDMY(g.start)),
    quoteCell([...g.tags].join('; ')),
    quoteCell(g.descs.join(' · ')),
  ])

  // Total time across all exported entries (as a trailing summary row).
  const totalHours = entries.reduce((s, e) => s + (e.end - e.start), 0) / 3_600_000
  const totalRow = [
    quoteCell(t('totalTime')),
    quoteCell(totalHours.toFixed(2)),
    quoteCell(''), quoteCell(''), quoteCell(''),
  ]

  const csv = [
    head.map(quoteCell).join(','),
    ...rows.map(r => r.join(',')),
    totalRow.join(','),
  ].join('\n')
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
    if (cols.length < 5) continue

    const [projName, hoursStr, dateStr, tagsRaw, desc] = cols
    // Date is stored as day/month/year.
    const [dd, mm, yyyy] = (dateStr ?? '').split('/').map(n => parseInt(n, 10))
    const hours = parseFloat(hoursStr ?? '')
    if (!dd || !mm || !yyyy || !hours || hours <= 0) continue
    // Only a date + duration is stored; anchor at local midnight.
    const start = new Date(yyyy, mm - 1, dd).getTime()
    const end = start + Math.round(hours * 3_600_000)

    const cleanName = (projName ?? '').slice(0, MAX_NAME_LEN)
    if (!projectMap.has(cleanName)) {
      projectMap.set(cleanName, { id: 'p' + Date.now() + projectMap.size, name: cleanName })
    }
    const proj = projectMap.get(cleanName)!

    entries.push({
      id: 'e' + Date.now() + i,
      desc: (desc ?? '').slice(0, MAX_DESC_LEN),
      projectId: proj.id,
      tags: (tagsRaw ?? '').split(';').map(t => t.trim()).filter(Boolean).slice(0, MAX_TAGS),
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
