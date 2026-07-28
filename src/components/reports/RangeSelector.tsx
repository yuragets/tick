import { fieldStyle } from '../../ui'
import { useT } from '../../i18n'
import type { ReportRange, CustomRange } from '../../types'

interface RangeSelectorProps {
  range: ReportRange
  onRangeChange: (r: ReportRange) => void
  custom: CustomRange
  onCustomChange: (c: CustomRange) => void
}

/** Today / Week / Month / Custom range picker, shared by Reports and the
 *  Calculator so both offer the same period selection. */
export default function RangeSelector({ range, onRangeChange, custom, onCustomChange }: RangeSelectorProps) {
  const { t } = useT()
  return (
    <>
      <div className="flex gap-1.5 flex-wrap mb-3.5">
        {(['today', 'week', 'month', 'custom'] as ReportRange[]).map(r => (
          <button
            key={r}
            onClick={() => onRangeChange(r)}
            className="px-4 py-1.5 text-sm rounded-[10px] border transition-all"
            style={range === r
              ? { background: 'var(--accent-bg)', borderColor: 'var(--accent)', color: 'var(--accent)' }
              : { background: 'transparent', borderColor: 'var(--line)', color: 'var(--ink-dim)' }
            }
          >
            {r === 'today' ? t('rangeToday') : r === 'week' ? t('rangeWeek') : r === 'month' ? t('rangeMonth') : t('rangeCustom')}
          </button>
        ))}
      </div>

      {range === 'custom' && (
        <div className="flex items-center gap-2 mb-3.5 flex-wrap">
          <input type="date" value={custom.from}
            onChange={e => onCustomChange({ ...custom, from: e.target.value })}
            className="flex-1 px-3 py-2 text-sm rounded-[10px]"
            style={fieldStyle}
          />
          <span style={{ color: 'var(--ink-mute)' }}>→</span>
          <input type="date" value={custom.to}
            onChange={e => onCustomChange({ ...custom, to: e.target.value })}
            className="flex-1 px-3 py-2 text-sm rounded-[10px]"
            style={fieldStyle}
          />
        </div>
      )}
    </>
  )
}
