'use client';

import { CheckCircle2, ClipboardPaste, EyeOff, Inbox, Search, SearchX, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input, Select } from '@/components/ui/Field';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { StatCard } from '@/components/ui/StatCard';
import { useToast } from '@/components/ui/Toast';
import { useJobDialogs } from '@/features/jobs/useJobDialogs';
import { useJobs } from '@/hooks/useJobs';
import { errorMessage } from '@/lib/api';
import { FAIR_MATCH, STRONG_MATCH } from '@/lib/constants';
import { guessCareerLevel, scoreJob } from '@/lib/matching';
import type { Recommendation, RecommendationStatus } from '@/lib/types';
import { setRecommendationStatus, useProfile, useRecommendations } from './matchApi';
import { PasteModal } from './PasteModal';
import { ProfileCard } from './ProfileCard';
import { ProfileModal } from './ProfileModal';
import { RecommendationCard } from './RecommendationCard';
import { SourcesCard } from './SourcesCard';

type StatusFilter = RecommendationStatus | 'all';
const NO_FILTERS = { search: '', status: 'new' as StatusFilter, source: '', minScore: '' };

export function MatchesView() {
  const toast = useToast();
  const { profile, isLoading: profileLoading, mutate: mutateProfile } = useProfile();
  const { items, isLoading, mutate } = useRecommendations();
  const { jobs, mutate: mutateJobs } = useJobs();
  const { openCreateWith, dialogs } = useJobDialogs(mutateJobs);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [editingProfile, setEditingProfile] = useState(false);
  const [pasting, setPasting] = useState(false);

  const scored = useMemo(
    () =>
      items
        .map((item) => ({ item, match: scoreJob(item, profile, jobs) }))
        .sort((a, b) => b.match.score - a.match.score || b.item.receivedAt.localeCompare(a.item.receivedAt)),
    [items, profile, jobs]
  );

  const stats = useMemo(() => {
    const open = scored.filter((s) => s.item.status === 'new');
    return {
      new: open.length,
      strong: open.filter((s) => s.match.score >= STRONG_MATCH && !s.match.alreadyApplied).length,
      added: scored.filter((s) => s.item.status === 'added').length,
      dismissed: scored.filter((s) => s.item.status === 'dismissed').length,
    };
  }, [scored]);

  const visible = useMemo(() => {
    const query = filters.search.trim().toLowerCase();
    const min = Number(filters.minScore) || 0;
    return scored.filter(
      ({ item, match }) =>
        (filters.status === 'all' || item.status === filters.status) &&
        (!filters.source || item.source === filters.source) &&
        match.score >= min &&
        (!query || `${item.title} ${item.company} ${item.location}`.toLowerCase().includes(query))
    );
  }, [scored, filters]);

  const changeStatus = async (item: Recommendation, status: RecommendationStatus) => {
    await mutate(
      async (current) => {
        await setRecommendationStatus(item.id, status);
        return current?.map((i) => (i.id === item.id ? { ...i, status } : i));
      },
      {
        optimisticData: (current) => (current ?? []).map((i) => (i.id === item.id ? { ...i, status } : i)),
        rollbackOnError: true,
        revalidate: false,
      }
    ).catch((err) => toast.error(errorMessage(err)));
  };

  const add = (item: Recommendation) =>
    openCreateWith(
      {
        company: item.company,
        position: item.title,
        platform: 'LinkedIn',
        careerLevel: guessCareerLevel(item.title),
        linkedin: item.url,
        note: `Recommended on LinkedIn${item.location ? ` · ${item.location}` : ''}`,
      },
      () => void changeStatus(item, 'added')
    );

  const empty = !isLoading && items.length === 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Job match"
        badge={<Badge tone="amber">Beta</Badge>}
        description="The jobs LinkedIn recommends to you, scored against your profile. Rule-based and free. Still in beta: scores are a rough guide and may change."
        actions={
          <Button icon={<ClipboardPaste className="size-4" />} onClick={() => setPasting(true)}>
            Paste from LinkedIn
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ProfileCard
            profile={profile}
            loading={profileLoading}
            onEdit={() => setEditingProfile(true)}
            onUploaded={(saved) => void mutateProfile(saved, { revalidate: false })}
          />
        </div>
        <SourcesCard onPaste={() => setPasting(true)} />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="New" value={stats.new} tone="violet" icon={<Inbox className="size-4" />} loading={isLoading} onClick={() => setFilters({ ...NO_FILTERS, status: 'new' })} actionLabel="Show" />
        <StatCard
          label="Strong matches"
          value={stats.strong}
          hint={`Score ${STRONG_MATCH}+ and not applied yet`}
          tone="emerald"
          icon={<Sparkles className="size-4" />}
          loading={isLoading}
          onClick={() => setFilters({ ...NO_FILTERS, status: 'new', minScore: String(STRONG_MATCH) })}
          actionLabel="Show"
        />
        <StatCard label="Added" value={stats.added} tone="sky" icon={<CheckCircle2 className="size-4" />} loading={isLoading} onClick={() => setFilters({ ...NO_FILTERS, status: 'added' })} actionLabel="Show" />
        <StatCard label="Dismissed" value={stats.dismissed} tone="slate" icon={<EyeOff className="size-4" />} loading={isLoading} onClick={() => setFilters({ ...NO_FILTERS, status: 'dismissed' })} actionLabel="Show" />
      </div>

      <Card accent="violet" className="p-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="relative">
            <span className="sr-only">Search jobs</span>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <Input type="search" value={filters.search} onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))} placeholder="Search title or company…" className="pl-9" />
          </label>
          <Select
            aria-label="Status"
            options={[
              { value: 'new', label: 'New' },
              { value: 'added', label: 'Added' },
              { value: 'dismissed', label: 'Dismissed' },
              { value: 'all', label: 'All statuses' },
            ]}
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value as StatusFilter }))}
          />
          <Select
            aria-label="Source"
            placeholder="All sources"
            options={[
              { value: 'email', label: 'Email (older imports)' },
              { value: 'paste', label: 'Pasted' },
            ]}
            value={filters.source}
            onChange={(e) => setFilters((f) => ({ ...f, source: e.target.value }))}
          />
          <Select
            aria-label="Minimum score"
            placeholder="Any score"
            options={[
              { value: String(FAIR_MATCH), label: `Score ${FAIR_MATCH}+` },
              { value: String(STRONG_MATCH), label: `Score ${STRONG_MATCH}+` },
            ]}
            value={filters.minScore}
            onChange={(e) => setFilters((f) => ({ ...f, minScore: e.target.value }))}
          />
        </div>
        {!profile && !profileLoading && items.length > 0 && (
          <p className="mt-3 text-xs text-amber-700">Upload your profile PDF to get match scores. Until then every job scores 0.</p>
        )}
      </Card>

      {isLoading ? (
        <SkeletonRows rows={4} />
      ) : empty ? (
        <EmptyState
          icon={<Inbox className="size-5" />}
          title="No recommendations yet"
          description="Paste the “Top job picks for you” page from LinkedIn to see how each job matches your profile."
          action={
            <Button icon={<ClipboardPaste className="size-4" />} onClick={() => setPasting(true)}>
              Paste from LinkedIn
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={<SearchX className="size-5" />}
          title="No jobs match these filters"
          action={
            <Button variant="secondary" onClick={() => setFilters({ ...NO_FILTERS, status: 'all' })}>
              Show everything
            </Button>
          }
        />
      ) : (
        <div className="grid items-start gap-3 2xl:grid-cols-2">
          {visible.map(({ item, match }) => (
            <RecommendationCard
              key={item.id}
              item={item}
              match={match}
              onAdd={add}
              onDismiss={(i) => void changeStatus(i, 'dismissed')}
              onRestore={(i) => void changeStatus(i, 'new')}
            />
          ))}
        </div>
      )}

      {editingProfile && profile && (
        <ProfileModal profile={profile} onClose={() => setEditingProfile(false)} onSaved={(saved) => void mutateProfile(saved, { revalidate: false })} />
      )}
      {pasting && <PasteModal onClose={() => setPasting(false)} onImported={() => void mutate()} />}
      {dialogs}
    </div>
  );
}
