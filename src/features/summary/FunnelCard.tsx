import { MapPin } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { selectReached, type JobSelection } from '@/features/jobs/selection';
import type { FunnelStep, StopPoint } from '@/lib/stats';
import { rowLabel, SelectableRow } from './SelectableRow';

interface FunnelCardProps {
  steps: FunnelStep[];
  stop: StopPoint | null;
  onSelect: (selection: JobSelection) => void;
}

/** How many applications went through each stage, as plain counts ("4 of 203"); the bar shows the share. */
export function FunnelCard({ steps, stop, onSelect }: FunnelCardProps) {
  const total = steps[0]?.reached ?? 0;

  return (
    <Card accent="indigo" className="h-full">
      <CardHeader
        title="Pipeline conversion"
        description="How many of your applications got to each stage. Stages you skipped aren't counted."
      />
      <CardContent className="space-y-4">
        {total === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No applications in this timeframe</p>
        ) : (
          <>
            {stop && (
              <p className="flex items-start gap-2 rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                <MapPin className="mt-0.5 size-4 shrink-0 text-amber-600" />
                <span>
                  Most applications end up at <strong className="font-semibold">{stop.label}</strong>: {stop.count} of{' '}
                  your {total} applications.
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
                    <span className="w-24 text-right tabular-nums">
                      <span className="font-semibold text-slate-900">{step.reached}</span>
                      <span className="ml-1 text-xs text-slate-500">of {total}</span>
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
