import { t, getLocale } from '../i18n'

const pad = (n: number) => String(Math.floor(n)).padStart(2, '0')

export function hms(ms: number): string {
  const s = ms / 1000
  return `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`
}

export function hm(ms: number): string {
  const m = Math.round(ms / 60_000)
  return `${Math.floor(m / 60)}${t('unitHour')} ${m % 60}${t('unitMinute')}`
}

export function dtLocal(t: number): string {
  const d = new Date(t - new Date().getTimezoneOffset() * 60_000)
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
