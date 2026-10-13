import { CalendarClock, Plus } from 'lucide-react';
import { StageBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatDateTime } from '@/lib/format';
import type { Job } from '@/lib/types';

interface PipelineCardProps {
  /** Active applications with a test or interview ahead. */
  jobs: Job[];
  /** Questions prepared per company (lower-cased name). */
  prepared: Map<string, number>;
  onPrep: (company: string) => void;
  onAdd: (company: string) => void;
}

/** Links the question bank to the applications that need it now. */
export function PipelineCard({ jobs, prepared, onPrep, onAdd }: PipelineCardProps) {
  return (
    <Card accent="violet">
      <CardHeader
        title="In your pipeline"
        description="Active applications at a test or interview stage, and how many questions you have prepared for each"
      />
      <CardContent>
        <ul className="divide-y divide-slate-100">
          {jobs.map((job) => {
            const count = prepared.get(job.company.trim().toLowerCase()) ?? 0;
            return (
              <li key={job.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">{job.company}</span>
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                    {job.position || 'Position not set'}
                    {job.scheduledAt && (
                      <span className="inline-flex items-center gap-1 text-violet-700">
                        <CalendarClock className="size-3.5" />
                        {formatDateTime(job.scheduledAt)}
                      </span>
                    )}
                  </span>
                </span>
                <span className="flex shrink-0 flex-wrap items-center gap-2">
                  <StageBadge stage={job.stage} />
                  {count > 0 ? (
                    <Button size="sm" variant="subtle" onClick={() => onPrep(job.company)}>
                      {count} {count === 1 ? 'question' : 'questions'}
                    </Button>
                  ) : (
                    <Button size="sm" variant="secondary" icon={<Plus className="size-3.5" />} onClick={() => onAdd(job.company)}>
                      Add question
                    </Button>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
