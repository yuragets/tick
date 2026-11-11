import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useStore } from '../../store/useStore'
import { projectColor, projectName } from '../../utils/projects'
import { hm, hms, timeInput } from '../../utils/time'
import { useT } from '../../i18n'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { Entry } from '../../types'

// Group by project once a day has this many entries across 2+ projects.
const GROUP_FROM = 5
// Drag distance (px) that closes the bottom sheet.
const SWIPE_CLOSE_PX = 80

interface Props {
  date: Date
  /** The day's entries (already filtered like the calendar cell). */
  entries: Entry[]
  onClose: () => void
}

/**
 * Details of one calendar day: a centered dialog on desktop, a bottom sheet
 * (swipe down / backdrop / ✕ to close) under 640px. Esc closes both.
 */
export default function DayDetails({ date, entries, onClose }: Props) {
  const { projects } = useStore()
  const { t, locale } = useT()
  const isMobile = useMediaQuery('(max-width: 639px)')
  const closeRef = useRef<HTMLButtonElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Latest onClose without re-running the mount effect on every render.
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  // Esc to close, lock page scroll, move focus in and give it back on close.
  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCloseRef.current() }
    window.addEventListener('keydown', onKey)
    // Hiding the scrollbar would widen the page; pad by its width so nothing
    // shifts. (scrollbar-gutter can't do this: the visible bar comes from
    // ::-webkit-scrollbar while the native one is overlay, so no gutter is
    // reserved.) Overlay scrollbars measure 0 → no padding on phones.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    const prevOverflow = document.body.style.overflow
    const prevPadding = document.body.style.paddingRight
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) document.body.style.paddingRight = `${scrollbarWidth}px`
    closeRef.current?.focus()
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPadding
      opener?.focus?.()
    }
  }, [])

  // ── Swipe down to close (mobile sheet) ──
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ startY: number; active: boolean } | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    // Only drag the sheet when its content is scrolled to the top.
    const atTop = (scrollRef.current?.scrollTop ?? 0) <= 0
    drag.current = { startY: e.touches[0]!.clientY, active: atTop }
    setDragging(atTop)
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!drag.current?.active) return
    setDragY(Math.max(0, e.touches[0]!.clientY - drag.current.startY))
  }
  function onTouchEnd() {
    if (dragY > SWIPE_CLOSE_PX) onClose()
    else setDragY(0)
    drag.current = null
    setDragging(false)
  }

  // ── Content ──
  const sorted = [...entries].sort((a, b) => a.start - b.start)
  const totalMs = sorted.reduce((s, e) => s + (e.end - e.start), 0)
  const byProject = new Map<string, Entry[]>()
  for (const e of sorted) {
    if (!byProject.has(e.projectId)) byProject.set(e.projectId, [])
    byProject.get(e.projectId)!.push(e)
  }
  const grouped = sorted.length >= GROUP_FROM && byProject.size > 1
  const groups = [...byProject.entries()]
    .map(([pid, list]) => ({ pid, list, ms: list.reduce((s, e) => s + (e.end - e.start), 0) }))
    .sort((a, b) => b.ms - a.ms)

  const title = date.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const titleCap = title.charAt(0).toUpperCase() + title.slice(1)

  const header = (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 id="day-details-title" className="text-base font-semibold" style={{ color: 'var(--ink)' }}>
          {titleCap}
        </h3>
        <div className="text-sm mt-0.5" style={{ color: 'var(--ink-mute)' }}>
          <span className="font-mono tabular-nums" style={{ color: 'var(--ink)' }}>{hm(totalMs)}</span>
          {' · '}{t('dayEntriesCount', { count: sorted.length })}
        </div>
      </div>
      <button
        ref={closeRef}
        onClick={onClose}
        className="w-8 h-8 flex-none flex items-center justify-center rounded-lg text-sm"
        style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink-dim)' }}
        title={t('dayDetailsClose')}
        aria-label={t('dayDetailsClose')}
      >
        ✕
      </button>
    </div>
  )

  const body = grouped ? (
    <div className="flex flex-col gap-4">
      {groups.map(g => (
        <section key={g.pid}>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: projectColor(projects, g.pid) }} />
            <span className="text-sm font-semibold flex-1" style={{ color: 'var(--ink)' }}>
              {projectName(projects, g.pid)}
            </span>
            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--ink-dim)' }}>{hm(g.ms)}</span>
          </div>
          <EntryRows entries={g.list} showProject={false} />
        </section>
      ))}
    </div>
  ) : (
    <EntryRows entries={sorted} showProject />
  )

  if (isMobile) {
    return (
      <Backdrop onClose={onClose} align="end">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="day-details-title"
          className="day-sheet w-full rounded-t-[18px] flex flex-col"
          style={{
            background: 'var(--panel)',
            borderTop: '1px solid var(--line-strong)',
            maxHeight: '85vh',
            transform: `translateY(${dragY}px)`,
            transition: dragging ? 'none' : 'transform .2s ease',
          }}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* Drag handle */}
          <div className="flex justify-center pt-2.5 pb-1.5">
            <span className="w-10 h-1 rounded-full" style={{ background: 'var(--line-strong)' }} />
          </div>
          <div ref={scrollRef} className="overflow-y-auto px-5 pb-6 pt-1" style={{ overscrollBehavior: 'contain' }}>
            {header}
            {body}
          </div>
        </div>
      </Backdrop>
    )
  }

  return (
    <Backdrop onClose={onClose} align="center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="day-details-title"
        className="w-full rounded-card flex flex-col"
        style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', maxWidth: 520, maxHeight: '80vh' }}
      >
        <div ref={scrollRef} className="overflow-y-auto p-6">
          {header}
          {body}
        </div>
      </div>
    </Backdrop>
  )
}

function Backdrop({ onClose, align, children }: { onClose: () => void; align: 'center' | 'end'; children: ReactNode }) {
  return (
    <div
      className={`fixed inset-0 z-50 flex justify-center ${align === 'end' ? 'items-end' : 'items-center p-5'}`}
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {children}
    </div>
  )
}

function EntryRows({ entries, showProject }: { entries: Entry[]; showProject: boolean }) {
  const { projects } = useStore()
  const { t } = useT()
  return (
    <ul className="flex flex-col">
      {entries.map((e, i) => (
        <li
          key={e.id}
          className="py-2.5"
          style={{ borderTop: i === 0 ? 'none' : '1px solid var(--line)' }}
        >
          <div className="flex items-center gap-2 flex-wrap">
            {showProject && (
              <>
                <span className="w-2 h-2 rounded-full flex-none" style={{ background: projectColor(projects, e.projectId) }} />
                <span className="text-sm font-medium" style={{ color: 'var(--ink)' }}>
                  {projectName(projects, e.projectId)}
                </span>
              </>
            )}
            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--ink-mute)' }}>
              {timeInput(e.start)}–{timeInput(e.end)}
            </span>
            <span className="flex-1" />
            <span className="text-xs font-mono tabular-nums" style={{ color: 'var(--ink)' }}>
              {hms(e.end - e.start)}
            </span>
          </div>
          <p
            className="text-sm mt-1 whitespace-pre-wrap break-words"
            style={{ color: e.desc ? 'var(--ink-dim)' : 'var(--ink-mute)' }}
          >
            {e.desc || t('noDescription')}
          </p>
          {e.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-1.5">
              {e.tags.map(tag => (
                <span
                  key={tag}
                  className="text-xs px-1.5 py-px rounded-md"
                  style={{ background: 'var(--panel-2)', color: 'var(--ink-dim)', border: '1px solid var(--line)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}
