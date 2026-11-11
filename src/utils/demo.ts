import type { Entry, Project } from '../types'
import { PALETTE } from './constants'

/** Every demo project / entry id starts with this, so they can be removed later. */
export const DEMO_PREFIX = 'demo-'

export const isDemoId = (id: string) => id.startsWith(DEMO_PREFIX)

const PROJECTS: Project[] = [
  { id: 'demo-p1', name: 'Client website', color: PALETTE[0] },
  { id: 'demo-p2', name: 'Mobile app', color: PALETTE[1] },
  { id: 'demo-p3', name: 'Admin', color: PALETTE[2] },
  { id: 'demo-p4', name: 'Marketing site', color: PALETTE[4] },
  { id: 'demo-p5', name: 'Personal learning', color: PALETTE[3] },
]

// Per-project task pool: [description, tags]
const TASKS: Record<string, [string, string[]][]> = {
  'demo-p1': [
    ['Homepage hero redesign', ['design']],
    ['Fix checkout form validation', ['bug']],
    ['Review pull requests', ['review']],
    ['Blog page performance', ['frontend', 'perf']],
    ['Product filters on the catalog page', ['frontend']],
    ['Accessibility pass on forms', ['a11y']],
    ['Payment provider webhook', ['backend']],
    ['Cart page polish after QA', ['frontend', 'qa']],
    ['Search results pagination', ['frontend']],
  ],
  'demo-p2': [
    ['Onboarding screens', ['design']],
    ['Push notifications API', ['backend']],
    ['Release testing', ['qa']],
    ['Offline sync bug', ['bug']],
    ['Settings screen refactor', ['refactor']],
    ['Crash report triage', ['bug']],
    ['Dark mode for the profile screen', ['frontend']],
    ['App store screenshots', ['release']],
  ],
  'demo-p3': [
    ['Weekly planning', ['meeting']],
    ['Invoices and email', []],
    ['Client call', ['meeting']],
    ['Standup', ['meeting']],
    ['Estimates for the next sprint', ['planning']],
    ['1:1 with the team lead', ['meeting']],
  ],
  'demo-p4': [
    ['Landing page copy', ['content']],
    ['Pricing page layout', ['design']],
    ['SEO meta tags and sitemap', ['seo']],
    ['Case study page', ['content']],
    ['Newsletter signup form', ['frontend']],
    ['Analytics events setup', ['analytics']],
  ],
  'demo-p5': [
    ['TypeScript generics course', ['learning']],
    ['Reading: Designing Data-Intensive Applications', ['reading']],
    ['Side project: CLI tool', ['side-project']],
    ['Conference talk notes', ['learning']],
    ['Rust exercises', ['learning']],
  ],
}

// Main work projects and how often each leads a day.
const MAIN: [string, number][] = [['demo-p1', 0.4], ['demo-p2', 0.35], ['demo-p4', 0.25]]

const MIN = 60_000
const MONTHS_BACK = 3

/** Small deterministic PRNG (LCG). */
function rng(seed: number) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

/**
 * One generator per calendar date, so a given day always looks the same no
 * matter when the demo is loaded — screenshots stay stable.
 */
function dayRng(day: Date) {
  const r = rng(day.getFullYear() * 10_000 + (day.getMonth() + 1) * 100 + day.getDate())
  r(); r()  // warm up: neighbouring seeds start out correlated
  return r
}

function weighted(r: () => number, items: [string, number][]): string {
  let x = r() * items.reduce((s, [, w]) => s + w, 0)
  for (const [v, w] of items) {
    x -= w
    if (x <= 0) return v
  }
  return items[items.length - 1]![0]
}

const sameDate = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

/** A week of vacation (Mon–Fri) in the middle of the month two months back. */
function vacationDays(now: Date): Date[] {
  const d = new Date(now.getFullYear(), now.getMonth() - 2, 12)
  while (d.getDay() !== 1) d.setDate(d.getDate() + 1)
  return Array.from({ length: 5 }, (_, i) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + i))
}

