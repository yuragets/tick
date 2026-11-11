import { useState } from 'react'
import { useStore } from '../store/useStore'
import { projectColor, projectName } from '../utils/projects'
import { hms, hm, fmtDateTime } from '../utils/time'
import { useConfirm } from '../hooks/useConfirm'
import { useT, monthName } from '../i18n'

// Global modal state — shared via module-level setter
let _openEditModal: ((id: string) => void) | null = null
export function openEntryEdit(id: string) { _openEditModal?.(id) }
export function registerEditOpener(fn: (id: string) => void) { _openEditModal = fn }

export default function EntryList() {
  const { entries, projects, deleteEntry, settings } = useStore()
  const { t, locale } = useT()
  // First day of the month being viewed; defaults to the current month.
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1)
  })
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterTag, setFilterTag] = useState('')
  // Two-click delete confirmation to avoid accidental removals.
  const { confirm, isArmed } = useConfirm()

  function handleDelete(id: string) {
    if (confirm(id)) deleteEntry(id)
  }

  // Collect all unique tags
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags))).sort()

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const monthStart = viewDate.getTime()
  const monthEnd = new Date(year, month + 1, 1).getTime()
  const now = new Date()
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth()

  const prev = new Date(year, month - 1, 1)
  const next = new Date(year, month + 1, 1)
  // Neighbour labels carry the year only when it differs from the viewed one.
  const navLabel = (d: Date) =>
    monthName(locale, d.getFullYear(), d.getMonth()) + (d.getFullYear() !== year ? ` ${d.getFullYear()}` : '')

  const filtered = entries
    .filter(e => e.start >= monthStart && e.start < monthEnd)
    .filter(e => filterProject === 'all' || e.projectId === filterProject)
    .filter(e => !filterTag || e.tags.includes(filterTag))
    .sort((a, b) => b.end - a.end)

  const monthTotal = filtered.reduce((sum, e) => sum + (e.end - e.start), 0)

  // Month navigation: neighbour month names instead of prev/next.
  // Rendered above and below the list.
  const MonthNav = () => (
    <div className="flex items-center justify-between gap-2 my-2.5">
      <button
        onClick={() => setViewDate(prev)}
        className="px-3 h-8 text-xs rounded-lg whitespace-nowrap"
        style={navBtnStyle}
      >
        ‹ {navLabel(prev)}
      </button>
      <div className="text-center min-w-0">
        <span className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
          {monthName(locale, year, month)} {year}
        </span>
        {monthTotal > 0 && (
          <span className="text-xs ml-2" style={{ color: 'var(--ink-mute)' }}>
            · {hm(monthTotal)}
          </span>
        )}
        {!isCurrentMonth && (
          <button
            onClick={() => setViewDate(new Date(now.getFullYear(), now.getMonth(), 1))}
            className="px-2.5 h-7 text-xs rounded-lg ml-2"
            style={navBtnStyle}
          >
            {t('today')}
          </button>
        )}
      </div>
      {/* No navigating past the current month; keep the slot to hold layout */}
      <button
        onClick={() => setViewDate(next)}
        className={`px-3 h-8 text-xs rounded-lg whitespace-nowrap ${isCurrentMonth ? 'invisible' : ''}`}
        style={navBtnStyle}
        disabled={isCurrentMonth}
      >
        {navLabel(next)} ›
      </button>
    </div>
  )

  const navBtnStyle = {
    background: 'var(--panel-2)',
    border: '1px solid var(--line)',
    color: 'var(--ink-dim)',
  }

  return (
    <div>
      {/* Section header */}
      <div className="flex items-center gap-3 mb-2.5 flex-wrap">
        <span
          className="text-xs font-medium uppercase tracking-widest"
          style={{ color: 'var(--ink-mute)' }}
        >
          {t('entries')}
        </span>

        {/* Project filter */}
        <select
          value={filterProject}
          onChange={e => setFilterProject(e.target.value)}
          className="select px-2.5 py-1 text-xs rounded-[8px] ml-auto"
          style={{
            backgroundColor: 'var(--panel-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink-dim)',
          }}
        >
          <option value="all">{t('allProjects')}</option>
          {projects.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        {/* Tag filter */}
        {allTags.length > 0 && (
          <select
            value={filterTag}
            onChange={e => setFilterTag(e.target.value)}
            className="select px-2.5 py-1 text-xs rounded-[8px]"
            style={{
              backgroundColor: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink-dim)',
            }}
          >
            <option value="">{t('allTags')}</option>
            {allTags.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        )}
      </div>

      <MonthNav />

      <div
        className="rounded-card"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          padding: '6px 20px',
        }}
      >
        {filtered.length === 0 ? (
          <p
            className="text-sm text-center py-4"
            style={{ color: 'var(--ink-mute)' }}
          >
            {entries.length === 0
              ? t('emptyStart')
              : filterProject !== 'all' || filterTag ? t('emptyFiltered') : t('emptyMonth')}
          </p>
        ) : (
          <ul>
            {filtered.map((e, i) => {
              const color = projectColor(projects, e.projectId)
              return (
                <li
                  key={e.id}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--line)' : undefined }}
                >
                  {/* Project color dot */}
                  <span
                    className="w-2 h-2 rounded-full flex-none"
                    style={{ background: color }}
                  />

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    {/* Row 1: project name (white) + date (gray) + tags */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-sm font-medium truncate" style={{ color: 'var(--ink)' }}>
                        {projectName(projects, e.projectId)}
                      </span>
                      <span className="text-xs" style={{ color: 'var(--ink-mute)' }}>
                        · {fmtDateTime(e.start)}
                      </span>
                      {e.tags.map(t => (
                        <span
                          key={t}
                          className="text-xs px-1.5 py-px rounded-md"
                          style={{
                            background: 'var(--panel-2)',
                            color: 'var(--ink-dim)',
                            border: '1px solid var(--line)',
                          }}
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                    {/* Row 2: description (gray) — gated by settings */}
                    {settings.showDescriptions && (
                      <div className="text-xs mt-0.5 truncate" style={{ color: 'var(--ink-mute)' }}>
                        {e.desc || t('noDescription')}
                      </div>
                    )}
                  </div>

                  {/* Duration */}
                  <span
                    className="font-mono text-sm tabular-nums flex-none"
                    style={{ color: 'var(--ink)' }}
                  >
                    {hms(e.end - e.start)}
                  </span>

                  {/* Edit */}
                  <button
                    onClick={() => openEntryEdit(e.id)}
                    className="text-sm px-1.5 py-1 rounded transition-colors"
                    style={{ background: 'transparent', border: 'none', color: 'var(--ink-mute)' }}
                    title={t('edit')}
                  >
                    ✎
                  </button>

                  {/* Delete — first click arms, second confirms */}
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-sm px-1.5 py-1 rounded transition-colors"
                    style={{
                      background: isArmed(e.id) ? 'var(--danger-bg)' : 'transparent',
                      border: 'none',
                      color: isArmed(e.id) ? 'var(--danger)' : 'var(--ink-mute)',
                    }}
                    title={isArmed(e.id) ? t('confirmDeleteHint') : t('delete')}
                  >
                    {isArmed(e.id) ? '✓' : '✕'}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {filtered.length > 0 && <MonthNav />}
    </div>
  )
}
