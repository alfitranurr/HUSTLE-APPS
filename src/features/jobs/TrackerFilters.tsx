'use client';

import { Search, SlidersHorizontal, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Field, Input, Select } from '@/components/ui/Field';
import { CAREER_LEVELS, JOB_STAGES, JOB_STATUSES } from '@/lib/constants';
import { shortProvince } from '@/lib/format';
import { SEGMENTS, type Segment } from '@/lib/stats';
import { activeFilterCount, type JobFilters } from './filters';

interface TrackerFiltersProps {
  filters: JobFilters;
  onChange: (changes: Partial<JobFilters>) => void;
  onClear: () => void;
  provinces: string[];
  positions: string[];
}

export function TrackerFilters({ filters, onChange, onClear, provinces, positions }: TrackerFiltersProps) {
  const [open, setOpen] = useState(() => activeFilterCount({ ...filters, search: '' }) > 0);
  const { search, ...rest } = filters;
  const count = activeFilterCount({ ...filters, search: '' });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-0 flex-1 sm:max-w-sm">
          <span className="sr-only">Search applications</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            value={search}
            onChange={(e) => onChange({ search: e.target.value })}
            placeholder="Search company, role, notes…"
            className="pl-9"
          />
        </label>
        <Button
          variant={count > 0 ? 'subtle' : 'secondary'}
          icon={<SlidersHorizontal className="size-4" />}
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="tracker-filters"
        >
          Filters{count > 0 && ` · ${count}`}
        </Button>
        {(count > 0 || search) && (
          <Button variant="ghost" icon={<X className="size-4" />} onClick={onClear}>
            Clear
          </Button>
        )}
      </div>

      {open && (
        <div id="tracker-filters" className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-2 lg:grid-cols-4 animate-fade-in">
          <Field label="Group">
            <Select
              placeholder="Any group"
              options={(['active', 'interviews', 'offers', 'rejected', 'noResponse'] as const).map((s) => ({ value: s, label: SEGMENTS[s].label }))}
              value={rest.segment}
              onChange={(e) => onChange({ segment: e.target.value as Segment | '' })}
            />
          </Field>
          <Field label="Status">
            <Select placeholder="Any status" options={JOB_STATUSES} value={rest.status} onChange={(e) => onChange({ status: e.target.value })} />
          </Field>
          <Field label="Stage">
            <Select placeholder="Any stage" options={JOB_STAGES} value={rest.stage} onChange={(e) => onChange({ stage: e.target.value })} />
          </Field>
          <Field label="Career level">
            <Select
              placeholder="Any level"
              options={CAREER_LEVELS}
              value={rest.careerLevel}
              onChange={(e) => onChange({ careerLevel: e.target.value })}
            />
          </Field>
          <Field label="Position">
            <Select placeholder="Any position" options={positions} value={rest.position} onChange={(e) => onChange({ position: e.target.value })} />
          </Field>
          <Field label="Province">
            <Select
              placeholder="Any province"
              options={provinces.map((p) => ({ value: p, label: shortProvince(p) }))}
              value={rest.province}
              onChange={(e) => onChange({ province: e.target.value })}
            />
          </Field>
          {/* Date range stays on one row; follow-up goes last. */}
          <Field label="Applied from">
            <Input type="date" value={rest.from} max={rest.to || undefined} onChange={(e) => onChange({ from: e.target.value })} />
          </Field>
          <Field label="Applied until">
            <Input type="date" value={rest.to} min={rest.from || undefined} onChange={(e) => onChange({ to: e.target.value })} />
          </Field>
          <Field label="Follow-up">
            <Select
              placeholder="Any"
              options={[{ value: 'yes', label: 'Needs follow-up' }]}
              value={rest.followUp}
              onChange={(e) => onChange({ followUp: e.target.value === 'yes' ? 'yes' : '' })}
            />
          </Field>
        </div>
      )}
    </div>
  );
}
