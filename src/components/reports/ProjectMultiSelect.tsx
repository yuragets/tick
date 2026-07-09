import { useEffect, useRef, useState } from 'react'
import { useStore } from '../../store/useStore'
import { projectColor, projectName } from '../../utils/projects'
import { useT } from '../../i18n'

interface ProjectMultiSelectProps {
  /** Selected project ids. Empty array = all projects (no filter). */
  value: string[]
  onChange: (value: string[]) => void
}

/**
 * Multi-select project filter used by the reports/calendar views.
 *
 * Convention: an empty array means "all projects" (no filtering). One id
 * behaves exactly like the old single-select mode. The closed button shows
 * "All projects" when nothing or everything is selected, the project name
 * (with its color dot) for a single selection, and "N projects" otherwise.
 */
export default function ProjectMultiSelect({ value, onChange }: ProjectMultiSelectProps) {
  const { projects } = useStore()
  const { t } = useT()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on click outside.
  useEffect(() => {
    if (!open) return
    function onDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  // Selecting every project individually reads the same as "all".
  const isAll = value.length === 0 || value.length === projects.length
  const single = value.length === 1 ? value[0]! : null

  function toggle(id: string) {
    onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-[10px]"
        style={{
          backgroundColor: 'var(--panel-2)',
          border: '1px solid var(--line)',
          color: isAll ? 'var(--ink-dim)' : 'var(--ink)',
        }}
      >
        {single && (
          <span
            className="w-2.5 h-2.5 rounded-full flex-none"
            style={{ background: projectColor(projects, single) }}
          />
        )}
        <span>
          {isAll
            ? t('allProjects')
            : single
              ? projectName(projects, single)
              : t('nProjects', { count: value.length })}
        </span>
        <span style={{ color: 'var(--ink-mute)' }}>▾</span>
      </button>

      {open && (
        <div
          className="absolute right-0 z-20 mt-1 min-w-[180px] max-h-[280px] overflow-auto rounded-[10px] py-1"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}
        >
          {/* "All projects" clears the filter. */}
          <button
            type="button"
            onClick={() => onChange([])}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left"
            style={{ color: isAll ? 'var(--ink)' : 'var(--ink-dim)' }}
          >
            <span
              className="w-3.5 h-3.5 flex-none rounded-[4px] flex items-center justify-center text-[10px] leading-none"
              style={{
                border: '1px solid var(--line)',
                background: isAll ? 'var(--accent)' : 'transparent',
                color: 'var(--panel-2)',
              }}
            >
              {isAll ? '✓' : ''}
            </span>
            {t('allProjects')}
          </button>

          {projects.map(p => {
            const checked = value.includes(p.id)
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => toggle(p.id)}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-left"
                style={{ color: 'var(--ink)' }}
              >
                <span
                  className="w-3.5 h-3.5 flex-none rounded-[4px] flex items-center justify-center text-[10px] leading-none"
                  style={{
                    border: '1px solid var(--line)',
                    background: checked ? 'var(--accent)' : 'transparent',
                    color: 'var(--panel-2)',
                  }}
                >
                  {checked ? '✓' : ''}
                </span>
                <span
                  className="w-2.5 h-2.5 rounded-full flex-none"
                  style={{ background: projectColor(projects, p.id) }}
                />
                {p.name}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
