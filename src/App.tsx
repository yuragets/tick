import { useState, useEffect } from 'react'
import { useStore } from './store/useStore'
import { useT } from './i18n'
import Timer from './components/Timer'
import ProjectList from './components/ProjectList'
import EntryList from './components/EntryList'
import EntryEditModal from './components/EntryEditModal'
import SettingsModal from './components/SettingsModal'
import Reports from './components/reports/Reports'

type Tab = 'track' | 'report'

function Header({ onOpenSettings }: { onOpenSettings: () => void }) {
  const { theme, setTheme } = useStore()
  const { t } = useT()
  const iconBtn = {
    background: 'var(--panel-2)',
    border: '1px solid var(--line)',
    color: 'var(--ink-dim)',
  }
  return (
    <div className="flex items-center justify-between mb-1">
      <h1
        className="flex items-center gap-2.5 text-xl font-semibold tracking-tight"
        style={{ color: 'var(--ink)' }}
      >
        <span className="w-2.5 h-2.5 rounded-full flex-none" style={{ background: 'var(--accent)' }} />
        Tick
      </h1>
      <div className="flex gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="text-xl w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={iconBtn}
          title={theme === 'dark' ? t('themeLight') : t('themeDark')}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <button
          onClick={onOpenSettings}
          className="text-lg w-9 h-9 flex items-center justify-center rounded-lg transition-colors"
          style={iconBtn}
          title={t('settings')}
        >
          ⚙
        </button>
      </div>
    </div>
  )
}

export default function App() {
  const [tab, setTab] = useState<Tab>('track')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const status = useStore(s => s.status)
  const errorMessage = useStore(s => s.errorMessage)
  const saveError = useStore(s => s.saveError)
  const hydrate = useStore(s => s.hydrate)
  const { t } = useT()

  // Load data from the backend on first mount.
  useEffect(() => {
    void hydrate()
  }, [hydrate])

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <div className="max-w-[896px] mx-auto px-4 py-6">
        <Header onOpenSettings={() => setSettingsOpen(true)} />
        <p className="text-sm mb-6" style={{ color: 'var(--ink-mute)' }}>
          {t('appSubtitle')}
        </p>

        {/* Loading */}
        {status === 'loading' && (
          <div className="text-sm text-center py-16" style={{ color: 'var(--ink-mute)' }}>
            {t('loading')}
          </div>
        )}

        {/* Error: backend unreachable */}
        {status === 'error' && (
          <div
            className="rounded-card p-6 text-center"
            style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}
          >
            <div className="text-base font-semibold mb-2" style={{ color: 'var(--danger)' }}>
              {t('offlineTitle')}
            </div>
            <p className="text-sm mb-4" style={{ color: 'var(--ink-dim)' }}>
              {errorMessage}
            </p>
            <button
              onClick={() => void hydrate()}
              className="px-4 py-2 text-sm rounded-[10px] border"
              style={{ background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
            >
              {t('retry')}
            </button>
          </div>
        )}

        {/* Ready */}
        {status === 'ready' && (
          <>
            {/* Save error banner */}
            {saveError && (
              <div
                className="rounded-[10px] px-3 py-2 mb-4 text-sm"
                style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', color: 'var(--danger)' }}
              >
                {t('saveError')}
              </div>
            )}

            {/* Tabs */}
            <div className="flex gap-1.5 mb-5">
              {(['track', 'report'] as Tab[]).map(tb => (
                <button
                  key={tb}
                  onClick={() => setTab(tb)}
                  className="flex-1 py-2.5 text-sm rounded-[10px] border transition-all"
                  style={tab === tb
                    ? { background: 'var(--panel-2)', color: 'var(--ink)', borderColor: 'var(--line-strong)' }
                    : { background: 'transparent', color: 'var(--ink-dim)', borderColor: 'var(--line)' }
                  }
                >
                  {tb === 'track' ? t('tabTrack') : t('tabReport')}
                </button>
              ))}
            </div>

            {tab === 'track' && (
              <>
                <Timer />
                <ProjectList />
                <EntryList />
              </>
            )}
            {tab === 'report' && <Reports />}
          </>
        )}
      </div>

      <EntryEditModal />
      {settingsOpen && <SettingsModal onClose={() => setSettingsOpen(false)} />}
    </div>
  )
}
