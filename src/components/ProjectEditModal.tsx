import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PALETTE, MAX_NAME_LEN } from '../utils/constants'
import { fieldStyle } from '../ui'
import { useT } from '../i18n'
import Modal from './Modal'

interface Props {
  projectId: string
  onClose: () => void
}

// Sentinel reassignment targets (never valid project ids).
const NEW = '__new__'
const ORPHAN = '__orphan__'

export default function ProjectEditModal({ projectId, onClose }: Props) {
  const { projects, entries, updateProject, deleteProject, addProject } = useStore()
  const { t } = useT()
  const project = projects.find(p => p.id === projectId)

  const [name, setName] = useState(project?.name ?? '')
  const [color, setColor] = useState(project?.color ?? PALETTE[projects.findIndex(p => p.id === projectId) % PALETTE.length] ?? PALETTE[0]!)

  const otherProjects = projects.filter(p => p.id !== projectId)
  const entryCount = entries.filter(e => e.projectId === projectId).length

  const [confirmingDelete, setConfirmingDelete] = useState(false)
  // Where to move this project's entries when it has any.
  const [reassignTo, setReassignTo] = useState<string>(otherProjects[0]?.id ?? ORPHAN)
  const [newProjName, setNewProjName] = useState('')

  if (!project) return null

  function handleSave() {
    const trimmed = name.trim().slice(0, MAX_NAME_LEN)
    if (!trimmed) return
    updateProject(projectId, { name: trimmed, color })
    onClose()
  }

  function handleConfirmDelete() {
    if (entryCount > 0 && reassignTo === NEW) {
      const trimmed = newProjName.trim().slice(0, MAX_NAME_LEN)
      if (!trimmed) return
      const newId = addProject(trimmed)
      deleteProject(projectId, newId)
    } else if (entryCount > 0 && reassignTo !== ORPHAN) {
      deleteProject(projectId, reassignTo)
    } else {
      // No entries, or the user chose to leave them without a project.
      deleteProject(projectId)
    }
    onClose()
  }

  const canDelete = projects.length > 1
  const deleteDisabled = entryCount > 0 && reassignTo === NEW && !newProjName.trim()

  // ── Delete confirmation view ─────────────────────────────
  if (confirmingDelete) {
    return (
      <Modal onClose={onClose} maxWidth={380}>
        <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--ink)' }}>
          {t('deleteTitle')}
        </h3>

        {entryCount === 0 ? (
          <p className="text-sm mb-5" style={{ color: 'var(--ink-dim)' }}>
            {t('deleteConfirm', { name: project.name })}
          </p>
        ) : (
          <>
            <p className="text-sm mb-3" style={{ color: 'var(--ink-dim)' }}>
              {t('deleteEntriesInfo', { name: project.name, count: entryCount })}
            </p>
            <select
              value={reassignTo}
              onChange={e => setReassignTo(e.target.value)}
              className="select w-full px-3 py-2 rounded-[10px] text-sm mb-2"
              style={fieldStyle}
            >
              {otherProjects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              <option value={NEW}>{t('reassignNew')}</option>
              <option value={ORPHAN}>{t('reassignOrphan')}</option>
            </select>

            {reassignTo === NEW && (
              <input
                type="text"
                maxLength={MAX_NAME_LEN}
                value={newProjName}
                onChange={e => setNewProjName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !deleteDisabled) handleConfirmDelete() }}
                placeholder={t('newProjectName')}
                className="w-full px-3 py-2 rounded-[10px] text-sm mb-2"
                style={fieldStyle}
                autoFocus
              />
            )}

            {reassignTo === ORPHAN && (
              <p className="text-xs mb-2" style={{ color: 'var(--ink-mute)' }}>
                {t('reassignOrphanHint')}
              </p>
            )}
          </>
        )}

        <div className="flex items-center gap-2 mt-5">
          <button
            onClick={() => setConfirmingDelete(false)}
            className="px-4 py-2 text-sm rounded-[10px] border transition-colors mr-auto"
            style={{ background: 'var(--panel-2)', borderColor: 'var(--line-strong)', color: 'var(--ink)' }}
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleteDisabled}
            className="px-4 py-2 text-sm rounded-[10px] border transition-all"
            style={{
              background: 'var(--danger)',
              borderColor: 'var(--danger)',
              color: '#fff',
              opacity: deleteDisabled ? 0.5 : 1,
              cursor: deleteDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            {t('delete')}
          </button>
        </div>
      </Modal>
    )
  }

  // ── Edit view ────────────────────────────────────────────
  return (
    <Modal onClose={onClose} maxWidth={380}>
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
            maxLength={MAX_NAME_LEN}
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave() }}
            className="w-full px-3 py-2 rounded-[10px] text-sm"
            style={fieldStyle}
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
              onClick={() => setConfirmingDelete(true)}
              className="px-3 py-2 text-sm rounded-[10px] border transition-all mr-auto"
              style={{ background: 'var(--danger-bg)', borderColor: 'var(--danger)', color: 'var(--danger)' }}
            >
              {t('delete')}
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
    </Modal>
  )
}
