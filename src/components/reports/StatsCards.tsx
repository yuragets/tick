import { hm } from '../../utils/time'
import { useT } from '../../i18n'

interface Props {
  totalMs: number
  entryCount: number
  projectCount: number
}

export default function StatsCards({ totalMs, entryCount, projectCount }: Props) {
  const { t } = useT()
  const stats = [
    { label: t('totalTime'), value: hm(totalMs) },
    { label: t('entriesCount'), value: String(entryCount) },
    { label: t('projectsCount'), value: String(projectCount) },
  ]

  return (
    <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))' }}>
      {stats.map(s => (
        <div
          key={s.label}
          className="rounded-[10px] p-3.5"
          style={{ background: 'var(--panel-2)' }}
        >
          <div className="text-xs" style={{ color: 'var(--ink-mute)' }}>{s.label}</div>
          <div
            className="text-[23px] font-semibold tabular-nums mt-0.5"
            style={{ color: 'var(--ink)' }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  )
}
