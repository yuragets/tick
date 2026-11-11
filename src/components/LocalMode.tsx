import { useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useStore } from '../store/useStore'
import { useT } from '../i18n'
import { useConfirm } from '../hooks/useConfirm'
import { exportJSON, importFile } from '../utils/csv'
import { isDemoId } from '../utils/demo'

// UI that only exists in the browser-only build (LOCAL_MODE): the welcome
// screen, the demo-data banner, the storage notice and backup actions.

const NOTICE_DISMISSED_KEY = 'tick-storage-notice-dismissed'

const linkBtn: CSSProperties = {
  background: 'transparent', border: 'none', padding: 0, color: 'var(--accent)',
}

/** File picker that merges a .json / .csv backup into the current data. */
function ImportLabel({ children, onMessage }: {
  children: ReactNode
  onMessage: (msg: { ok: boolean; text: string }) => void
}) {
  const mergeImport = useStore(s => s.mergeImport)
  const { t } = useT()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await importFile(file)
    if (!result.ok) {
      onMessage({ ok: false, text: result.error })
    } else {
      mergeImport(result.projects, result.entries)
      onMessage({
        ok: true,
        text: t('importSuccess', { entries: result.entries.length, projects: result.projects.length }),
      })
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  return (
    <label className="text-sm cursor-pointer" style={{ color: 'var(--accent)' }}>
      {children}
      <input ref={fileRef} type="file" accept=".csv,.json" className="hidden" onChange={handleImport} />
    </label>
  )
}

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null
  return (
    <div className="text-xs mt-2" style={{ color: msg.ok ? 'var(--ok)' : 'var(--danger)' }}>
      {msg.text}
    </div>
  )
}

function ExportBackupButton() {
  const { projects, entries, running, settings } = useStore()
  const { t } = useT()
  return (
    <button
      onClick={() => exportJSON({ projects, entries, running, settings })}
      className="text-sm"
      style={linkBtn}
    >
      {t('exportBackup')}
    </button>
  )
}

/** Export-backup + import links, with inline import feedback. */
export function BackupActions() {
  const { t } = useT()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <div>
      <div className="flex items-center gap-4">
        <ExportBackupButton />
        <ImportLabel onMessage={setMsg}>{t('import')}</ImportLabel>
      </div>
      <Feedback msg={msg} />
    </div>
  )
}

/** First visit with empty storage: what Tick is + how to start. */
export function Welcome() {
  const { loadDemo, startFresh } = useStore()
  const { t } = useT()
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  return (
    <div
      className="rounded-card px-6 py-10 text-center"
      style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
    >
      <h2 className="text-2xl font-semibold tracking-tight mb-3" style={{ color: 'var(--ink)' }}>
        {t('welcomeTitle')}
      </h2>
      <p className="text-sm max-w-[440px] mx-auto mb-2" style={{ color: 'var(--ink-dim)' }}>
        {t('welcomeText')}
      </p>
      <p className="text-sm max-w-[440px] mx-auto mb-7" style={{ color: 'var(--ink-mute)' }}>
        {t('welcomePrivacy')}
      </p>

      <div className="flex justify-center gap-2.5 flex-wrap mb-2">
        <button
          onClick={loadDemo}
          className="px-5 py-2.5 text-sm font-medium rounded-[10px] border"
          style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--bg)' }}
        >
          {t('welcomeDemo')}
        </button>
        <button
          onClick={startFresh}
          className="px-5 py-2.5 text-sm rounded-[10px] border"
          style={{ background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
        >
          {t('welcomeFresh')}
        </button>
      </div>
      <p className="text-xs mb-5" style={{ color: 'var(--ink-mute)' }}>
        {t('welcomeDemoHint')}
      </p>

      <ImportLabel onMessage={setMsg}>{t('welcomeImport')}</ImportLabel>
      <Feedback msg={msg} />
    </div>
  )
}

const useHasDemo = () =>
  useStore(s => s.projects.some(p => isDemoId(p.id)) || s.entries.some(e => isDemoId(e.id)))

/** Shown while any demo project or entry is present. */
export function DemoBanner() {
  const hasDemo = useHasDemo()
  const removeDemo = useStore(s => s.removeDemo)
  const { t } = useT()
  const { confirm, isArmed } = useConfirm()

  if (!hasDemo) return null
  return (
    <div
      className="flex items-center justify-between gap-3 flex-wrap rounded-[10px] px-3 py-2 mb-4 text-sm"
      style={{ background: 'var(--accent-bg)', border: '1px solid var(--accent)', color: 'var(--ink)' }}
    >
      <span>{t('demoBanner')}</span>
      <button
        onClick={() => { if (confirm('demo')) removeDemo() }}
        className="text-sm"
        style={{ ...linkBtn, color: isArmed('demo') ? 'var(--danger)' : 'var(--accent)' }}
      >
        {isArmed('demo') ? t('demoRemoveConfirm') : t('demoRemove')}
      </button>
    </div>
  )
}

const pillBtn: CSSProperties = {
  background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)',
}
const dangerBtn: CSSProperties = {
  background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)',
}

