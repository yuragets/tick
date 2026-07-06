import { useState, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { rangeBounds, fmtDate } from '../../utils/time'
import { projectColor, projectName } from '../../utils/projects'
import { exportCSV, importFile } from '../../utils/csv'
import { fieldStyle } from '../../ui'
import { useT } from '../../i18n'
import type { ChartMode, ReportRange, CustomRange } from '../../types'
import StatsCards from './StatsCards'
import ReportChart from './ReportChart'
import type { ProjPoint, DayPoint } from './ReportChart'
import Breakdown from './Breakdown'
import CalendarView from './CalendarView'
import type { BreakdownItem } from './Breakdown'

export default function Reports() {
  const { entries, projects, mergeImport } = useStore()
  const { t } = useT()

  const [range, setRange] = useState<ReportRange>('today')
  const [custom, setCustom] = useState<CustomRange>({ from: '', to: '' })
  const [chartMode, setChartMode] = useState<ChartMode>('proj')
  const [filterProject, setFilterProject] = useState<string>('all')
  // Calendar state lives here so CSV export can follow the visible month.
  const now = new Date()
  const [calMonth, setCalMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1))
  const [calProject, setCalProject] = useState<string>('all')
  const [importError, setImportError] = useState<string | null>(null)
  const [importSuccess, setImportSuccess] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const [fromMs, toMs] = rangeBounds(range, custom)

  // Date-range filter first, then optional project filter
  const rangeFiltered = entries.filter(e => e.start >= fromMs && e.start <= toMs)
  const filtered = filterProject === 'all'
    ? rangeFiltered
    : rangeFiltered.filter(e => e.projectId === filterProject)

  // ── Stats ──────────────────────────────────────────
  let totalMs = 0
  const byProj: Record<string, number> = {}
  for (const e of filtered) {
    const d = e.end - e.start
    totalMs += d
    byProj[e.projectId] = (byProj[e.projectId] ?? 0) + d
  }

  // ── Proj chart ─────────────────────────────────────
  const projIds = Object.keys(byProj).sort((a, b) => (byProj[b] ?? 0) - (byProj[a] ?? 0))

  const projData: ProjPoint[] = projIds.map(id => ({
    label: projectName(projects, id),
    value: +((byProj[id] ?? 0) / 3_600_000).toFixed(2),
    color: projectColor(projects, id),
  }))

  const breakdownItems: BreakdownItem[] = projIds.map(id => ({
    label: projectName(projects, id),
    color: projectColor(projects, id),
    ms: byProj[id] ?? 0,
    pct: totalMs ? Math.round(((byProj[id] ?? 0) / totalMs) * 100) : 0,
  }))

  // ── Day chart (stacked by project) ─────────────────
  // Collect days and per-project hours per day
  const dayMap: Record<string, Record<string, number>> = {}
  // Earliest timestamp seen per day label — used for locale-independent
  // chronological sorting (the label format varies by language).
  const dayFirstMs: Record<string, number> = {}
  for (const e of filtered) {
    const day = fmtDate(e.start)
    if (!dayMap[day]) dayMap[day] = {}
    dayMap[day]![e.projectId] = (dayMap[day]![e.projectId] ?? 0) + (e.end - e.start)
    dayFirstMs[day] = Math.min(dayFirstMs[day] ?? Infinity, e.start)
  }

  const sortedDays = Object.keys(dayMap).sort(
    (a, b) => (dayFirstMs[a] ?? 0) - (dayFirstMs[b] ?? 0)
  )

  // Projects that actually appear in the filtered range
  const activeProjectIds = Array.from(
    new Set(filtered.map(e => e.projectId))
  )
  const dayProjects = projects.filter(p => activeProjectIds.includes(p.id))

  const dayData: DayPoint[] = sortedDays.map(day => {
    const row: DayPoint = { label: day }
    for (const p of dayProjects) {
      row[p.id] = +((dayMap[day]?.[p.id] ?? 0) / 3_600_000).toFixed(2)
    }
    return row
  })

  // Breakdown for day mode
  const dayBreakdown: BreakdownItem[] = sortedDays.map(day => {
    const ms = Object.values(dayMap[day] ?? {}).reduce((s, v) => s + v, 0)
    return { label: day, color: 'var(--accent)', ms, pct: 0 }
  })

  // ── Import ─────────────────────────────────────────
  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setImportError(null)
    setImportSuccess(null)
    const result = await importFile(file)
    if (!result.ok) {
      setImportError(result.error)
    } else {
      mergeImport(result.projects, result.entries)
      setImportSuccess(t('importSuccess', { entries: result.entries.length, projects: result.projects.length }))
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const rangeLabel = range === 'custom' ? 'custom' : range
  const isCalendar = chartMode === 'calendar'

  // In calendar mode the range selector is hidden, so export follows the
  // month + project shown in the calendar rather than the (unused) range.
  const calFrom = new Date(calMonth.getFullYear(), calMonth.getMonth(), 1).getTime()
  const calTo = new Date(calMonth.getFullYear(), calMonth.getMonth() + 1, 0, 23, 59, 59, 999).getTime()
  const calEntries = entries.filter(e =>
    e.start >= calFrom && e.start <= calTo &&
    (calProject === 'all' || e.projectId === calProject)
  )
  const calLabel = `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}`

  const exportEntries = isCalendar ? calEntries : filtered
  const exportLabel = isCalendar ? calLabel : rangeLabel

  return (
    <div>
      {/* ── Range selector ── */}
      {!isCalendar && (
        <div className="flex gap-1.5 flex-wrap mb-3.5">
          {(['today', 'week', 'month', 'custom'] as ReportRange[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className="px-4 py-1.5 text-sm rounded-[10px] border transition-all"
              style={range === r
                ? { background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                : { background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink-dim)' }
              }
            >
              {r === 'today' ? t('rangeToday') : r === 'week' ? t('rangeWeek') : r === 'month' ? t('rangeMonth') : t('rangeCustom')}
            </button>
          ))}
        </div>
      )}

      {/* ── Custom date range ── */}
      {!isCalendar && range === 'custom' && (
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          <input type="date" value={custom.from}
            onChange={e => setCustom(c => ({ ...c, from: e.target.value }))}
            className="flex-1 px-3 py-2 text-sm rounded-[10px]"
            style={fieldStyle}
          />
          <span style={{ color: 'var(--ink-mute)' }}>→</span>
          <input type="date" value={custom.to}
            onChange={e => setCustom(c => ({ ...c, to: e.target.value }))}
            className="flex-1 px-3 py-2 text-sm rounded-[10px]"
            style={fieldStyle}
          />
        </div>
      )}

      {/* ── Stats ── */}
      {!isCalendar && (
        <StatsCards
          totalMs={totalMs}
          entryCount={filtered.length}
          projectCount={Object.keys(byProj).length}
        />
      )}

      {/* ── Chart mode + Project filter + Export/Import ── */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        {/* Left: chart modes */}
        <div className="flex gap-1.5 flex-wrap">
          {([
            { id: 'proj',     label: t('chartProjects') },
            { id: 'day',      label: t('chartDays')     },
            { id: 'calendar', label: t('chartCalendar') },
          ] as { id: ChartMode; label: string }[]).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setChartMode(id)}
              className="px-3.5 py-1.5 text-sm rounded-[10px] border transition-all"
              style={chartMode === id
                ? { background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }
                : { background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink-dim)' }
              }
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: project filter + import/export */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Project filter */}
          {!isCalendar && (
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="select px-2.5 py-1.5 text-sm rounded-[10px]"
              style={{
                backgroundColor: 'var(--panel-2)',
                border: '1px solid var(--line)',
                color: filterProject === 'all' ? 'var(--ink-dim)' : 'var(--ink)',
              }}
            >
              <option value="all">{t('allProjects')}</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          )}

          {/* Import */}
          <label className="text-sm cursor-pointer" style={{ color: 'var(--accent)' }}>
            {t('import')}
            <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImport} />
          </label>

          {/* Export */}
          <button
            onClick={() => exportCSV(exportEntries, projects, exportLabel)}
            className="text-sm"
            style={{ background: 'transparent', border: 'none', color: 'var(--accent)', padding: '0' }}
          >
            {t('csv')}
          </button>
        </div>
      </div>

      {/* ── Import feedback ── */}
      {importError && (
        <div className="text-sm px-3 py-2 rounded-[10px] mb-3"
          style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
          {importError}
        </div>
      )}
      {importSuccess && (
        <div className="text-sm px-3 py-2 rounded-[10px] mb-3"
          style={{ background: 'var(--accent-bg)', color: 'var(--ok)', border: '1px solid var(--ok)' }}>
          {importSuccess}
        </div>
      )}

      {/* ── Calendar ── */}
      {isCalendar && (
        <CalendarView
          viewDate={calMonth}
          onViewDateChange={setCalMonth}
          filterProject={calProject}
          onFilterProjectChange={setCalProject}
        />
      )}

      {/* ── Proj chart ── */}
      {chartMode === 'proj' && (
        <>
          <ReportChart mode="proj" projData={projData} />
          <Breakdown items={breakdownItems} mode="proj" />
        </>
      )}

      {/* ── Day chart ── */}
      {chartMode === 'day' && (
        <>
          <ReportChart mode="day" dayData={dayData} dayProjects={dayProjects} />
          <Breakdown items={dayBreakdown} mode="day" />
        </>
      )}
    </div>
  )
}
