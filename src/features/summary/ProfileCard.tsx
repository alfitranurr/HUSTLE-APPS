'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import type { JobSelection } from '@/features/jobs/selection';
import { shortProvince } from '@/lib/format';
import { countBy, coverage } from '@/lib/stats';
import type { Job } from '@/lib/types';
import { BreakdownList } from './BreakdownList';

type Dimension = 'level' | 'platform' | 'city' | 'province';

interface DimensionConfig {
  label: string;
  pick: (job: Job) => string;
  ignore?: string[];
  /** Applications filters that reproduce one value; `example` is a job with that value. */
  filters: (value: string, example: Job | undefined) => JobSelection['filters'];
}

const DIMENSIONS: Record<Dimension, DimensionConfig> = {
  level: {
    label: 'Level',
    pick: (j) => j.careerLevel,
    ignore: ['Not Specified'],
    filters: (value) => ({ careerLevel: value }),
  },
  platform: {
    label: 'Platform',
    pick: (j) => j.platform,
    ignore: ['Other'],
    filters: (value) => ({ search: value }),
  },
  city: {
    label: 'City',
    pick: (j) => j.city.replace(/^(Kota|Kabupaten)\s+/i, ''),
    filters: (value) => ({ search: value }),
  },
  province: {
    label: 'Province',
    pick: (j) => shortProvince(j.province),
    filters: (_value, example) => (example ? { province: example.province } : undefined),
  },
};

/**
 * Career level, platform and location in one card. These fields are often left
 * empty, so shares are computed over the applications that have a value.
 */
export function ProfileCard({ jobs, onSelect }: { jobs: Job[]; onSelect: (selection: JobSelection) => void }) {
  const [dimension, setDimension] = useState<Dimension>('level');
  const config = DIMENSIONS[dimension];
  const { items, filled } = useMemo(() => {
    const { pick, ignore = [] } = DIMENSIONS[dimension];
    const known = (job: Job) => {
      const value = pick(job).trim();
      return value && !ignore.includes(value) ? value : '';
    };
    return { items: countBy(jobs, known, 6), filled: coverage(jobs, pick, ignore) };
  }, [jobs, dimension]);

  const select = (value: string) => {
    const match = (job: Job) => config.pick(job).trim() === value;
    onSelect({
      title: `${config.label}: ${value}`,
      tone: 'teal',
      match,
      filters: config.filters(value, jobs.find(match)),
    });
  };

  return (
    <Card accent="teal" className="h-full">
      <CardHeader
        title="Application profile"
        description={`Filled in for ${filled} of ${jobs.length} applications`}
      />
      <CardContent className="space-y-4">
        <SegmentedControl
          label="Breakdown"
          value={dimension}
          onChange={setDimension}
          options={(Object.keys(DIMENSIONS) as Dimension[]).map((d) => ({ value: d, label: DIMENSIONS[d].label }))}
        />
        <BreakdownList items={items} total={filled} tone="teal" emptyLabel="Not filled in yet" onSelect={select} />
      </CardContent>
    </Card>
  );
}
