// Project colors. Kept in JS (not CSS vars) because they're used
// programmatically — recharts fills, color-mix() strings, per-index lookup.
// All verified ≥ 4.5:1 on the dark background; indigo was brightened
// (#7f77dd → #8b83ea) for the tinted-chip case and to separate it from
// the purple (#b06ee0).
export const PALETTE = [
  '#6ea8fe', '#5ec49a', '#e0b15e', '#8b83ea',
  '#e07ba4', '#e08a5e', '#5ec4c4', '#b06ee0',
]

export const STORAGE_KEY = 'chronos-v1'
export const IMPORT_MAX_BYTES = 5 * 1024 * 1024   // 5 MB
export const IMPORT_MAX_ENTRIES = 10_000
export const IMPORT_MAX_STR_LEN = 500

import type { Settings } from '../types'

export const DEFAULT_SETTINGS: Settings = {
  showDescriptions: true,
  lang: 'en',
}
