import type { Entry } from '../types'

/**
 * Collect the unique tags used across entries, ranked for autocomplete.
 * Tags used in `projectId`'s entries come first (most-used first); the
 * remaining tags from other projects follow (also most-used first). Passing
 * no `projectId` simply ranks every tag by overall frequency.
 */
export function collectTags(entries: Entry[], projectId?: string): string[] {
  const projectCount = new Map<string, number>()
  const otherCount = new Map<string, number>()

  for (const e of entries) {
    const target = projectId && e.projectId === projectId ? projectCount : otherCount
    for (const tag of e.tags) {
      target.set(tag, (target.get(tag) ?? 0) + 1)
    }
  }

  const byFreq = (m: Map<string, number>) =>
    Array.from(m.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag)

  const projectTags = byFreq(projectCount)
  const seen = new Set(projectTags)
  const otherTags = byFreq(otherCount).filter(t => !seen.has(t))

  return [...projectTags, ...otherTags]
}
