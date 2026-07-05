import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PALETTE } from '../utils/constants'
import { useT } from '../i18n'

interface Props {
  projectId: string
  onClose: () => void
}

export default function ProjectEditModal({ projectId, onClose }: Props) {
  const { projects, updateProject, deleteProject, activeProjectId, setActiveProject } = useStore()
  const { t } = useT()
  const project = projects.find(p => p.id === projectId)

  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? PALETTE[projects.findIndex(p => p.id === projectId) % PALETTE.length] ?? PALETTE[0]!)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!project) return null

  function handleSave() {
    const trimmed = name.trim().slice(0, 100)
    if (!trimmed) return
    updateProject(projectId, { name: trimmed, color })
    onClose()
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    if (activeProjectId === projectId) {
      const next = projects.find(p => p.id !== projectId)
      if (next) setActiveProject(next.id)
    }
    deleteProject(projectId)
    onClose()
  }

  const canDelete = projects.length > 1

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-[380px] rounded-card p-6"
        style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)' }}
      >
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          {t('project')}
        </h3>

        {/* Name */}
        <div className="mb-4">
          <label className="block text-xs mb-1.5" style={{ color: 'var(--ink-mute)' }}>
            {t('name')}
          </label>
          <input
            type="text"
            maxLength={100}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            className="w-full px-3 py-2 rounded-[10px] text-sm"
            style={{ background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink)' }}
            autoFocus
          />
        </div>

        {/* Color swatches */}
        <div className="mb-5">
          <label className="block text-xs mb-2" style={{ color: 'var(--ink-mute)' }}>
            {t('color')}
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {PALETTE.map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full transition-transform"
                style={{
                  background: c,
                  outline: color === c ? `2px solid ${c}` : undefined,
                  outlineOffset: color === c ? '2px' : undefined,
                  transform: color === c ? 'scale(1.15)' : undefined,
                }}
                title={c}
              />
            ))}
          </div>
          {/* Custom color hex input */}
          <div className="flex items-center gap-2 mt-2">
            <div className="w-6 h-6 rounded-full flex-none" style={{ background: color }} />
            <input
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-8 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
              title={t('pickColor')}
            />
            <span className="text-xs font-mono" style={{ color: 'var(--ink-mute)' }}>{color}</span>
          </div>
        </div>

        {/* Preview chip */}
        <div className="mb-5 flex items-center gap-2">
          <span className="text-xs" style={{ color: 'var(--ink-mute)' }}>{t('preview')}</span>
          <span
            className="px-3 py-1 text-sm rounded-full"
            style={{ background: `${color}22`, color, border: `1px solid ${color}` }}
          >
            {name || project.name}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {canDelete && (
            <button
              onClick={handleDelete}
              className="px-3 py-2 text-sm rounded-[10px] border transition-all mr-auto"
              style={confirmDelete
                ? { background: 'var(--danger)', borderColor: 'var(--danger)', color: '#fff' }
                : { background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }
              }
            >
              {confirmDelete ? t('confirmDelete') : t('delete')}
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-[10px] border transition-colors"
            style={{ background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-sm rounded-[10px] border transition-colors"
            style={{ background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }}
          >
            {t('save')}
          </button>
        </div>

        {confirmDelete && (
          <p className="text-xs mt-2 text-right" style={{ color: 'var(--ink-mute)' }}>
            {t('confirmDeleteHint')}
          </p>
        )}
      </div>
    </div>
  )
}
