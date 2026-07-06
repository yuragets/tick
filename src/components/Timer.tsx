import { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { useTimer } from '../hooks/useTimer'
import { parseTags } from '../utils/sanitize'
import { useT } from '../i18n'

export default function Timer() {
  const { running, projects, activeProjectId, startTimer, stopTimer, setActiveProject } = useStore()
  const { t } = useT()
  const display = useTimer()

  const [desc, setDesc] = useState('')
  const [tagsRaw, setTagsRaw] = useState('')
  const [projId, setProjId] = useState(activeProjectId)

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
    } else {
      startTimer(desc.trim().slice(0, 500), projId, parseTags(tagsRaw))
      setActiveProject(projId)
    }
  }

  function handleProjChange(id: string) {
    setProjId(id)
    setActiveProject(id)
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
          maxLength={500}
          value={desc}
          onChange={e => setDesc(e.target.value)}
          disabled={!!running}
          className="flex-[2] min-w-[170px] px-3 py-2.5 rounded-[10px] text-sm transition-colors"
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
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
          style={{
            background: 'var(--panel-2)',
            border: '1px solid var(--line)',
            color: 'var(--ink)',
          }}
        />
      </div>

      {/* Row 3: Timer display + button */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="font-mono text-[38px] font-medium tracking-[1px] tabular-nums"
          style={{ color: 'var(--ink)' }}
        >
          {display}
        </span>
        <button
          onClick={handleToggle}
          className="ml-auto px-6 py-2.5 text-[15px] font-medium rounded-[10px] border transition-all active:scale-[.98]"
          style={running
            ? { background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: '#f0a0a0' }
            : { background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }
          }
        >
          {running ? t('stop') : t('start')}
        </button>
      </div>
    </div>
  )
}
