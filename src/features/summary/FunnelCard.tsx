import { TrendingDown } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { selectReached, type JobSelection } from '@/features/jobs/selection';
import { formatPercent } from '@/lib/format';
import { biggestDrop, type FunnelStep } from '@/lib/stats';
import { rowLabel, SelectableRow } from './SelectableRow';

interface FunnelCardProps {
  steps: FunnelStep[];
  onSelect: (selection: JobSelection) => void;
}

/** How far applications got, with the pass rate between consecutive stages. */
export function FunnelCard({ steps, onSelect }: FunnelCardProps) {
  const total = steps[0]?.reached ?? 0;
  const drop = biggestDrop(steps);

  return (
    <Card accent="indigo" className="h-full">
      <CardHeader title="Pipeline conversion" description="Applications that reached each stage (or went further)" />
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No applications in this timeframe</p>
        ) : (
          <>
            {drop && (
              <p className="flex items-start gap-2 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <TrendingDown className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>
                  Biggest drop: <strong className="font-semibold">{drop.from.label} → {drop.to.label}</strong>, only{' '}
                  {formatPercent(drop.to.fromPrevious ?? 0)} move on ({drop.from.reached} → {drop.to.reached}).
                </span>
              </p>
            )}
            <ol>
              {steps.map((step) => (
                <li key={step.stage}>
                  <SelectableRow
                    tone="indigo"
                    onSelect={() => onSelect(selectReached(step.stage))}
                    className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 py-1 text-sm"
                  >
                    <span className={`truncate ${rowLabel('indigo')}`}>{step.label}</span>
                    <span className="block h-2.5 overflow-hidden rounded-full bg-slate-100">
                      <span
                        className="block h-full rounded-full bg-indigo-500"
                        style={{ width: step.reached > 0 ? `max(${step.ofTotal}%, 0.375rem)` : 0 }}
                      />
                    </span>
                    <span className="w-28 text-right tabular-nums">
                      <span className="font-semibold text-slate-900">{step.reached}</span>
                      {step.fromPrevious !== null && (
                        <span className="ml-1.5 text-xs text-slate-500">{formatPercent(step.fromPrevious)} pass</span>
                      )}
                    </span>
                  </SelectableRow>
                </li>
              ))}
            </ol>
          </>
        )}
      </CardContent>
    </Card>
  );
}
