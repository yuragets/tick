import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { dtLocal, parseDatetimeLocal } from '../utils/time'
import { parseTags } from '../utils/sanitize'
import { useT } from '../i18n'
import { registerEditOpener } from './EntryList'

export default function EntryEditModal() {
  const { entries, projects, updateEntry } = useStore()
  const { t } = useT()
  const [editId, setEditId] = useState<string | null>(null)

  const [desc, setDesc] = useState('')
  const [projectId, setProjectId] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')

  // Register opener so EntryList can trigger this modal
  useEffect(() => {
    registerEditOpener((id: string) => {
      const entry = entries.find(e => e.id === id)
      if (!entry) return
      setEditId(id)
      setDesc(entry.desc)
      setProjectId(entry.projectId)
      setTagsRaw(entry.tags.join(', '))
      setStartStr(dtLocal(entry.start))
      setEndStr(dtLocal(entry.end))
    })
  }, [entries])

  function handleSave() {
    if (!editId) return
    const start = parseDatetimeLocal(startStr)
    const end = parseDatetimeLocal(endStr)
    if (!start || !end || end <= start) return

    updateEntry(editId, {
      desc: desc.trim().slice(0, 500),
      projectId,
      tags: parseTags(tagsRaw),
      start,
      end,
    })
    handleClose()
  }

  function handleClose() {
    setEditId(null)
  }

  if (!editId) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div
        className="w-full max-w-[480px] rounded-card p-6 overflow-hidden"
        style={{
          background: 'var(--panel)',
          border: '1px solid var(--line-strong)',
        }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          {t('editEntry')}
        </h3>

        {/* Description */}
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('description')}</label>
          <input
            type="text"
            maxLength={500}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] text-sm"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
            }}
          />
        </div>

        {/* Project */}
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('project')}</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] text-sm"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
            }}
          >
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>
            {t('tagsComma')}
          </label>
          <input
            type="text"
            value={tagsRaw}
            onChange={e => setTagsRaw(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] text-sm"
            style={{
              background: 'var(--panel-2)',
              border: '1px solid var(--line)',
              color: 'var(--ink)',
            }}
          />
        </div>

        {/* Start / End */}
        <div className="flex flex-wrap gap-2.5 mb-4">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('start_')}</label>
            <input
              type="datetime-local"
              value={startStr}
              onChange={e => setStartStr(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] text-sm"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('end_')}</label>
            <input
              type="datetime-local"
              value={endStr}
              onChange={e => setEndStr(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] text-sm"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm rounded-[10px] border transition-colors"
            style={{
              background: 'var(--panel-2)',
              borderColor: 'var(--line-strong)',
              color: 'var(--ink)',
            }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded-[10px] border transition-colors"
            style={{
              background: 'var(--accent-bg)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  )
}
