import { useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { projectColor } from '../utils/projects'
import { useT } from '../i18n'
import ProjectEditModal from './ProjectEditModal'

export default function ProjectList() {
  const { projects, activeProjectId, running, setActiveProject, addProject } = useStore()
  const { t } = useT()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function handleAdd() {
    const name = newName.trim().slice(0, 100)
    if (!name) return
    addProject(name)
    setNewName('')
    inputRef.current?.focus()
  }

  function handleChipClick(id: string) {
    if (running) return
    if (id === activeProjectId) {
      // Second click on already-active → open edit
      setEditingId(id)
    } else {
      setActiveProject(id)
    }
  }

  return (
    <>
      <div className="mb-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-2.5">
          <span
            className="text-xs font-medium uppercase tracking-widest"
            style={{ color: 'var(--ink-mute)' }}
          >
            {t('projects')}
          </span>
          <div className="flex gap-1.5">
            <input
              ref={inputRef}
              type="text"
              placeholder={t('newProjectPlaceholder')}
              maxLength={100}
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAdd() }}
              className="px-2.5 py-1.5 text-sm rounded-[10px]"
              style={{
                width: 150,
                background: 'var(--panel-2)',
                border: '1px solid var(--line)',
                color: 'var(--ink)',
              }}
            />
            <button
              onClick={handleAdd}
              className="px-3 py-1.5 text-sm rounded-[10px] transition-colors"
              style={{
                background: 'var(--panel-2)',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink)',
              }}
            >
              {t('add')}
            </button>
          </div>
        </div>

        {/* Project chips */}
        <div className="flex flex-wrap gap-1.5 items-center">
          {projects.map(p => {
            const color = projectColor(projects, p.id)
            const isActive = p.id === activeProjectId
            return (
              <div key={p.id} className="flex items-center gap-1">
                <button
                  onClick={() => handleChipClick(p.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-full border transition-all"
                  style={{
                    background: `${color}22`,
                    color,
                    borderColor: isActive ? color : 'transparent',
                    outline: isActive ? `1.5px solid ${color}` : undefined,
                    outlineOffset: isActive ? '1px' : undefined,
                    cursor: running ? 'not-allowed' : 'pointer',
                    opacity: running && !isActive ? 0.5 : 1,
                  }}
                  title={isActive ? t('editHint') : p.name}
                >
                  {p.name}
                  {/* Pencil icon — only on active chip */}
                  {isActive && !running && (
                    <span
                      className="text-[11px] opacity-60"
                      style={{ lineHeight: 1 }}
                    >
                      ✎
                    </span>
                  )}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {editingId && (
        <ProjectEditModal
          projectId={editingId}
          onClose={() => setEditingId(null)}
        />
      )}
    </>
  )
}
