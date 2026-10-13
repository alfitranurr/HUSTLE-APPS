'use client';

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { TimelinePoint } from '@/lib/stats';
import { ChartTooltip } from './ChartTooltip';

// Validated pair (CVD ΔE 26, contrast ≥ 3:1 on white).
const SERIES = [
  { key: 'Applications', color: '#4f46e5' },
  { key: 'Interviews', color: '#059669' },
] as const;

const AXIS = { stroke: '#94a3b8', fontSize: 12, tickLine: false, axisLine: false } as const;

export function TimelineChart({ data }: { data: TimelinePoint[] }) {
  return (
    <div>
      <ul className="mb-3 flex flex-wrap gap-4 text-xs text-slate-600" aria-label="Legend">
        {SERIES.map((s) => (
          <li key={s.key} className="flex items-center gap-1.5">
            <span aria-hidden className="h-0.5 w-4 rounded-full" style={{ backgroundColor: s.color }} />
            {s.key}
          </li>
        ))}
      </ul>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 256 }}>
          <LineChart data={data} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" {...AXIS} dy={8} />
            <YAxis allowDecimals={false} {...AXIS} />
            <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#cbd5e1', strokeDasharray: '3 3' }} />
            {SERIES.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                stroke={s.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
