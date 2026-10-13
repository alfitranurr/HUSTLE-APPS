import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { selectPosition, type JobSelection } from '@/features/jobs/selection';
import { formatPercent } from '@/lib/format';
import type { PositionStat } from '@/lib/stats';
import { rowLabel, SelectableRow } from './SelectableRow';

interface PositionsCardProps {
  stats: PositionStat[];
  onSelect: (selection: JobSelection) => void;
}

/** Which roles turn into interviews; only roles with enough applications to compare. */
export function PositionsCard({ stats, onSelect }: PositionsCardProps) {
  return (
    <Card accent="fuchsia" className="h-full">
      <CardHeader title="Conversion by position" description="Positions with 3+ applications" />
      <CardContent>
        {stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Not enough applications per position yet</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {stats.slice(0, 6).map((row) => (
              <li key={row.position} className="py-0.5">
                <SelectableRow tone="fuchsia" onSelect={() => onSelect(selectPosition(row.position, 'fuchsia'))}>
                  <span className="flex items-baseline justify-between gap-3 text-sm">
                    <span className={`min-w-0 [overflow-wrap:anywhere] ${rowLabel('fuchsia')}`}>{row.position}</span>
                    <span className="shrink-0 tabular-nums">
                      <span className="font-semibold text-slate-900">{row.applications}</span>
                      <span className="ml-1 text-xs text-slate-500">{row.applications === 1 ? 'app' : 'apps'}</span>
                    </span>
                  </span>
                  <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500 tabular-nums">
                    <span>
                      <span className="font-semibold text-violet-700">{row.interviewed}</span> interviewed (
                      {formatPercent(row.interviewRate)})
                    </span>
                    <span>
                      <span className="font-semibold text-rose-700">{row.rejected}</span> rejected
                    </span>
                  </span>
                </SelectableRow>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
