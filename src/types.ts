export interface Project {
  id: string
  name: string
  color?: string
}

export interface Entry {
  id: string
  desc: string
  projectId: string
  tags: string[]
  start: number  // ms epoch
  end: number    // ms epoch
}

export interface RunningTimer {
  desc: string
  projectId: string
  tags: string[]
  start: number  // ms epoch
  pausedAt?: number | null  // ms epoch when paused; absent/null while running
  pausedMs?: number         // total paused time accumulated before the current run
}

export type Lang = 'en' | 'uk'

export interface Settings {
  /** Show each entry's text description in the list / calendar. */
  showDescriptions: boolean
  /** UI language. */
  lang: Lang
}

export interface AppData {
  projects: Project[]
  entries: Entry[]
  running: RunningTimer | null
  settings?: Settings
}

export type ReportRange = 'today' | 'week' | 'month' | 'custom'
export type ChartMode = 'proj' | 'day' | 'calendar'
export type Theme = 'dark' | 'light'

export interface CustomRange {
  from: string  // YYYY-MM-DD
  to: string    // YYYY-MM-DD
}
