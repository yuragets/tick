import type { Entry, Project } from '../types'
import { projectColor, projectName } from './projects'
import { hm } from './time'
import { t } from '../i18n'

// PNG export of report views. Drawn manually on a <canvas> so it needs no
// third-party library and stays within the app's strict CSP (no external
// scripts, no eval). Colors are read from the live CSS custom properties so
// the export follows the active (dark / light) theme.

const SCALE = 2 // retina crispness

interface RGB { r: number; g: number; b: number }

function hexToRgb(hex: string): RGB {
  let h = hex.trim().replace('#', '')
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  const n = parseInt(h, 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}

function rgbStr({ r, g, b }: RGB, alpha = 1): string {
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

/** Blend `top` over `bottom` at the given weight (0..1) → opaque RGB. */
function mix(bottom: RGB, top: RGB, weight: number): RGB {
  const w = Math.min(1, Math.max(0, weight))
  return {
    r: Math.round(top.r * w + bottom.r * (1 - w)),
    g: Math.round(top.g * w + bottom.g * (1 - w)),
    b: Math.round(top.b * w + bottom.b * (1 - w)),
  }
}

/** Resolve a CSS color token (`#rrggbb` or `var(--x)`) to a hex string. */
function resolveColor(token: string): string {
  const s = token.trim()
  if (s.startsWith('var(')) {
    const name = s.slice(4, -1).trim()
    const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
    return v || '#000000'
  }
  return s
}

function themeColors() {
  const css = getComputedStyle(document.documentElement)
  const get = (name: string) => css.getPropertyValue(name).trim() || '#000000'
  return {
    bg: get('--bg'),
    panel2: get('--panel-2'),
    line: get('--line'),
    lineStrong: get('--line-strong'),
    ink: get('--ink'),
    inkDim: get('--ink-dim'),
    inkMute: get('--ink-mute'),
    accent: get('--accent'),
  }
}

const FONT = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

/** Wrap text into at most `maxLines` lines that fit `maxWidth`; last line
 *  gets an ellipsis if it overflows. */
function wrapLines(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let cur = ''
  for (const word of words) {
    const candidate = cur ? `${cur} ${word}` : word
    if (ctx.measureText(candidate).width <= maxWidth || !cur) {
      cur = candidate
    } else {
      lines.push(cur)
      cur = word
      if (lines.length === maxLines) break
    }
  }
  if (lines.length < maxLines && cur) lines.push(cur)

  if (lines.length === maxLines) {
    // Ensure the final visible line fits, trimming with an ellipsis.
    let last = lines[maxLines - 1]!
    if (ctx.measureText(last).width > maxWidth || words.length > lines.join(' ').split(/\s+/).length) {
      while (last.length && ctx.measureText(last + '…').width > maxWidth) last = last.slice(0, -1)
      lines[maxLines - 1] = last.trimEnd() + '…'
    }
  }
  return lines
}

function downloadCanvas(canvas: HTMLCanvasElement, filename: string) {
  canvas.toBlob(blob => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

function dayKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

interface CalendarImageOpts {
  entries: Entry[]
  projects: Project[]
  month: Date
  filterProjects: string[]
  title: string
  weekdays: string[]
  totalLabel: string
  showDescriptions: boolean
}

export function exportCalendarImage(opts: CalendarImageOpts): void {
  const { entries, projects, month, filterProjects, title, weekdays, totalLabel, showDescriptions } = opts
  const year = month.getFullYear()
  const mon = month.getMonth()
  const monthPrefix = `${year}-${String(mon + 1).padStart(2, '0')}`

  // Per-day per-project ms + per-day descriptions (single-project days only)
  const dayProj = new Map<string, Map<string, number>>()
  const dayDesc = new Map<string, string[]>()
  const sorted = [...entries].sort((a, b) => b.start - a.start)
  for (const e of sorted) {
    if (filterProjects.length && !filterProjects.includes(e.projectId)) continue
    const key = dayKey(new Date(e.start))
    if (!key.startsWith(monthPrefix)) continue
    if (!dayProj.has(key)) dayProj.set(key, new Map())
    const pm = dayProj.get(key)!
    pm.set(e.projectId, (pm.get(e.projectId) ?? 0) + (e.end - e.start))
    const d = e.desc.trim()
    if (d) {
      if (!dayDesc.has(key)) dayDesc.set(key, [])
      dayDesc.get(key)!.push(d)
    }
  }

  const dayTotal = new Map<string, number>()
  let maxMs = 0
  let monthTotal = 0
  dayProj.forEach((pm, key) => {
    const total = Array.from(pm.values()).reduce((s, v) => s + v, 0)
    dayTotal.set(key, total)
    monthTotal += total
    if (total > maxMs) maxMs = total
  })

  if (monthTotal === 0) {
    alert(t('csvNoEntries'))
    return
  }

  const c = themeColors()
  const panelRgb = hexToRgb(c.panel2)

  // Layout (logical px)
  const PAD = 28
  const COLS = 7
  const CELL = 152
  const GAP = 8
  const TITLE_H = 52
  const WEEKDAY_H = 30

  const firstDay = new Date(year, mon, 1)
  const lastDay = new Date(year, mon + 1, 0)
  const startOffset = isoWeekday(firstDay)
  const rows = Math.ceil((startOffset + lastDay.getDate()) / COLS)

  const gridW = COLS * CELL + (COLS - 1) * GAP
  const width = PAD * 2 + gridW

  // Legend projects for the month
  const legendIds = new Set<string>()
  dayProj.forEach(pm => pm.forEach((_v, pid) => legendIds.add(pid)))
  const legend = Array.from(legendIds)
    .map(pid => ({ name: projectName(projects, pid), color: projectColor(projects, pid) }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const LEGEND_H = legend.length ? 44 : 16

  const gridTop = PAD + TITLE_H + WEEKDAY_H
  const gridH = rows * CELL + (rows - 1) * GAP
  const height = gridTop + gridH + LEGEND_H + PAD

  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  // Background
  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.textBaseline = 'alphabetic'
  ctx.fillStyle = c.ink
  ctx.font = `600 22px ${FONT}`
  ctx.textAlign = 'left'
  ctx.fillText(title, PAD, PAD + 26)
  // Month total (right)
  ctx.textAlign = 'right'
  ctx.font = `500 15px ${FONT}`
  ctx.fillStyle = c.inkMute
  const totalTxt = `${totalLabel} ${hm(monthTotal)}`
  ctx.fillText(totalTxt, width - PAD, PAD + 26)

  // Weekday headers
  ctx.textAlign = 'center'
  ctx.font = `500 12px ${FONT}`
  ctx.fillStyle = c.inkMute
  for (let i = 0; i < COLS; i++) {
    const x = PAD + i * (CELL + GAP) + CELL / 2
    ctx.fillText(weekdays[i] ?? '', x, PAD + TITLE_H + 18)
  }

  const today = new Date()
  const todayKey = dayKey(today)

  // Cells
  for (let i = 0; i < rows * COLS; i++) {
    const dayNum = i - startOffset + 1
    if (dayNum < 1 || dayNum > lastDay.getDate()) continue

    const col = i % COLS
    const row = Math.floor(i / COLS)
    const x = PAD + col * (CELL + GAP)
    const y = gridTop + row * (CELL + GAP)

    const date = new Date(year, mon, dayNum)
    const key = dayKey(date)
    const pm = dayProj.get(key) ?? new Map<string, number>()
    const total = dayTotal.get(key) ?? 0
    const intensity = maxMs > 0 && total > 0 ? total / maxMs : 0
    const isToday = key === todayKey

    // Cell fill
    if (total > 0 && pm.size >= 1) {
      const entriesArr = Array.from(pm.entries()).sort((a, b) => b[1] - a[1])
      if (pm.size === 1) {
        const weight = 0.1 + intensity * 0.75
        const color = hexToRgb(projectColor(projects, entriesArr[0]![0]))
        ctx.fillStyle = rgbStr(mix(panelRgb, color, weight))
        roundRect(ctx, x, y, CELL, CELL, 10)
        ctx.fill()
      } else {
        // Base + proportional vertical stripes per project
        ctx.fillStyle = c.panel2
        roundRect(ctx, x, y, CELL, CELL, 10)
        ctx.fill()
        const alpha = Math.max(0.25, 0.1 + intensity * 0.75)
        ctx.save()
        roundRect(ctx, x, y, CELL, CELL, 10)
        ctx.clip()
        let px = x
        for (const [pid, ms] of entriesArr) {
          const w = (ms / total) * CELL
          ctx.fillStyle = rgbStr(hexToRgb(projectColor(projects, pid)), alpha)
          ctx.fillRect(px, y, w + 0.5, CELL)
          px += w
        }
        ctx.restore()
      }
    } else {
      ctx.fillStyle = c.panel2
      roundRect(ctx, x, y, CELL, CELL, 10)
      ctx.fill()
    }

    // Border
    const dominant = pm.size > 0
      ? projectColor(projects, Array.from(pm.entries()).sort((a, b) => b[1] - a[1])[0]![0])
      : c.accent
    ctx.lineWidth = isToday ? 2 : 1
    ctx.strokeStyle = isToday ? dominant : c.line
    roundRect(ctx, x, y, CELL, CELL, 10)
    ctx.stroke()

    const textOnBg = intensity > 0.45

    // Day number (top-left)
    ctx.textAlign = 'left'
    ctx.font = `600 13px ${FONT}`
    ctx.fillStyle = total > 0 ? c.ink : (isToday ? c.accent : c.inkDim)
    ctx.fillText(String(dayNum), x + 12, y + 22)

    // Description (single-project days), wrapped
    if (showDescriptions && pm.size === 1) {
      const descs = dayDesc.get(key) ?? []
      const full = descs.join(' · ')
      if (full) {
        ctx.font = `400 11.5px ${FONT}`
        ctx.fillStyle = textOnBg ? c.ink : c.inkDim
        const lines = wrapLines(ctx, full, CELL - 24, 5)
        let ly = y + 40
        for (const ln of lines) {
          ctx.fillText(ln, x + 12, ly)
          ly += 15
        }
      }
    } else if (pm.size > 1) {
      // Project dots
      const dots = Array.from(pm.entries()).sort((a, b) => b[1] - a[1]).slice(0, 4)
      let dx = x + 12
      for (const [pid] of dots) {
        ctx.fillStyle = projectColor(projects, pid)
        ctx.beginPath()
        ctx.arc(dx + 3, y + CELL - 26, 3, 0, Math.PI * 2)
        ctx.fill()
        dx += 10
      }
    }

    // Hours (bottom-right)
    if (total > 0) {
      ctx.textAlign = 'right'
      ctx.font = `500 11px ${FONT}`
      ctx.fillStyle = textOnBg ? c.ink : dominant
      ctx.fillText(hm(total), x + CELL - 10, y + CELL - 12)
    }
  }

  // Legend
  if (legend.length) {
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = `400 13px ${FONT}`
    let lx = PAD
    const ly = gridTop + gridH + 24
    for (const p of legend) {
      const label = p.name
      const dotR = 5
      ctx.fillStyle = p.color
      ctx.beginPath()
      ctx.arc(lx + dotR, ly, dotR, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = c.inkDim
      ctx.fillText(label, lx + dotR * 2 + 6, ly + 1)
      lx += dotR * 2 + 6 + ctx.measureText(label).width + 20
      if (lx > width - PAD - 80) break
    }
    ctx.textBaseline = 'alphabetic'
  }

  downloadCanvas(canvas, `tick-calendar-${monthPrefix}.png`)
}

interface BreakdownImageOpts {
  title: string
  items: { label: string; color: string; ms: number }[]
  totalLabel: string
}

export function exportBreakdownImage(opts: BreakdownImageOpts): void {
  const { title, items, totalLabel } = opts
  if (!items.length) {
    alert(t('csvNoEntries'))
    return
  }

  const c = themeColors()
  const maxMs = items.reduce((m, it) => Math.max(m, it.ms), 0) || 1
  const totalMs = items.reduce((s, it) => s + it.ms, 0)

  const PAD = 28
  const ROW_H = 34
  const LABEL_W = 150
  const VALUE_W = 130
  const BAR_MIN = 200
  const width = PAD * 2 + LABEL_W + BAR_MIN + VALUE_W + 24
  const barX = PAD + LABEL_W + 12
  const barMaxW = width - PAD - VALUE_W - barX
  const TITLE_H = 50
  const TOTAL_H = 44
  const height = PAD + TITLE_H + items.length * ROW_H + TOTAL_H + PAD

  const canvas = document.createElement('canvas')
  canvas.width = width * SCALE
  canvas.height = height * SCALE
  const ctx = canvas.getContext('2d')!
  ctx.scale(SCALE, SCALE)

  ctx.fillStyle = c.bg
  ctx.fillRect(0, 0, width, height)

  // Title
  ctx.fillStyle = c.ink
  ctx.font = `600 22px ${FONT}`
  ctx.textAlign = 'left'
  ctx.textBaseline = 'alphabetic'
  ctx.fillText(title, PAD, PAD + 26)

  let y = PAD + TITLE_H
  for (const it of items) {
    const color = resolveColor(it.color)
    const cy = y + ROW_H / 2

    // Label (truncated)
    ctx.textAlign = 'left'
    ctx.textBaseline = 'middle'
    ctx.font = `400 14px ${FONT}`
    ctx.fillStyle = c.ink
    let label = it.label
    while (label.length && ctx.measureText(label).width > LABEL_W) label = label.slice(0, -1)
    if (label !== it.label) label = label.slice(0, -1) + '…'
    ctx.fillText(label, PAD, cy)

    // Bar
    const w = Math.max(3, (it.ms / maxMs) * barMaxW)
    ctx.fillStyle = color
    roundRect(ctx, barX, cy - 7, w, 14, 4)
    ctx.fill()

    // Value
    ctx.textAlign = 'right'
    ctx.font = `500 13px ${FONT}`
    ctx.fillStyle = c.inkDim
    const pct = totalMs ? Math.round((it.ms / totalMs) * 100) : 0
    ctx.fillText(`${hm(it.ms)}  ·  ${pct}%`, width - PAD, cy)

    y += ROW_H
  }

  // Total
  ctx.strokeStyle = c.line
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(PAD, y + 8)
  ctx.lineTo(width - PAD, y + 8)
  ctx.stroke()

  ctx.textAlign = 'left'
  ctx.font = `500 14px ${FONT}`
  ctx.fillStyle = c.inkMute
  ctx.fillText(totalLabel, PAD, y + 28)
  ctx.textAlign = 'right'
  ctx.font = `600 15px ${FONT}`
  ctx.fillStyle = c.ink
  ctx.fillText(hm(totalMs), width - PAD, y + 28)

  const stamp = new Date().toISOString().slice(0, 10)
  downloadCanvas(canvas, `tick-report-${stamp}.png`)
}
