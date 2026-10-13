'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import { needsFollowUp } from '@/lib/followUp';
import { SEGMENTS, type Segment } from '@/lib/stats';
import { TONES, type Tone } from '@/lib/tones';
import type { Job } from '@/lib/types';
import type { JobFilters } from './filters';

interface Chip {
  key: string;
  label: string;
  tone: Tone;
  /** Filter values this chip sets (and checks for being active). */
  segment: '' | Segment;
  followUp: '' | 'yes';
  count: (jobs: Job[]) => number;
}

const CHIPS: Chip[] = [
  { key: 'all', label: 'All', tone: 'indigo', segment: '', followUp: '', count: (j) => j.length },
  { key: 'active', label: 'Active', tone: 'sky', segment: 'active', followUp: '', count: (j) => j.filter(SEGMENTS.active.match).length },
  { key: 'followUp', label: 'Needs follow-up', tone: 'amber', segment: '', followUp: 'yes', count: (j) => j.filter((x) => needsFollowUp(x)).length },
  { key: 'interviews', label: 'Interviewed', tone: 'violet', segment: 'interviews', followUp: '', count: (j) => j.filter(SEGMENTS.interviews.match).length },
  { key: 'offers', label: 'Offers', tone: 'emerald', segment: 'offers', followUp: '', count: (j) => j.filter(SEGMENTS.offers.match).length },
  { key: 'rejected', label: 'Rejected', tone: 'rose', segment: 'rejected', followUp: '', count: (j) => j.filter(SEGMENTS.rejected.match).length },
  { key: 'noResponse', label: 'No response', tone: 'slate', segment: 'noResponse', followUp: '', count: (j) => j.filter(SEGMENTS.noResponse.match).length },
];

interface QuickFiltersProps {
  jobs: Job[];
  filters: JobFilters;
  onChange: (changes: Partial<JobFilters>) => void;
}

/** One-click views over all applications; counts ignore the other filters. */
export function QuickFilters({ jobs, filters, onChange }: QuickFiltersProps) {
  const counts = useMemo(() => Object.fromEntries(CHIPS.map((c) => [c.key, c.count(jobs)])), [jobs]);

  return (
    <div role="group" aria-label="Quick filters" className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
      {CHIPS.map((chip) => {
        const active = filters.segment === chip.segment && filters.followUp === chip.followUp;
        return (
          <button
            key={chip.key}
            type="button"
            aria-pressed={active}
            onClick={() => onChange({ segment: chip.segment, followUp: chip.followUp })}
            className={cn(
              'inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset transition-colors',
              'focus-visible:outline-2 focus-visible:outline-indigo-600',
              active ? TONES[chip.tone].badge : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50'
            )}
          >
            {chip.key !== 'all' && <span aria-hidden className={cn('size-1.5 rounded-full', TONES[chip.tone].bar)} />}
            {chip.label}
            <span className={cn('tabular-nums', active ? 'opacity-80' : 'text-slate-400')}>{counts[chip.key]}</span>
          </button>
        );
      })}
    </div>
  );
}