/** Settings → Data: add/remove demo data and wipe everything. */
export function DataManagement({ onCleared }: { onCleared: () => void }) {
  const { addDemo, removeDemo, clearAll } = useStore()
  const hasDemo = useHasDemo()
  const { t } = useT()
  const { confirm, isArmed } = useConfirm()
  const [confirmingClear, setConfirmingClear] = useState(false)

  async function handleClear() {
    await clearAll()
    resetStorageNotice()
    onCleared()
  }

  if (confirmingClear) {
    return (
      <div
        className="rounded-[10px] p-3 mt-3"
        style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)' }}
      >
        <div className="text-sm font-semibold mb-1" style={{ color: 'var(--danger)' }}>
          {t('clearAllTitle')}
        </div>
        <p className="text-xs mb-3" style={{ color: 'var(--ink-dim)' }}>
          {t('clearAllText')}
        </p>
        <div className="mb-3">
          <ExportBackupButton />
        </div>
        <div className="flex justify-end gap-2 flex-wrap">
          <button
            onClick={() => setConfirmingClear(false)}
            className="px-3 py-1.5 text-sm rounded-[10px] border"
            style={pillBtn}
          >
            {t('cancel')}
          </button>
          <button
            onClick={() => void handleClear()}
            className="px-3 py-1.5 text-sm font-medium rounded-[10px] border"
            style={{ background: 'var(--danger)', borderColor: 'var(--danger)', color: 'var(--bg)' }}
          >
            {t('clearAllConfirm')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      {hasDemo ? (
        <button
          onClick={() => { if (confirm('demo')) removeDemo() }}
          className="px-3 py-1.5 text-sm rounded-[10px] border"
          style={isArmed('demo') ? dangerBtn : pillBtn}
        >
          {isArmed('demo') ? t('demoRemoveConfirm') : t('demoRemove')}
        </button>
      ) : (
        <button onClick={addDemo} className="px-3 py-1.5 text-sm rounded-[10px] border" style={pillBtn}>
          {t('welcomeDemo')}
        </button>
      )}
      <button
        onClick={() => setConfirmingClear(true)}
        className="px-3 py-1.5 text-sm rounded-[10px] border"
        style={dangerBtn}
      >
        {t('clearAll')}
      </button>
    </div>
  )
}

/** After a full wipe the storage notice should show again, as on a first visit. */
function resetStorageNotice() {
  try {
    localStorage.removeItem(NOTICE_DISMISSED_KEY)
  } catch {
    /* storage unavailable — nothing to reset */
  }
}

function readDismissed(): boolean {
  try {
    return localStorage.getItem(NOTICE_DISMISSED_KEY) === '1'
  } catch {
    return false
  }
}

/** Dismissible reminder that data lives only in this browser. */
export function StorageNotice() {
  const { t } = useT()
  const [dismissed, setDismissed] = useState(readDismissed)

  function dismiss() {
    setDismissed(true)
    try {
      localStorage.setItem(NOTICE_DISMISSED_KEY, '1')
    } catch {
      /* storage unavailable — stays dismissed for this session only */
    }
  }

  if (dismissed) return null
  return (
    <div
      className="flex items-start gap-3 rounded-[10px] px-3.5 py-3 mb-4"
      style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
    >
      <div className="flex-1">
        <p className="text-sm mb-2" style={{ color: 'var(--ink-dim)' }}>
          {t('storageNotice')}
        </p>
        <BackupActions />
      </div>
      <button
        onClick={dismiss}
        className="w-7 h-7 flex-none flex items-center justify-center rounded-lg text-sm"
        style={{ background: 'transparent', border: 'none', color: 'var(--ink-mute)' }}
        title={t('dismiss')}
        aria-label={t('dismiss')}
      >
        ✕
      </button>
    </div>
  )
}
