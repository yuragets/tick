import { create } from 'zustand'
import type { AppData, Entry, Lang, Project, RunningTimer, Settings, Theme } from '../types'
import { createStorageAdapter, StorageUnavailableError } from '../storage'
import { readLegacyData, hasLegacyData, isBackendEmpty } from '../storage/migration'
import { DEFAULT_SETTINGS } from '../utils/constants'
import { runningElapsed } from '../utils/time'
import { t, setActiveLang } from '../i18n'

const adapter = createStorageAdapter()

const DEFAULT_PROJECT: Project = { id: 'p1', name: 'General' }

type Status = 'loading' | 'ready' | 'error'

interface StoreState extends AppData {
  theme: Theme
  activeProjectId: string

  // Lifecycle / connectivity
  status: Status
  errorMessage: string | null
  saveError: boolean

  // Init
  hydrate: () => Promise<void>

  // Theme
  setTheme: (t: Theme) => void

  // Settings
  settings: Settings
  setShowDescriptions: (v: boolean) => void
  setLang: (l: Lang) => void

  // Timer
  setActiveProject: (id: string) => void
  startTimer: (desc: string, projectId: string, tags: string[]) => void
  updateRunning: (patch: Partial<Pick<RunningTimer, 'start' | 'projectId'>>) => void
  pauseTimer: () => void
  resumeTimer: () => void
  stopTimer: () => void

  // Projects
  addProject: (name: string) => void
  updateProject: (id: string, patch: { name?: string; color?: string }) => void
  deleteProject: (id: string) => void

  // Entries
  updateEntry: (id: string, patch: Partial<Omit<Entry, 'id'>>) => void
  deleteEntry: (id: string) => void

  // Import
  mergeImport: (projects: Project[], entries: Entry[]) => void
}

