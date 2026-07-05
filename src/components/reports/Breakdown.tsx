import { hm } from '../../utils/time'
import { useT } from '../../i18n'

export interface BreakdownItem {
  label: string
  color: string
  ms: number
  pct: number
}

interface Props {
  items: BreakdownItem[]
  mode: 'proj' | 'day'
}

export default function Breakdown({ items, mode }: Props) {
  const { t } = useT()
  if (!items.length) {
    return (
      <p className="text-sm text-center py-4" style={{ color: 'var(--ink-mute)' }}>
        {t('noData')}
      </p>
    )
  }

  return (
    <div className="space-y-px">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2.5 py-2.5" style={{ borderBottom: '1px solid var(--line)' }}>
          {mode === 'proj' && (
            <span
              className="w-2 h-2 rounded-sm flex-none"
              style={{ background: item.color }}
            />
          )}
          <span className="text-sm flex-1 truncate" style={{ color: 'var(--ink)' }}>
            {item.label}
          </span>
          {mode === 'proj' && (
            <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[200px]" style={{ background: 'var(--panel-2)' }}>
              <div
                className="h-full rounded-full"
                style={{ width: `${item.pct}%`, background: item.color }}
              />
            </div>
          )}
          {mode === 'proj' && (
            <span className="text-xs w-8 text-right" style={{ color: 'var(--ink-dim)' }}>
              {item.pct}%
            </span>
          )}
          <span className="font-mono text-sm tabular-nums w-16 text-right" style={{ color: 'var(--ink)' }}>
            {hm(item.ms)}
          </span>
        </div>
      ))}
    </div>
  )
}
