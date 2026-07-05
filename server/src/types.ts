// API-facing data model (mirrors the frontend src/types.ts).
// Time is milliseconds since epoch.

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
  start: number
  end: number
}

export interface RunningTimer {
  desc: string
  projectId: string
  tags: string[]
  start: number
}

export interface Settings {
  showDescriptions: boolean
}

export interface AppData {
  projects: Project[]
  entries: Entry[]
  running: RunningTimer | null
  settings?: Settings
}
