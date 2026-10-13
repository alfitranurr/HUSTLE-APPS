'use client';

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CountItem } from '@/lib/stats';
import { ChartTooltip } from './ChartTooltip';

/** Single-series horizontal bars: long role names stay readable. */
export function PositionsChart({ data }: { data: CountItem[] }) {
  if (data.length === 0) return <p className="py-6 text-center text-sm text-slate-500">No positions recorded yet</p>;
  return (
    <div style={{ height: Math.max(160, data.length * 36) }}>
      <ResponsiveContainer width="100%" height="100%" initialDimension={{ width: 480, height: 256 }}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, left: 0, bottom: 0 }} barCategoryGap={8}>
          <CartesianGrid horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis
            type="category"
            dataKey="name"
            width={140}
            stroke="#475569"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => (v.length > 20 ? `${v.slice(0, 19)}…` : v)}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" name="Applications" fill="#4f46e5" radius={[0, 4, 4, 0]} maxBarSize={20} isAnimationActive={false}>
            {/* Count at the end of each bar; text colour, not the series colour. */}
            <LabelList dataKey="value" position="right" offset={8} fill="#334155" fontSize={12} fontWeight={600} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
