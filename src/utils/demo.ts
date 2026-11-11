import type { Entry, Project } from '../types'
import { PALETTE } from './constants'

/** Every demo project / entry id starts with this, so they can be removed later. */
export const DEMO_PREFIX = 'demo-'

export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX)

const PROJECTS: Project[] = [
  { id: 'demo-p1', name: 'Client website', color: PALETTE[0] },
  { id: 'demo-p2', name: 'Mobile app', color: PALETTE[1] },
  { id: 'demo-p3', name: 'Admin', color: PALETTE[2] },
]

// [projectId, description, tags]
const TASKS: [string, string, string[]][] = [
  ['demo-p1', 'Homepage hero redesign', ['design']],
  ['demo-p1', 'Fix checkout form validation', ['bug']],
  ['demo-p1', 'Review pull requests', ['review']],
  ['demo-p1', 'Blog page performance', ['frontend']],
  ['demo-p2', 'Onboarding screens', ['design']],
  ['demo-p2', 'Push notifications API', ['backend']],
  ['demo-p2', 'Release 1.4 testing', ['qa']],
  ['demo-p2', 'Offline sync bug', ['bug']],
  ['demo-p3', 'Weekly planning', ['meeting']],
  ['demo-p3', 'Invoices and email', []],
  ['demo-p3', 'Client call', ['meeting']],
]

// Small deterministic PRNG so the demo looks the same on every load.
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296
    return seed / 4294967296
  }
}

/**
 * Realistic-looking week of work ending today: 2–4 entries per weekday,
 * a light Saturday, nothing on Sunday. Entries never end in the future.
 */
export function buildDemoData(now = Date.now()): { projects: Project[]; entries: Entry[] } {
  const rand = rng(42)
  const pick = <T,>(arr: T[]) => arr[Math.floor(rand() * arr.length)]!
  const entries: Entry[] = []
  const MIN = 60_000

  for (let back = 6; back >= 0; back--) {
    const day = new Date(now)
    day.setDate(day.getDate() - back)
    const dow = day.getDay()
    if (dow === 0) continue
    const count = dow === 6 ? 1 : 2 + Math.floor(rand() * 3)

    // Work day starts between 9:00 and 10:00.
    let t = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, Math.floor(rand() * 60)).getTime()
    for (let i = 0; i < count; i++) {
      const [projectId, desc, tags] = pick(TASKS)
      const duration = (20 + Math.floor(rand() * 150)) * MIN + Math.floor(rand() * 60) * 1000  // 20 min – 2h50
      const start = t
      const end = start + duration
      if (end > now) break
      entries.push({ id: `demo-e${entries.length}`, desc, projectId, tags, start, end })
      t = end + (10 + Math.floor(rand() * 50)) * MIN  // break between tasks
    }
  }

  // Newest first, like entries created by the timer.
  entries.sort((a, b) => b.start - a.start)
  return { projects: PROJECTS, entries }
}
