import { useStore } from '../store/useStore'
import { useT } from '../i18n'
import type { Lang } from '../types'

interface Props {
  onClose: () => void
}

export default function SettingsModal({ onClose }: Props) {
  const { settings, setShowDescriptions, setLang, theme, setTheme } = useStore()
  const { t } = useT()

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[400px] rounded-card p-6"
        style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)' }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          {t('settings')}
        </h3>

        {/* Language selector */}
        <div className="flex items-center justify-between gap-3 py-2">
          <span className="text-sm" style={{ color: 'var(--ink)' }}>
            {t('language')}
          </span>
          <select
            value={settings.lang}
            onChange={e => setLang(e.target.value as Lang)}
            className="select px-2.5 py-1.5 text-sm rounded-[10px]"
            style={{ backgroundColor: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
          >
            <option value="en">English</option>
            <option value="uk">Українська</option>
          </select>
        </div>

        {/* Show descriptions toggle */}
        <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={settings.showDescriptions}
            onChange={e => setShowDescriptions(e.target.checked)}
            className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
          />
          <span className="flex-1">
            <span className="text-sm block" style={{ color: 'var(--ink)' }}>
              {t('showDescriptions')}
            </span>
            <span className="text-xs" style={{ color: 'var(--ink-dim)' }}>
              {t('showDescriptionsHint')}
            </span>
          </span>
        </label>

        {/* Theme toggle (mirrors the header button) */}
        <label className="flex items-center gap-3 py-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={theme === 'dark'}
            onChange={e => setTheme(e.target.checked ? 'dark' : 'light')}
            className="w-4 h-4 accent-[var(--accent)] cursor-pointer"
          />
          <span className="flex-1">
            <span className="text-sm block" style={{ color: 'var(--ink)' }}>
              {t('themeDark')}
            </span>
          </span>
        </label>

        <div className="flex justify-end mt-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-[10px] border transition-colors"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  )
}
