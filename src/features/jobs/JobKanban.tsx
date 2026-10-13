'use client';

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CalendarDays } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/cn';
import { JOB_STAGES, STAGE_TONE, STATUS_TONE, type JobStage } from '@/lib/constants';
import { needsFollowUp } from '@/lib/followUp';
import { formatDate } from '@/lib/format';
import { TONES } from '@/lib/tones';
import type { Job } from '@/lib/types';

interface JobKanbanProps {
  jobs: Job[];
  onMove: (job: Job, stage: JobStage) => void;
  onOpen: (job: Job) => void;
}

/** Pipeline board: drag a card to another stage column to update it. */
export function JobKanban({ jobs, onMove, onOpen }: JobKanbanProps) {
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    // A short press-and-hold on touch screens so normal scrolling still works.
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 6 } }),
    useSensor(KeyboardSensor)
  );
  const [activeId, setActiveId] = useState<string | null>(null);

  const byStage = useMemo(() => {
    const map = new Map<JobStage, Job[]>(JOB_STAGES.map((s) => [s, []]));
    for (const job of jobs) map.get(job.stage)?.push(job);
    return map;
  }, [jobs]);

  const find = (id: unknown) => jobs.find((j) => j.id === id);
  const active = activeId ? find(activeId) : undefined;

  const announcements: Announcements = {
    onDragStart: ({ active: a }) => `Picked up ${find(a.id)?.company ?? 'application'}.`,
    onDragOver: ({ over }) => (over ? `Over ${over.id}.` : 'Not over a stage.'),
    onDragEnd: ({ active: a, over }) => (over ? `Moved ${find(a.id)?.company} to ${over.id}.` : 'Move cancelled.'),
    onDragCancel: () => 'Move cancelled.',
  };

  const handleDragEnd = ({ active: a, over }: DragEndEvent) => {
    setActiveId(null);
    const job = find(a.id);
    if (job && over) onMove(job, over.id as JobStage);
  };

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements }}
      onDragStart={({ active: a }) => setActiveId(String(a.id))}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex snap-x gap-4 overflow-x-auto p-4 sm:p-5">
        {JOB_STAGES.map((stage) => (
          <Column key={stage} stage={stage} jobs={byStage.get(stage) ?? []} onOpen={onOpen} />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>{active && <KanbanCard job={active} overlay />}</DragOverlay>
    </DndContext>
  );
}

function Column({ stage, jobs, onOpen }: { stage: JobStage; jobs: Job[]; onOpen: (job: Job) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const tone = TONES[STAGE_TONE[stage]];
  return (
    <section
      ref={setNodeRef}
      aria-label={`${stage}: ${jobs.length} applications`}
      className={cn(
        'relative flex w-72 shrink-0 snap-start flex-col 3xl:w-auto 3xl:min-w-60 3xl:flex-1 overflow-hidden rounded-xl bg-slate-50 transition-shadow',
        isOver && 'ring-2 ring-indigo-400'
      )}
    >
      <span aria-hidden className={cn('absolute inset-x-0 top-0 h-1', tone.bar)} />
      <header className="flex items-center justify-between px-3 pt-4 pb-2">
        <h3 className="text-sm font-semibold text-slate-800">{stage}</h3>
        <span className="rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 tabular-nums">
          {jobs.length}
        </span>
      </header>
      <div className="flex max-h-[65vh] min-h-24 flex-col gap-2 overflow-y-auto px-3 pb-3">
        {jobs.map((job) => (
          <DraggableCard key={job.id} job={job} onOpen={onOpen} />
        ))}
        {jobs.length === 0 && (
          <p className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">Drop here</p>
        )}
      </div>
    </section>
  );
}

function DraggableCard({ job, onOpen }: { job: Job; onOpen: (job: Job) => void }) {
  const { setNodeRef, attributes, listeners, isDragging } = useDraggable({ id: job.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(job)}
      onKeyDown={(e) => {
        listeners?.onKeyDown?.(e);
        if (e.key === 'Enter') onOpen(job);
      }}
      aria-roledescription="Draggable application. Press space to pick up, arrow keys to move, space to drop. Enter opens details."
      className={cn('cursor-grab rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 active:cursor-grabbing', isDragging && 'opacity-40')}
    >
      <KanbanCard job={job} />
    </div>
  );
}

function KanbanCard({ job, overlay = false }: { job: Job; overlay?: boolean }) {
  return (
    <article
      className={cn(
        'rounded-lg border border-l-4 border-slate-200 bg-white p-3 shadow-xs',
        TONES[STATUS_TONE[job.status]].edge,
        overlay && 'rotate-2 shadow-xl'
      )}
    >
      <p className="truncate text-sm font-semibold text-slate-900">{job.company}</p>
      <p className="truncate text-xs text-slate-500">{job.position || 'Position not set'}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-xs text-slate-500">
          <CalendarDays className="size-3.5" />
          {formatDate(job.appliedAt)}
        </span>
        {job.status === 'Failed' ? (
          <Badge tone="rose">Failed</Badge>
        ) : (
          needsFollowUp(job) && <Badge tone="amber">Follow up</Badge>
        )}
      </div>
    </article>
  );
}
