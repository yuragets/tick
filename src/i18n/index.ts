import { useStore } from '../store/useStore'
import type { Lang } from '../types'
import en from './en'
import uk from './uk'

/** The reference dictionary shape — every language must implement these keys. */
export type Dict = typeof en
export type TKey = keyof Dict
export type TParams = Record<string, string | number>

const DICTS: Record<Lang, Dict> = { en, uk }
const LOCALES: Record<Lang, string> = { en: 'en-US', uk: 'uk-UA' }

/**
 * Module-level mirror of the active language, kept in sync by the store
 * (see setActiveLang). It lets pure, non-React utilities — time.ts, csv.ts —
 * localise without threading `lang` through every call site. React components
 * should use the `useT()` hook instead so they re-render when the language
 * changes.
 */
let currentLang: Lang = 'en'

export function setActiveLang(lang: Lang): void {
  currentLang = lang
  if (typeof document !== 'undefined') document.documentElement.lang = lang
}

function interpolate(str: string, params?: TParams): string {
  if (!params) return str
  return str.replace(/\{(\w+)\}/g, (_, k) => (k in params ? String(params[k]) : `{${k}}`))
}

export function translate(lang: Lang, key: TKey, params?: TParams): string {
  const str = DICTS[lang][key] ?? DICTS.en[key] ?? key
  return interpolate(str, params)
}

/** For pure modules — uses the module-level active language. */
export function t(key: TKey, params?: TParams): string {
  return translate(currentLang, key, params)
}

/** BCP-47 locale for the active language (for Intl / toLocale* calls). */
export function getLocale(): string {
  return LOCALES[currentLang]
}

/** React hook: returns a bound `t`, the active language and its locale. */
export function useT() {
  const lang = useStore(s => s.settings.lang)
  return {
    t: (key: TKey, params?: TParams) => translate(lang, key, params),
    lang,
    locale: LOCALES[lang],
  }
}

/** Capitalised localised month name, e.g. "July" / "Липень". */
export function monthName(locale: string, year: number, month: number): string {
  const s = new Date(year, month, 1).toLocaleDateString(locale, { month: 'long' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** Short weekday names, Monday-first, e.g. ["Mon", …] / ["Пн", …]. */
export function weekdaysMon(locale: string): string[] {
  const fmt = new Intl.DateTimeFormat(locale, { weekday: 'short' })
  // 2024-01-01 is a Monday.
  return Array.from({ length: 7 }, (_, i) => {
    const s = fmt.format(new Date(2024, 0, 1 + i))
    return s.charAt(0).toUpperCase() + s.slice(1)
  })
}
