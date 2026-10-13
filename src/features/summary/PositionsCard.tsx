'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { selectPosition, type JobSelection } from '@/features/jobs/selection';
import { formatPercent } from '@/lib/format';
import type { PositionStat } from '@/lib/stats';
import { rowLabel, SelectableRow } from './SelectableRow';

const VISIBLE = 6;
const MIN_APPLICATIONS = 3;

function PositionRows({ stats, onSelect }: { stats: PositionStat[]; onSelect: (position: string) => void }) {
  return (
    <ul className="divide-y divide-slate-100">
      {stats.map((row) => (
        <li key={row.position} className="py-0.5">
          <SelectableRow tone="fuchsia" onSelect={() => onSelect(row.position)}>
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
  );
}

interface PositionsCardProps {
  /** Every position, most applications first. */
  stats: PositionStat[];
  onSelect: (selection: JobSelection) => void;
}

/** How many applications each role gets and how many turn into interviews. */
export function PositionsCard({ stats, onSelect }: PositionsCardProps) {
  const [showAll, setShowAll] = useState(false);
  const comparable = stats.filter((row) => row.applications >= MIN_APPLICATIONS);
  const select = (position: string) => {
    setShowAll(false);
    onSelect(selectPosition(position, 'fuchsia'));
  };

  return (
    <Card accent="fuchsia" className="h-full">
      <CardHeader
        title="Conversion by position"
        description={`Positions with ${MIN_APPLICATIONS}+ applications`}
        action={
          stats.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
              View all {stats.length}
            </Button>
          )
        }
      />
      <CardContent>
        {comparable.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">Not enough applications per position yet</p>
        ) : (
          <PositionRows stats={comparable.slice(0, VISIBLE)} onSelect={select} />
        )}
      </CardContent>

      <Modal
        open={showAll}
        onClose={() => setShowAll(false)}
        size="lg"
        accent="fuchsia"
        title={`All positions · ${stats.length}`}
        description="Most applications first. Select a position to see its applications."
      >
        <PositionRows stats={stats} onSelect={select} />
      </Modal>
    </Card>
  );
}
