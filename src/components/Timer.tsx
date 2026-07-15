import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useTimer } from '../hooks/useTimer'
import { parseTags } from '../utils/sanitize'
import { MAX_DESC_LEN } from '../utils/constants'
import { hms, timeInput, applyTimeOfDay } from '../utils/time'
import { fieldStyle } from '../ui'
import { useT } from '../i18n'

export default function Timer() {
  const { running, projects, activeProjectId, startTimer, stopTimer, pauseTimer, resumeTimer, setActiveProject, updateRunning } = useStore()
  const { t } = useT()
  const display = useTimer()
  const paused = running?.pausedAt != null

  const [desc, setDesc] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [projId, setProjId] = useState(activeProjectId)

  // Inline "adjust start time" form (only meaningful while running)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(0)          // working start time, ms epoch
  const [startHHMM, setStartHHMM] = useState('') // HH:MM mirror of `draft`
  const [editProj, setEditProj] = useState('')

  // Sync projId when activeProjectId changes from ProjectList
  useEffect(() => {
    if (!running) setProjId(activeProjectId)
  }, [activeProjectId, running])

  // Restore form from running timer
  useEffect(() => {
    if (running) {
      setDesc(running.desc)
      setTagsRaw(running.tags.join(', '))
      setProjId(running.projectId)
    }
  }, [running])

  function handleToggle() {
    if (running) {
      stopTimer()
      setDesc('')
      setTagsRaw('')
      setEditing(false)
    } else {
      startTimer(desc.trim().slice(0, MAX_DESC_LEN), projId, parseTags(tagsRaw))
      setActiveProject(projId)
    }
  }

  function handleProjChange(id: string) {
    setProjId(id)
    setActiveProject(id)
  }

  function openEdit() {
    if (!running) return
    setDraft(running.start)
    setStartHHMM(timeInput(running.start))
    setEditProj(running.projectId)
    setEditing(true)
  }

  function handleHHMM(v: string) {
    setStartHHMM(v)
    const next = applyTimeOfDay(draft, v)
    if (next != null) setDraft(next)
  }

  const draftFuture = draft > Date.now()

  function saveEdit() {
    if (!running || draftFuture) return
    updateRunning({ start: draft, projectId: editProj })
    setEditing(false)
  }

  return (
    <div
      className="rounded-card p-5 mb-5"
      style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}
    >
      {/* Row 1: Description + Project */}
      <div className="flex gap-2.5 flex-wrap mb-3.5">
        <input
          type="text"
          placeholder={t('descPlaceholder')}
          maxLength={MAX_DESC_LEN}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          disabled={!!running}
          className="flex-[2] min-w-[170px] px-3 py-2.5 rounded-[10px] text-sm transition-colors"
          style={fieldStyle}
        />
        <select
          value={projId}
          onChange={e => handleProjChange(e.target.value)}
          disabled={!!running}
          className="select flex-1 min-w-[140px] px-3 py-2.5 rounded-[10px] text-sm transition-colors"
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

      {/* Row 2: Tags */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={t('tagsPlaceholder')}
          value={tagsRaw}
          onChange={e => setTagsRaw(e.target.value)}
          disabled={!!running}
          className="w-full px-3 py-2.5 rounded-[10px] text-sm transition-colors"
          style={fieldStyle}
        />
      </div>

      {/* Row 3: Timer display + button */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="font-mono text-[38px] font-medium tracking-[1px] tabular-nums transition-colors"
          style={{ color: paused ? 'var(--accent)' : 'var(--ink)' }}
        >
          {display}
        </span>
        {paused && (
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--accent)' }}
          >
            {t('paused')}
          </span>
        )}
        {running && (
          <button
            onClick={() => (editing ? setEditing(false) : openEdit())}
            title={t('editStart')}
            aria-label={t('editStart')}
            className="w-8 h-8 flex items-center justify-center rounded-[8px] border text-sm transition-colors"
            style={{
              background: editing ? 'var(--accent-bg)' : 'var(--panel-2)',
              borderColor: editing ? 'var(--accent)' : 'var(--line-strong)',
              color: editing ? 'var(--accent)' : 'var(--ink)',
            }}
          >
            ✎
          </button>
        )}
        {running ? (
          <div className="ml-auto flex gap-2">
            <button
              onClick={() => (paused ? resumeTimer() : pauseTimer())}
              className="px-5 py-2.5 text-[15px] font-medium rounded-[10px] border transition-all active:scale-[.98]"
              style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              {paused ? t('resume') : t('pause')}
            </button>
            <button
              onClick={handleToggle}
              className="px-6 py-2.5 text-[15px] font-medium rounded-[10px] border transition-all active:scale-[.98]"
              style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: '#f0a0a0' }}
            >
              {t('stop')}
            </button>
          </div>
        ) : (
          <button
            onClick={handleToggle}
            className="ml-auto px-6 py-2.5 text-[15px] font-medium rounded-[10px] border transition-all active:scale-[.98]"
            style={{ background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
          >
            {t('start')}
          </button>
        )}
      </div>

      {/* Adjust start time (inline) */}
      {running && editing && (
        <div
          className="mt-3.5 p-3.5 rounded-[10px] flex flex-col gap-3"
          style={{ background: 'var(--panel-2)', border: '1px solid var(--line)' }}
        >
          {/* Exact start time + project */}
          <div className="flex flex-wrap gap-2.5">
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('startTime')}</label>
              <input
                type="time"
                value={startHHMM}
                onChange={e => handleHHMM(e.target.value)}
                className="w-full px-3 py-2 rounded-[10px] text-sm"
                style={fieldStyle}
              />
            </div>
            <div className="flex-1 min-w-[130px]">
              <label className="block text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{t('project')}</label>
              <select
                value={editProj}
                onChange={e => setEditProj(e.target.value)}
                className="select w-full px-3 py-2 rounded-[10px] text-sm"
                style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink)' }}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Preview / validation */}
          <div className="text-xs font-mono tabular-nums" style={{ color: draftFuture ? 'var(--danger)' : 'var(--ink-mute)' }}>
            {draftFuture ? t('newStartFuture') : `→ ${hms(Date.now() - draft)}`}
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => setEditing(false)}
              className="px-4 py-1.5 text-sm rounded-[10px] border transition-colors"
              style={{ background: 'var(--panel)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={saveEdit}
              disabled={draftFuture}
              className="px-4 py-1.5 text-sm rounded-[10px] border transition-colors disabled:opacity-50"
              style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
            >
              {t('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
