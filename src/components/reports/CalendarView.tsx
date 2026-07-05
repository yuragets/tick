import { useState, useMemo } from 'react'
import { useStore } from '../../store/useStore'
import { projectColor } from '../../utils/projects'
import { hm } from '../../utils/time'
import { useT, monthName, weekdaysMon } from '../../i18n'

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
  filterProject: string,
  projects: ReturnType<typeof useStore.getState>['projects'],
  intensity: number,
): string {
  if (projData.size === 0) return 'var(--panel-2)'

  const opacity = Math.round((0.1 + intensity * 0.75) * 100)

  // Single project selected OR only one project in this day
  if (filterProject !== 'all' || projData.size === 1) {
    const pid = filterProject !== 'all'
      ? filterProject
      : Array.from(projData.keys())[0]!
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

export default function CalendarView() {
  const { entries, projects, settings } = useStore()
  const { t, locale } = useT()
  const showDescriptions = settings.showDescriptions
  const weekdays = weekdaysMon(locale)

  const today = new Date()
  const [viewDate, setViewDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  )
  const [filterProject, setFilterProject] = useState<string>('all')

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`

  // Per-day per-project ms map
  const dayProjMap = useMemo(() => {
    const map = new Map<string, Map<string, number>>()
    for (const e of entries) {
      if (filterProject !== 'all' && e.projectId !== filterProject) continue
      const key = dayKey(new Date(e.start))
      if (!map.has(key)) map.set(key, new Map())
      const proj = map.get(key)!
      proj.set(e.projectId, (proj.get(e.projectId) ?? 0) + (e.end - e.start))
    }
    return map
  }, [entries, filterProject])

  // Per-day list of entry descriptions (non-empty), newest first
  const dayDescMap = useMemo(() => {
    const map = new Map<string, string[]>()
    if (!showDescriptions) return map
    const sorted = [...entries].sort((a, b) => b.start - a.start)
    for (const e of sorted) {
      if (filterProject !== 'all' && e.projectId !== filterProject) continue
      const desc = e.desc.trim()
      if (!desc) continue
      const key = dayKey(new Date(e.start))
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(desc)
    }
    return map
  }, [entries, filterProject, showDescriptions])

  // Total ms per day
  const dayTotalMap = useMemo(() => {
    const map = new Map<string, number>()
    dayProjMap.forEach((projData, key) => {
      map.set(key, Array.from(projData.values()).reduce((s, v) => s + v, 0))
    })
    return map
  }, [dayProjMap])

  // Max ms in current month for intensity scaling
  const maxMs = useMemo(() => {
    let max = 0
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${monthPrefix}-${String(d).padStart(2, '0')}`
      const ms = dayTotalMap.get(key) ?? 0
      if (ms > max) max = ms
    }
    return max
  }, [dayTotalMap, monthPrefix, year, month])

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

        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="px-2.5 py-1.5 text-sm rounded-[10px]"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
        >
          <option value="all">{t('allProjects')}</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
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
          if (!day) return <div key={`e-${i}`} style={{ aspectRatio: '1/1.1' }} />

          const key = dayKey(day)
          const totalMs = dayTotalMap.get(key) ?? 0
          const projData = dayProjMap.get(key) ?? new Map<string, number>()
          const isToday = key === todayKey
          const intensity = maxMs > 0 && totalMs > 0 ? totalMs / maxMs : 0

          const bg = totalMs > 0
            ? cellBackground(projData, filterProject, projects, intensity)
            : 'var(--panel-2)'

          // Project color dots (when "all" mode and multiple projects)
          const projDots = filterProject === 'all' && projData.size > 1
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

          return (
            <div
              key={key}
              className="rounded-lg p-1.5 flex flex-col justify-between gap-1"
              style={{
                // Let cells grow to fit descriptions; fixed square otherwise.
                aspectRatio: showDescriptions ? undefined : '1/1.1',
                minHeight: showDescriptions ? 76 : 56,
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

              {/* Descriptions (when enabled) */}
              {showDescriptions && descs.length > 0 && (
                <div className="flex-1 min-h-0 space-y-0.5">
                  {descs.slice(0, 3).map((d, idx) => (
                    <div
                      key={idx}
                      className="text-[10px] leading-tight break-words"
                      style={{ color: textOnBg ? 'var(--ink)' : 'var(--ink-dim)' }}
                      title={d}
                    >
                      {d}
                    </div>
                  ))}
                  {descs.length > 3 && (
                    <div className="text-[10px] leading-tight" style={{ color: 'var(--ink-mute)' }}>
                      +{descs.length - 3}
                    </div>
                  )}
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
