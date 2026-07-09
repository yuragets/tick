import { useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { projectColor, projectName } from '../../utils/projects'
import { hm } from '../../utils/time'
import { useT, monthName, weekdaysMon } from '../../i18n'
import ProjectMultiSelect from './ProjectMultiSelect'

function isoWeekday(date: Date): number {
  return (date.getDay() + 6) % 7
}

function dayKey(date: Date): string {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
    .toISOString().slice(0, 10)
}

// Build CSS background for a calendar cell
function cellBackground(
  projData: Map<string, number>,
  projects: ReturnType<typeof useStore.getState>['projects'],
  intensity: number,
): string {
  if (projData.size === 0) return 'var(--panel-2)'

  const opacity = Math.round((0.1 + intensity * 0.75) * 100)

  // Only one project tracked this day (after filtering) → solid tint
  if (projData.size === 1) {
    const pid = Array.from(projData.keys())[0]!
    const color = projectColor(projects, pid)
    return `color-mix(in srgb, ${color} ${opacity}%, var(--panel-2))`
  }

  // Multiple projects → gradient split proportionally
  const total = Array.from(projData.values()).reduce((s, v) => s + v, 0)
  const sorted = Array.from(projData.entries()).sort((a, b) => b[1] - a[1])

  // Use ~55% opacity (8c hex) for each color stripe so it's not too heavy
  const alpha = Math.round(Math.max(0.25, 0.1 + intensity * 0.75) * 255)
    .toString(16).padStart(2, '0')

  const stops: string[] = []
  let pct = 0
  for (const [pid, ms] of sorted) {
    const color = projectColor(projects, pid)
    const share = (ms / total) * 100
    stops.push(`${color}${alpha} ${pct.toFixed(1)}%`)
    pct += share
    stops.push(`${color}${alpha} ${pct.toFixed(1)}%`)
  }

  return `linear-gradient(135deg, ${stops.join(', ')})`
}

interface CalendarViewProps {
  viewDate: Date
  onViewDateChange: (d: Date) => void
  /** Selected project ids. Empty = all projects (no filter). */
  filterProjects: string[]
  onFilterProjectsChange: (p: string[]) => void
}

export default function CalendarView({
  viewDate,
  onViewDateChange,
  filterProjects,
  onFilterProjectsChange,
}: CalendarViewProps) {
  const { entries, projects, settings } = useStore()
  const { t, locale } = useT()
  const showDescriptions = settings.showDescriptions
  const weekdays = weekdaysMon(locale)

  const today = new Date()
  const setViewDate = onViewDateChange

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  // Per-day per-project ms map
  const dayProjMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    for (const e of entries) {
      if (filterProjects.length && !filterProjects.includes(e.projectId)) continue
      const key = dayKey(new Date(e.start))
      if (!map.has(key)) map.set(key, new Map())
      const proj = map.get(key)!
      proj.set(e.projectId, (proj.get(e.projectId) ?? 0) + (e.end - e.start))
    }
    return map
  }, [entries, filterProjects])

  // Per-day list of entry descriptions (non-empty), newest first
  const dayDescMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!showDescriptions) return map
    const sorted = [...entries].sort((a, b) => b.start - a.start)
    for (const e of sorted) {
      if (filterProjects.length && !filterProjects.includes(e.projectId)) continue
      const desc = e.desc.trim()
      if (!desc) continue
      const key = dayKey(new Date(e.start))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(desc)
    }
    return map
  }, [entries, filterProjects, showDescriptions])

  // Total ms per day
  const dayTotalMap = useMemo(() => {
    const map = new Map<string, number>()
    dayProjMap.forEach((projData, key) => {
      map.set(key, Array.from(projData.values()).reduce((s, v) => s + v, 0))
    })
    return map
  }, [dayProjMap])

  // Max ms in current month for intensity scaling.
  // Scale by the busiest day across ALL projects (ignoring the current
  // filter) so a given day keeps the same shade whether the calendar shows
  // all projects or a single one.
  const maxMs = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of entries) {
      const key = dayKey(new Date(e.start))
      if (!key.startsWith(monthPrefix)) continue
      totals.set(key, (totals.get(key) ?? 0) + (e.end - e.start))
    }
    let max = 0
    totals.forEach(ms => { if (ms > max) max = ms })
    return max
  }, [entries, monthPrefix])

  // Calendar grid (Mon-first)
  const gridDays = useMemo(() => {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startOffset = isoWeekday(firstDay)
    const cells = Math.ceil((startOffset + lastDay.getDate()) / 7) * 7

    return Array.from({ length: cells }, (_, i) => {
      const dayNum = i - startOffset + 1
      return dayNum >= 1 && dayNum <= lastDay.getDate()
        ? new Date(year, month, dayNum)
        : null
    })
  }, [year, month])

  const todayKey = dayKey(today)

  const monthTotal = useMemo(() => {
    let total = 0
    dayTotalMap.forEach((ms, key) => {
      if (key.startsWith(monthPrefix)) total += ms
    })
    return total
  }, [dayTotalMap, monthPrefix])

  // Projects that appear in the current month → legend (color + name)
  const monthProjects = useMemo(() => {
    const ids = new Set<string>()
    dayProjMap.forEach((projData, key) => {
      if (!key.startsWith(monthPrefix)) return
      projData.forEach((_ms, pid) => ids.add(pid))
    })
    return Array.from(ids)
      .map(pid => ({
        id: pid,
        name: projectName(projects, pid),
        color: projectColor(projects, pid),
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [dayProjMap, monthPrefix, projects])

  return (
    <div>
      {/* Controls */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewDate(new Date(year, month - 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >‹</button>
          <span className="font-semibold text-base min-w-[150px] text-center" style={{ color: 'var(--ink)' }}>
            {monthName(locale, year, month)} {year}
          </span>
          <button
            onClick={() => setViewDate(new Date(year, month + 1, 1))}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >›</button>
          <button
            onClick={() => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="px-3 h-8 text-xs rounded-lg"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink-dim)' }}
          >{t('today')}</button>
        </div>

        <ProjectMultiSelect value={filterProjects} onChange={onFilterProjectsChange} />
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 mb-1">
        {weekdays.map(d => (
          <div key={d} className="text-center text-xs py-1.5 font-medium" style={{ color: 'var(--ink-mute)' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-1">
        {gridDays.map((day, i) => {
          if (!day) return <div key={`e-${i}`} style={{ minHeight: 120 }} />

          const key = dayKey(day)
          const totalMs = dayTotalMap.get(key) ?? 0
          const projData = dayProjMap.get(key) ?? new Map<string, number>()
          const isToday = key === todayKey
          const intensity = maxMs > 0 && totalMs > 0 ? totalMs / maxMs : 0

          const bg = totalMs > 0
            ? cellBackground(projData, projects, intensity)
            : 'var(--panel-2)'

          // Project color dots when multiple projects are tracked that day
          const projDots = projData.size > 1
            ? Array.from(projData.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 4)
                .map(([pid]) => projectColor(projects, pid))
            : []

          const textOnBg = intensity > 0.45

          // Border: today uses dominant project color, else default
          const dominantColor = projData.size > 0
            ? projectColor(projects, Array.from(projData.entries()).sort((a, b) => b[1] - a[1])[0]![0])
            : 'var(--accent)'

          const descs = dayDescMap.get(key) ?? []
          // Join all entries of the day into one flowing text and cut it to
          // what fits the cell (~120px wide, ~5 lines) instead of clipping.
          const fullDesc = descs.join(' · ')
          const MAX_DESC_CHARS = 90
          const shownDesc = fullDesc.length > MAX_DESC_CHARS
            ? fullDesc.slice(0, MAX_DESC_CHARS).trimEnd() + '…'
            : fullDesc

          return (
            <div
              key={key}
              className="rounded-lg p-2 flex flex-col justify-between gap-1 overflow-hidden"
              style={{
                // Each cell is at least 120×120; grows taller if needed.
                minHeight: 120,
                background: bg,
                border: isToday ? `2px solid ${dominantColor}` : '1px solid var(--line)',
              }}
            >
              {/* Day number — always readable: bright on any fill, accent on
                  an empty "today", muted on empty days. (Previously used the
                  project color on a same-colored fill → invisible.) */}
              <span
                className="text-xs font-semibold leading-none"
                style={{
                  color: totalMs > 0
                    ? 'var(--ink)'
                    : isToday ? 'var(--accent)' : 'var(--ink-dim)',
                }}
              >
                {day.getDate()}
              </span>

              {/* Descriptions: only when a single project is tracked that day.
                  With 2+ projects the day shows color dots instead (below). */}
              {showDescriptions && shownDesc && projData.size === 1 && (
                <div
                  className="flex-1 min-h-0 overflow-hidden text-[11px] leading-tight break-words line-clamp-5"
                  style={{ color: textOnBg ? 'var(--ink)' : 'var(--ink-dim)' }}
                  title={fullDesc}
                >
                  {shownDesc}
                </div>
              )}

              <div>
                {/* Project dots for multi-project days */}
                {projDots.length > 0 && (
                  <div className="flex gap-0.5 mb-0.5">
                    {projDots.map((c, idx) => (
                      <span key={idx} className="w-1.5 h-1.5 rounded-full" style={{ background: c }} />
                    ))}
                  </div>
                )}

                {/* Hours */}
                {totalMs > 0 && (
                  <span
                    className="text-[10px] font-mono tabular-nums leading-none block text-right"
                    style={{ color: textOnBg ? 'var(--ink)' : dominantColor, fontWeight: 500 }}
                  >
                    {hm(totalMs)}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend: project color + name for this month */}
      {monthProjects.length > 0 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
          {monthProjects.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 text-xs"
              style={{ color: 'var(--ink-dim)' }}
            >
              <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: p.color }} />
              {p.name}
            </div>
          ))}
        </div>
      )}

      {/* Month total */}
      {monthTotal > 0 && (
        <div className="mt-3 text-sm text-right" style={{ color: 'var(--ink-mute)' }}>
          {t('monthTotal')}{' '}
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{hm(monthTotal)}</span>
        </div>
      )}
    </div>
  )
}
