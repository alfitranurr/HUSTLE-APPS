interface ChartTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string | number; value?: number | string; color?: string }[];
}

/** Light tooltip shared by the Recharts charts. Values use text colours; a swatch carries identity. */
export function ChartTooltip({ active, label, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-lg">
      {label !== undefined && <p className="mb-1 font-semibold text-slate-900">{label}</p>}
      {payload.map((entry) => (
        <p key={String(entry.name)} className="flex items-center gap-2 text-slate-600">
          <span aria-hidden className="size-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold text-slate-900 tabular-nums">{entry.value}</span>
        </p>
      ))}
    </div>
  );
}
