import { t, getLocale } from '../i18n'
import type { RunningTimer } from '../types'

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')

/** Worked milliseconds for a running timer, excluding any paused spans. */
export function runningElapsed(r: RunningTimer, now = Date.now()): number {
  const ref = r.pausedAt ?? now
  return Math.max(0, ref - r.start - (r.pausedMs ?? 0))
}

export function hms(ms: number): string {
  const s = ms / 1000
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`
}

export function hm(ms: number): string {
  const m = Math.round(ms / 60_000)
  return `${Math.floor(m / 60)}${t('unitHour')} ${m % 60}${t('unitMinute')}`
}

/** Local time-of-day as "HH:MM", for a native <input type="time">. */
export function timeInput(ms: number): string {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Apply an "HH:MM" time-of-day to the calendar day of `baseMs`.
 * Returns null if the string is not a valid time.
 */
export function applyTimeOfDay(baseMs: number, hhmm: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm)
  if (!m) return null
  const h = +m[1], min = +m[2]
  if (h > 23 || min > 59) return null
  const d = new Date(baseMs)
  d.setHours(h, min, 0, 0)
  return d.getTime()
}

export function dtLocal(ms: number): string {
  const d = new Date(ms - new Date().getTimezoneOffset() * 60_000)
  return d.toISOString().slice(0, 16)
}

export function parseDatetimeLocal(s: string): number {
  return new Date(s).getTime()
}

export function rangeBounds(
  range: 'today' | 'week' | 'month' | 'custom',
  custom?: { from: string; to: string },
): [number, number] {
  const now = new Date()
  let from: Date
  const to = new Date(now)
  to.setHours(23, 59, 59, 999)

  if (range === 'today') {
    from = new Date(now)
    from.setHours(0, 0, 0, 0)
  } else if (range === 'week') {
    from = new Date(now)
    from.setDate(now.getDate() - 6)
    from.setHours(0, 0, 0, 0)
  } else if (range === 'month') {
    from = new Date(now.getFullYear(), now.getMonth(), 1)
  } else {
    from = custom?.from ? new Date(custom.from + 'T00:00:00') : new Date(0)
    const toCustom = custom?.to ? new Date(custom.to + 'T23:59:59') : to
    return [from.getTime(), toCustom.getTime()]
  }

  return [from.getTime(), to.getTime()]
}

export function fmtDate(ms: number): string {
  return new Date(ms).toLocaleDateString(getLocale(), {
    day: '2-digit',
    month: '2-digit',
  })
}

export function fmtDateTime(ms: number): string {
  return new Date(ms).toLocaleString(getLocale(), {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
