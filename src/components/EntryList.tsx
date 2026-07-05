import { useState } from 'react'
import { useStore } from '../store/useStore'
import { projectColor, projectName } from '../utils/projects'
import { hms, fmtDateTime } from '../utils/time'
import { useT } from '../i18n'

// Global modal state — shared via module-level setter
let _openEditModal: ((id: string) => void) | null = null
export function openEntryEdit(id: string) { _openEditModal?.(id) }
export function registerEditOpener(fn: (id: string) => void) { _openEditModal = fn }

export default function EntryList() {
  const { entries, projects, deleteEntry, settings } = useStore()
  const { t } = useT()
  const [filterProject, setFilterProject] = useState<string>('all')
  const [filterTag, setFilterTag] = useState('')

  // Collect all unique tags
  const allTags = Array.from(new Set(entries.flatMap(e => e.tags))).sort()

  const filtered = entries
    .filter(e => filterProject === 'all' || e.projectId === filterProject)
    .filter(e => !filterTag || e.tags.includes(filterTag))
    .sort((a, b) => b.end - a.end)
    .slice(0, 50)

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
          className="px-2.5 py-1 text-xs rounded-[8px] ml-auto"
          style={{
            background: 'var(--panel-2)',
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
            className="px-2.5 py-1 text-xs rounded-[8px]"
            style={{
              background: 'var(--panel-2)',
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
            {entries.length === 0 ? t('emptyStart') : t('emptyFiltered')}
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

                  {/* Delete */}
                  <button
                    onClick={() => deleteEntry(e.id)}
                    className="text-sm px-1.5 py-1 rounded transition-colors"
                    style={{ background: 'transparent', border: 'none', color: 'var(--ink-mute)' }}
                    title={t('delete')}
                  >
                    ✕
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      {entries.length > 50 && (
        <p className="text-xs text-center mt-2" style={{ color: 'var(--ink-mute)' }}>
          {t('showingLast50')}
        </p>
      )}
    </div>
  )
}
