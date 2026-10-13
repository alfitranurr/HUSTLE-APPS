'use client';

import { CartesianGrid, LabelList, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimelinePoint } from '@/lib/stats';
import { ChartTooltip } from './ChartTooltip';

// Validated pair (CVD ΔE 26, contrast ≥ 3:1 on white). The dash pattern tells the lines apart without colour.
const SERIES = [
  { key: 'Applications', color: '#4f46e5', dash: '6 4', label: 'top' },
  { key: 'Interviews', color: '#059669', dash: undefined, label: 'bottom' },
] as const;

const AXIS = { stroke: '#94a3b8', fontSize: 11, tickLine: false, axisLine: false } as const;

/** Count above a point, hidden for empty months so the baseline stays quiet. */
const countLabel = (value: unknown) => (typeof value === 'number' && value > 0 ? value : '');

/** "Sep 26" → "Sep"; the year is kept on the first tick and on January. */
const monthTick = (name: string, index: number) => (index === 0 || name.startsWith('Jan') ? name : name.split(' ')[0]);

/**
 * Straight segments between monthly points (a smoothed curve suggests values
 * between months that don't exist). Fills its parent's height; `onSelect`
 * receives the month that was clicked.
 */
export function TimelineChart({ data, onSelect }: { data: TimelinePoint[]; onSelect?: (point: TimelinePoint) => void }) {
  return (
    <div className="flex h-full flex-col">
      <ul className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <svg aria-hidden width="22" height="8" viewBox="0 0 22 8">
              <line x1="1" y1="4" x2="21" y2="4" stroke={s.color} strokeWidth="2" strokeDasharray={s.dash} />
              <circle cx="11" cy="4" r="2.5" fill="#fff" stroke={s.color} strokeWidth="1.5" />
            </svg>
            {s.key}
          </li>
        ))}
      </ul>
      <div className="min-h-64 flex-1">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 256 }}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 16, left: -16, bottom: 0 }}
            onClick={(state) => {
              // Index first; the label is a fallback for clicks between ticks.
              const point = data[Number(state.activeTooltipIndex)] ?? data.find((p) => p.name === state.activeLabel);
              if (point && onSelect) onSelect(point);
            }}
            style={onSelect ? { cursor: 'pointer' } : undefined}
          >
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" {...AXIS} dy={8} interval={0} padding={{ left: 8, right: 8 }} tickFormatter={monthTick} />
            <YAxis allowDecimals={false} {...AXIS} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="linear"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                strokeDasharray={s.dash}
                dot={{ r: 3.5, fill: '#fff', stroke: s.color, strokeWidth: 2, strokeDasharray: '0' }}
                activeDot={{ r: 5, fill: s.color, stroke: '#fff', strokeWidth: 2 }}
                isAnimationActive={false}
              >
                <LabelList
                  dataKey={s.key}
                  position={s.label}
                  offset={8}
                  fill="#334155"
                  fontSize={11}
                  fontWeight={600}
                  // White halo keeps the number readable where a line passes behind it.
                  stroke="#fff"
                  strokeWidth={3}
                  paintOrder="stroke"
                  formatter={countLabel}
                />
              </Line>
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
