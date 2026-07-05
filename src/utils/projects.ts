import type { Project } from '../types'
import { PALETTE } from './constants'

export function projectColor(projects: Project[], id: string): string {
  const idx = projects.findIndex(p => p.id === id)
  if (idx === -1) return PALETTE[0]!
  return projects[idx]!.color ?? PALETTE[idx % PALETTE.length]!
}

export function projectName(projects: Project[], id: string): string {
  return projects.find(p => p.id === id)?.name ?? '—'
}
