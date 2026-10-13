'use client';

import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { StageBadge, StatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { selectCompany, type JobSelection } from '@/features/jobs/selection';
import type { CompanyStat } from '@/lib/stats';
import { rowLabel, SelectableRow } from './SelectableRow';

const VISIBLE = 8;

function CompanyRows({ stats, onSelect }: { stats: CompanyStat[]; onSelect: (company: string) => void }) {
  return (
    <ul className="divide-y divide-slate-100">
      {stats.map((row) => (
        <li key={row.company} className="py-0.5">
          <SelectableRow tone="indigo" onSelect={() => onSelect(row.company)}>
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className={`min-w-0 [overflow-wrap:anywhere] ${rowLabel('indigo')}`}>{row.company}</span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-slate-900">{row.applications}</span>
                <span className="ml-1 text-xs text-slate-500">{row.applications === 1 ? 'app' : 'apps'}</span>
              </span>
            </span>
            <span className="mt-1 flex flex-wrap gap-1.5">
              <StageBadge stage={row.furthest} />
              <StatusBadge status={row.status} />
            </span>
          </SelectableRow>
        </li>
      ))}
    </ul>
  );
}

/** Companies ranked by how far you got with them, then by how often you applied. */
export function CompaniesCard({ stats, onSelect }: { stats: CompanyStat[]; onSelect: (selection: JobSelection) => void }) {
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? stats.filter((row) => row.company.toLowerCase().includes(q)) : stats;
  }, [stats, query]);

  const select = (company: string) => {
    setShowAll(false);
    onSelect(selectCompany(company));
  };

  return (
    <Card accent="indigo" className="h-full">
      <CardHeader
        title="Companies"
        description="Furthest stage reached at each company"
        action={
          stats.length > VISIBLE && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll(true)}>
              View all {stats.length}
            </Button>
          )
        }
      />
      <CardContent>
        {stats.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No applications in this timeframe</p>
        ) : (
          <CompanyRows stats={stats.slice(0, VISIBLE)} onSelect={select} />
        )}
      </CardContent>

      <Modal
        open={showAll}
        onClose={() => setShowAll(false)}
        size="lg"
        accent="indigo"
        title={`All companies · ${stats.length}`}
        description="Furthest stage first. Select a company to see its applications."
      >
        <label className="relative mb-4 block">
          <span className="sr-only">Search companies</span>
          <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            data-autofocus
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search companies…"
            className="pl-9"
          />
        </label>
        {filtered.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">No matches</p>
        ) : (
          <CompanyRows stats={filtered} onSelect={select} />
        )}
      </Modal>
    </Card>
  );
}
