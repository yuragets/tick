import type { ReactNode } from 'react'

interface Props {
  /** Called when the backdrop (but not the panel) is clicked. */
  onClose: () => void
  /** Panel max width in px. */
  maxWidth: number
  /** Extra classes for the panel (e.g. "overflow-hidden"). */
  className?: string
  children: ReactNode
}

/**
 * Centered modal with a dimmed backdrop. Clicking the backdrop calls onClose;
 * clicks inside the panel are ignored. Shared by the entry / project / settings
 * dialogs so they stay visually and behaviourally identical.
 */
export default function Modal({ onClose, maxWidth, className, children }: Props) {
  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-5 z-50"
      style={{ background: 'rgba(0,0,0,.6)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className={`w-full rounded-card p-6${className ? ` ${className}` : ''}`}
        style={{ background: 'var(--panel)', border: '1px solid var(--line-strong)', maxWidth }}
      >
        {children}
      </div>
    </div>
  )
}
