import type { CSSProperties } from 'react'

/**
 * Standard text-input / field look: panel-2 fill, subtle border, primary ink.
 * Shared so the many inputs across the app stay visually identical.
 */
export const fieldStyle: CSSProperties = {
  background: 'var(--panel-2)',
  border: '1px solid var(--line)',
  color: 'var(--ink)',
}
