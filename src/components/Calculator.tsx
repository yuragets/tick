import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { rangeBounds, hm } from '../utils/time'
import { projectColor } from '../utils/projects'
import { fieldStyle } from '../ui'
import { useT } from '../i18n'
import type { ReportRange, CustomRange } from '../types'
import RangeSelector from './reports/RangeSelector'

/** Parse a user-typed number, tolerating a comma decimal separator. */
function parseNum(s: string): number {
  const n = parseFloat(s.replace(',', '.'))
  return Number.isFinite(n) && n >= 0 ? n : 0
}

export default function Calculator() {
  const { entries, projects, settings, setCalcRates } = useStore()
  const { t, locale } = useT()

  const [range, setRange] = useState<ReportRange>('month')
  const [custom, setCustom] = useState<CustomRange>({ from: '', to: '' })
  const [projectId, setProjectId] = useState<string>(projects[0]?.id ?? '')

  // Rate fields are persisted (see store.setCalcRates); mirror them locally as
  // strings so the inputs stay editable (incl. empty / partial values).
  const [rateStr, setRateStr] = useState<string>(settings.hourlyRate ? String(settings.hourlyRate) : '')
  const [fxStr, setFxStr] = useState<string>(settings.usdRate ? String(settings.usdRate) : '')

  const rate = parseNum(rateStr)
  const fx = parseNum(fxStr)

  const [fromMs, toMs] = rangeBounds(range, custom)

  const ms = useMemo(() => {
    const active = projectId || projects[0]?.id
    if (!active) return 0
    return entries
      .filter(e => e.projectId === active && e.start >= fromMs && e.start <= toMs)
      .reduce((s, e) => s + (e.end - e.start), 0)
  }, [entries, projectId, projects, fromMs, toMs])

  const hours = ms / 3_600_000
  const usd = hours * rate
  const uah = usd * fx

  const money = (n: number) =>
    n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const selectedId = projectId || projects[0]?.id || ''

  const inputStyle = {
    ...fieldStyle,
    width: '100%',
  } as const

  return (
    <div>
      <RangeSelector range={range} onRangeChange={setRange} custom={custom} onCustomChange={setCustom} />

      {/* Inputs */}
      <div className="rounded-card p-4 mb-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
        <div className="grid gap-3 sm:grid-cols-3">
          {/* Project */}
          <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--ink-dim)' }}>
            {t('calcProject')}
            <div className="relative flex items-center">
              <span
                className="absolute left-3 w-2.5 h-2.5 rounded-full flex-none pointer-events-none"
                style={{ background: projectColor(projects, selectedId) }}
              />
              <select
                className="select w-full pl-8 pr-3 py-2 text-sm rounded-[10px]"
                style={{ ...fieldStyle, backgroundColor: 'var(--panel-2)' }}
                value={selectedId}
                onChange={e => setProjectId(e.target.value)}
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </label>

          {/* Hourly rate */}
          <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--ink-dim)' }}>
            {t('calcRate')}
            <input
              type="number" min="0" step="0.01" inputMode="decimal"
              placeholder="0"
              className="px-3 py-2 text-sm rounded-[10px]"
              style={inputStyle}
              value={rateStr}
              onChange={e => { setRateStr(e.target.value); setCalcRates({ hourlyRate: parseNum(e.target.value) }) }}
            />
          </label>

          {/* FX rate */}
          <label className="flex flex-col gap-1.5 text-sm" style={{ color: 'var(--ink-dim)' }}>
            {t('calcFxRate')}
            <input
              type="number" min="0" step="0.01" inputMode="decimal"
              placeholder="0"
              className="px-3 py-2 text-sm rounded-[10px]"
              style={inputStyle}
              value={fxStr}
              onChange={e => { setFxStr(e.target.value); setCalcRates({ usdRate: parseNum(e.target.value) }) }}
            />
          </label>
        </div>
      </div>

      {/* Results */}
      {ms === 0 ? (
        <div className="text-sm text-center py-10" style={{ color: 'var(--ink-mute)' }}>
          {t('calcNoData')}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          <ResultCard label={t('calcHours')} value={hm(ms)} sub={`${hours.toFixed(2)} ${t('unitHour')}`} />
          <ResultCard label={t('calcAmountUsd')} value={`$${money(usd)}`} accent />
          <ResultCard
            label={t('calcAmountUah')}
            value={fx > 0 ? `₴${money(uah)}` : '—'}
            sub={fx > 0 ? undefined : t('calcSetFxHint')}
            accent={fx > 0}
          />
        </div>
      )}
    </div>
  )
}

function ResultCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-card p-4" style={{ background: 'var(--panel)', border: '1px solid var(--line)' }}>
      <div className="text-xs mb-1" style={{ color: 'var(--ink-mute)' }}>{label}</div>
      <div
        className="text-2xl font-semibold tabular-nums"
        style={{ color: accent ? 'var(--accent)' : 'var(--ink)' }}
      >
        {value}
      </div>
      {sub && <div className="text-xs mt-1" style={{ color: 'var(--ink-mute)' }}>{sub}</div>}
    </div>
  )
}
