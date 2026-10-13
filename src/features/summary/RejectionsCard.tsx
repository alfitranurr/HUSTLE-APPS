import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { selectRejectedAt, selectSegment, type JobSelection } from '@/features/jobs/selection';
import { formatPercent } from '@/lib/format';
import type { RejectionPoint } from '@/lib/stats';
import { rowLabel, SelectableRow } from './SelectableRow';

interface RejectionsCardProps {
  points: RejectionPoint[];
  noResponse: number;
  onSelect: (selection: JobSelection) => void;
}

/** Where applications get rejected, relative to how many reached that stage. */
export function RejectionsCard({ points, noResponse, onSelect }: RejectionsCardProps) {
  const total = points.reduce((sum, p) => sum + p.rejected, 0);

  return (
    <Card accent="rose" className="h-full">
      <CardHeader title="Where you get rejected" description={`${total} rejections by stage`} />
      <CardContent>
        {points.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No rejections recorded</p>
        ) : (
          <ul className="space-y-0.5">
            {points.map((point) => (
              <li key={point.stage}>
                <SelectableRow tone="rose" onSelect={() => onSelect(selectRejectedAt(point.stage))}>
                  <span className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                    <span className={rowLabel('rose')}>{point.label}</span>
                    <span className="shrink-0 text-slate-900 tabular-nums">
                      <span className="font-semibold">{point.rejected}</span>
                      <span className="ml-1.5 text-xs text-slate-500">
                        {formatPercent(point.rate)} of {point.reached}
                      </span>
                    </span>
                  </span>
                  <ProgressBar value={point.rate} tone="rose" label={`${point.label}: ${formatPercent(point.rate)} rejected`} />
                </SelectableRow>
              </li>
            ))}
          </ul>
        )}
        {noResponse > 0 && (
          <SelectableRow tone="slate" onSelect={() => onSelect(selectSegment('noResponse'))} className="mt-3 text-xs text-slate-500">
            Plus <span className="font-semibold text-slate-700">{noResponse}</span>{' '}
            <span className={rowLabel('slate')}>closed as no response</span>
          </SelectableRow>
        )}
      </CardContent>
    </Card>
  );
}