/** Planned [projectId, minutes] blocks for one day, in time order. */
function planDay(day: Date, r: () => number): [string, number][] {
  const dow = day.getDay()

  // Weekends: rarely, and short — side projects or a bit of marketing work.
  if (dow === 0 || dow === 6) {
    if (r() > 0.15) return []
    return [[r() < 0.7 ? 'demo-p5' : 'demo-p4', 30 + Math.floor(r() * 60)]]
  }
  if (r() < 0.04) return []  // the odd sick day

  const target = 240 + Math.floor(r() * 240)  // 4–8 h
  const busy = r() < 0.25                      // meeting-heavy, fragmented day
  const main = weighted(r, MAIN)
  const second = r() < 0.5 ? weighted(r, MAIN.filter(([p]) => p !== main)) : null

  // Side blocks first (all inside the day's target), then split the rest
  // of the time across the main work.
  const admin = busy || r() < 0.45 ? 15 + Math.floor(r() * 30) : 0  // standup / email
  const call = busy && r() < 0.6 ? 20 + Math.floor(r() * 25) : 0     // afternoon call
  const learning = r() < 0.12 ? 30 + Math.floor(r() * 30) : 0        // after-work learning
  const left = target - admin - call - learning

  const blocks: [string, number][] = []
  if (admin) blocks.push(['demo-p3', admin])
  const n = busy ? 4 + Math.floor(r() * 3) : 2 + Math.floor(r() * 2)
  const weights = Array.from({ length: n }, () => 0.5 + r())
  const wSum = weights.reduce((s, w) => s + w, 0)
  for (let i = 0; i < n; i++) {
    const pid = second && r() < 0.35 ? second : main
    blocks.push([pid, Math.round((left * weights[i]!) / wSum)])
  }
  if (call) blocks.push(['demo-p3', call])
  if (learning) blocks.push(['demo-p5', learning])
  return blocks
}

/**
 * Realistic history from the first day of the month three months back up to
 * now: 4–8 h weekdays, occasional short weekends, a vacation week, some
 * fragmented days with 5+ entries. Entries never end in the future.
 */
export function buildDemoData(nowMs = Date.now()): { projects: Project[]; entries: Entry[] } {
  const now = new Date(nowMs)
  const vacation = vacationDays(now)
  const entries: Entry[] = []

  for (
    const day = new Date(now.getFullYear(), now.getMonth() - MONTHS_BACK, 1);
    day <= now;
    day.setDate(day.getDate() + 1)
  ) {
    if (vacation.some(v => sameDate(v, day))) continue
    const r = dayRng(day)
    const blocks = planDay(day, r)
    if (!blocks.length) continue

    const weekend = day.getDay() === 0 || day.getDay() === 6
    let t = new Date(day.getFullYear(), day.getMonth(), day.getDate(),
      weekend ? 11 : 9, Math.floor(r() * (weekend ? 120 : 45))).getTime()
    let lunchTaken = false
    let lastDesc = ''
    const key = `${day.getFullYear()}${String(day.getMonth() + 1).padStart(2, '0')}${String(day.getDate()).padStart(2, '0')}`

    for (const [i, [projectId, minutes]] of blocks.entries()) {
      // Pick a task, never repeating the previous entry's description.
      const pool = TASKS[projectId]!.filter(([d]) => d !== lastDesc)
      const [desc, tags] = pool[Math.floor(r() * pool.length)]!
      lastDesc = desc

      const start = t
      const end = start + minutes * MIN + Math.floor(r() * 60) * 1000
      if (end > nowMs) break
      entries.push({ id: `demo-e${key}-${i}`, desc, projectId, tags, start, end })

      t = end + (5 + Math.floor(r() * 25)) * MIN
      if (!lunchTaken && new Date(t).getHours() >= 12) {
        t += (30 + Math.floor(r() * 30)) * MIN
        lunchTaken = true
      }
    }
  }

  // Newest first, like entries created by the timer.
  entries.sort((a, b) => b.start - a.start)
  return { projects: PROJECTS, entries }
}
