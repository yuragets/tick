import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { dtLocal, parseDatetimeLocal, hms, parseHms } from '../utils/time'
import { parseTags } from '../utils/sanitize'
import { MAX_DESC_LEN } from '../utils/constants'
import { fieldStyle } from '../ui'
import { useT } from '../i18n'
import { registerEditOpener } from './EntryList'
import Modal from './Modal'

export default function EntryEditModal() {
  const { entries, projects, updateEntry } = useStore()
  const { t } = useT()
  const [editId, setEditId] = useState<string | null>(null)

  const [desc, setDesc] = useState('')
  const [projectId, setProjectId] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [startStr, setStartStr] = useState('')
  const [endStr, setEndStr] = useState('')
  const [durStr, setDurStr] = useState('')

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
      setDurStr(hms(entry.end - entry.start))
    })
  }, [entries])

  // Editing start/end recomputes the duration; editing the duration
  // shifts the end (keeping the start fixed).
  function changeStart(v: string) {
    setStartStr(v)
    const s = parseDatetimeLocal(v)
    const e = parseDatetimeLocal(endStr)
    if (Number.isFinite(s) && Number.isFinite(e) && e > s) setDurStr(hms(e - s))
  }

  function changeEnd(v: string) {
    setEndStr(v)
    const s = parseDatetimeLocal(startStr)
    const e = parseDatetimeLocal(v)
    if (Number.isFinite(s) && Number.isFinite(e) && e > s) setDurStr(hms(e - s))
  }

  function changeDuration(v: string) {
    setDurStr(v)
    const ms = parseHms(v)
    const s = parseDatetimeLocal(startStr)
    if (ms != null && ms > 0 && Number.isFinite(s)) setEndStr(dtLocal(s + ms))
  }

  function handleSave() {
    if (!editId) return
    const start = parseDatetimeLocal(startStr)
    const end = parseDatetimeLocal(endStr)
    if (!start || !end || end <= start) return

    updateEntry(editId, {
      desc: desc.trim().slice(0, MAX_DESC_LEN),
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
    <Modal onClose={handleClose} maxWidth={480} className="overflow-hidden">
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          {t('editEntry')}
        </h3>

        {/* Description */}
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('description')}</label>
          <input
            type="text"
            maxLength={MAX_DESC_LEN}
            value={desc}
            onChange={e => setDesc(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] text-sm"
            style={fieldStyle}
          />
        </div>

        {/* Project */}
        <div className="mb-3">
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('project')}</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="select w-full px-3 py-2 rounded-[10px] text-sm"
            style={{
              backgroundColor: 'var(--panel-2)',
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
            style={fieldStyle}
          />
        </div>

        {/* Start / End */}
        <div className="flex flex-wrap gap-2.5 mb-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('start_')}</label>
            <input
              type="datetime-local"
              value={startStr}
              onChange={e => changeStart(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] text-sm"
              style={fieldStyle}
            />
          </div>
          <div className="flex-1 min-w-[180px]">
            <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('end_')}</label>
            <input
              type="datetime-local"
              value={endStr}
              onChange={e => changeEnd(e.target.value)}
              className="w-full px-3 py-2 rounded-[10px] text-sm"
              style={fieldStyle}
            />
          </div>
        </div>

        {/* Duration */}
        <div className="mb-4">
          <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('duration_')}</label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="00:00:00"
            value={durStr}
            onChange={e => changeDuration(e.target.value)}
            className="w-full px-3 py-2 rounded-[10px] text-sm tabular-nums"
            style={fieldStyle}
          />
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
    </Modal>
  )
}