export const useStore = create<StoreState>((set, get) => {
  /**
   * Persist the whole current state to the backend. Fire-and-forget:
   * actions update the UI optimistically, this runs in the background and
   * flips `saveError` if the service is unreachable.
   */
  async function persist() {
    try {
      const { projects, entries, running, settings } = get()
      await adapter.save({ projects, entries, running, settings })
      if (get().saveError) set({ saveError: false })
    } catch (e) {
      console.error('[store] Save failed:', e)
      set({ saveError: true })
    }
  }

  function applyLoaded(data: AppData) {
    const projects = data.projects.length ? data.projects : [DEFAULT_PROJECT]
    // Merge over defaults so older data without a `lang` field stays valid.
    const settings: Settings = { ...DEFAULT_SETTINGS, ...(data.settings ?? {}) }
    setActiveLang(settings.lang)
    set({
      projects,
      entries: data.entries,
      running: data.running,
      settings,
      activeProjectId: projects[0]?.id ?? 'p1',
      status: 'ready',
    })
  }

  return {
    // AppData defaults (real data arrives via hydrate)
    projects: [DEFAULT_PROJECT],
    entries: [],
    running: null,
    settings: DEFAULT_SETTINGS,

    theme: 'dark',
    activeProjectId: 'p1',

    status: 'loading',
    errorMessage: null,
    saveError: false,

    async hydrate() {
      set({ status: 'loading', errorMessage: null })

      // Cold-start race: Vite serves the page in ~0.4s but the backend
      // (tsx + native better-sqlite3) can take a couple seconds to accept
      // connections. Retry a few times before showing the error screen.
      const MAX_ATTEMPTS = 6
      const RETRY_DELAY = 700

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const data = await adapter.load()

          if (!isBackendEmpty(data)) {
            applyLoaded(data!)
            return
          }

          // Backend is empty. If the browser holds old data, migrate it
          // automatically (no prompt). The localStorage copy is left intact
          // as a safety net.
          const legacy = readLegacyData()

          if (hasLegacyData(legacy)) {
            try {
              await adapter.save(legacy)
            } catch {
              // If the save fails we still show the data in memory; the next
              // mutation will retry persisting it.
            }
            applyLoaded(legacy)
          } else {
            // Truly fresh install — seed a default project and persist once.
            set({
              status: 'ready',
              projects: [DEFAULT_PROJECT],
              entries: [],
              running: null,
              activeProjectId: DEFAULT_PROJECT.id,
            })
            void persist()
          }
          return
        } catch (e) {
          const unreachable = e instanceof StorageUnavailableError
          if (unreachable && attempt < MAX_ATTEMPTS) {
            await new Promise(r => setTimeout(r, RETRY_DELAY))
            continue
          }
          set({
            status: 'error',
            errorMessage: unreachable ? t('errBackendDown') : t('errLoadFailed'),
          })
          return
        }
      }
    },

    setTheme(t) {
      set({ theme: t })
      document.documentElement.classList.toggle('dark', t === 'dark')
    },

    setShowDescriptions(v) {
      set({ settings: { ...get().settings, showDescriptions: v } })
      void persist()
    },

    setLang(l) {
      setActiveLang(l)
      set({ settings: { ...get().settings, lang: l } })
      void persist()
    },

    setActiveProject(id) {
      set({ activeProjectId: id })
    },

    startTimer(desc, projectId, tags) {
      const running: RunningTimer = { desc, projectId, tags, start: Date.now() }
      set({ running })
      void persist()
    },

    updateRunning(patch) {
      const { running } = get()
      if (!running) return
      set({ running: { ...running, ...patch } })
      void persist()
    },

    pauseTimer() {
      const { running } = get()
      if (!running || running.pausedAt != null) return
      set({ running: { ...running, pausedAt: Date.now() } })
      void persist()
    },

    resumeTimer() {
      const { running } = get()
      if (!running || running.pausedAt == null) return
      const pausedMs = (running.pausedMs ?? 0) + (Date.now() - running.pausedAt)
      set({ running: { ...running, pausedAt: null, pausedMs } })
      void persist()
    },

    stopTimer() {
      const { running, entries } = get()
      if (!running) return
      // Exclude paused spans from the recorded duration while keeping the
      // real start time; end is derived so end - start == worked time.
      const worked = Math.max(1000, runningElapsed(running))
      const newEntry: Entry = {
        id: 'e' + Date.now(),
        desc: running.desc,
        projectId: running.projectId,
        tags: running.tags,
        start: running.start,
        end: running.start + worked,
      }
      set({ running: null, entries: [newEntry, ...entries] })
      void persist()
    },

    addProject(name) {
      const { projects } = get()
      const id = 'p' + Date.now()
      const newProject: Project = { id, name }
      set({ projects: [...projects, newProject], activeProjectId: id })
      void persist()
    },

    updateProject(id, patch) {
      set(state => ({
        projects: state.projects.map(p => (p.id === id ? { ...p, ...patch } : p)),
      }))
      void persist()
    },

    deleteProject(id) {
      const { projects, activeProjectId } = get()
      if (projects.length <= 1) return
      const next = projects.filter(p => p.id !== id)
      const nextActive = activeProjectId === id ? (next[0]?.id ?? '') : activeProjectId
      set({ projects: next, activeProjectId: nextActive })
      void persist()
    },

    updateEntry(id, patch) {
      set(state => ({
        entries: state.entries.map(e => (e.id === id ? { ...e, ...patch } : e)),
      }))
      void persist()
    },

    deleteEntry(id) {
      set(state => ({ entries: state.entries.filter(e => e.id !== id) }))
      void persist()
    },

    mergeImport(newProjects, newEntries) {
      const { projects, entries } = get()

      // Merge projects — avoid duplicates by name
      const existingNames = new Set(projects.map(p => p.name))
      const projectsToAdd = newProjects.filter(p => !existingNames.has(p.name))

      // Build id remap: if imported project name matches existing, remap its id
      const idRemap = new Map<string, string>()
      for (const np of newProjects) {
        const existing = projects.find(p => p.name === np.name)
        if (existing) idRemap.set(np.id, existing.id)
      }

      // Merge entries — avoid duplicates by start+end
      const existingKeys = new Set(entries.map(e => `${e.start}-${e.end}`))
      const entriesToAdd = newEntries
        .filter(e => !existingKeys.has(`${e.start}-${e.end}`))
        .map(e => ({ ...e, projectId: idRemap.get(e.projectId) ?? e.projectId }))

      set({
        projects: [...projects, ...projectsToAdd],
        entries: [...entriesToAdd, ...entries],
      })
      void persist()
    },
  }
})
