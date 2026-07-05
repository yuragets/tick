import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, Legend,
} from 'recharts'
import type { Project } from '../../types'
import { projectColor } from '../../utils/projects'
import { useT } from '../../i18n'

export interface ProjPoint {
  label: string
  value: number
  color: string
}

export interface DayPoint {
  label: string
  [projectId: string]: number | string
}

interface Props {
  mode: 'proj' | 'day'
  projData?: ProjPoint[]
  dayData?: DayPoint[]
  dayProjects?: Project[]
}

const tickStyle = { fill: 'var(--ink-mute)', fontSize: 12 }

const tooltipStyle = {
  background: 'var(--panel)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  color: 'var(--ink)',
}

const tooltipLabelStyle = { color: 'var(--ink)' }
const tooltipItemStyle = { color: 'var(--ink)' }

export default function ReportChart({ mode, projData = [], dayData = [], dayProjects = [] }: Props) {
  const { t } = useT()
  const h = t('unitHour')
  if (mode === 'proj') {
    if (!projData.length) return null
    return (
      <div style={{ width: '100%', height: 260, marginBottom: 18 }}>
        <ResponsiveContainer>
          <BarChart data={projData} barCategoryGap="30%">
            <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
            <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
            <YAxis
              tickFormatter={v => `${v}${h}`}
              tick={tickStyle}
              axisLine={false}
              tickLine={false}
              width={38}
            />
            <Tooltip
              formatter={(v: number) => [`${v} ${h}`, '']}
              contentStyle={tooltipStyle}
              labelStyle={tooltipLabelStyle}
              itemStyle={tooltipItemStyle}
              cursor={{ fill: 'rgba(255,255,255,.04)' }}
            />
            <Bar dataKey="value" maxBarSize={52} radius={[4, 4, 0, 0]}>
              {projData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    )
  }

  // Day mode — stacked bars per project
  if (!dayData.length || !dayProjects.length) return null

  return (
    <div style={{ width: '100%', height: 260, marginBottom: 18 }}>
      <ResponsiveContainer>
        <BarChart data={dayData} barCategoryGap="25%">
          <CartesianGrid vertical={false} stroke="rgba(255,255,255,.05)" />
          <XAxis dataKey="label" tick={tickStyle} axisLine={false} tickLine={false} />
          <YAxis
            tickFormatter={v => `${v}${h}`}
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            width={38}
          />
          <Tooltip
            formatter={(v: number, name: string) => [`${v} ${h}`, name]}
            contentStyle={tooltipStyle}
            labelStyle={tooltipLabelStyle}
            itemStyle={tooltipItemStyle}
            cursor={{ fill: 'rgba(255,255,255,.04)' }}
          />
          {dayProjects.length > 1 && (
            <Legend
              formatter={name => <span style={{ color: 'var(--ink-dim)', fontSize: 12 }}>{name}</span>}
            />
          )}
          {dayProjects.map(p => (
            <Bar
              key={p.id}
              dataKey={p.id}
              name={p.name}
              stackId="stack"
              fill={projectColor(dayProjects, p.id)}
              radius={dayProjects[dayProjects.length - 1]?.id === p.id ? [4, 4, 0, 0] : [0, 0, 0, 0]}
              maxBarSize={52}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
