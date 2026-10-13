'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/cn';
import { addDays, formatDate, parseDate, startOfDay, startOfWeek, toDateKey } from '@/lib/format';
import type { Job } from '@/lib/types';

const WEEKS = 53;
const LEVELS = ['bg-slate-100', 'bg-emerald-200', 'bg-emerald-400', 'bg-emerald-500', 'bg-emerald-700'];
const level = (count: number) => Math.min(count, LEVELS.length - 1);

interface Day {
  date: Date;
  count: number;
}

/** GitHub-style calendar of applications per day over the last 12 months (weeks start Monday). */
export function ActivityHeatmap({ jobs }: { jobs: Job[] }) {
  const { weeks, months, total, activeDays } = useMemo(() => {
    const today = startOfDay(new Date());
    const start = addDays(startOfWeek(today), -(WEEKS - 1) * 7);

    const counts = new Map<string, number>();
    let total = 0;
    for (const job of jobs) {
      const applied = parseDate(job.appliedAt);
      if (!applied || applied < start || applied > addDays(today, 1)) continue;
      const key = toDateKey(applied);
      counts.set(key, (counts.get(key) ?? 0) + 1);
      total += 1;
    }

    const weeks: (Day | null)[][] = [];
    const months: { label: string; column: number }[] = [];
    for (let w = 0; w < WEEKS; w++) {
      const week: (Day | null)[] = [];
      for (let d = 0; d < 7; d++) {
        const date = addDays(start, w * 7 + d);
        week.push(date > today ? null : { date, count: counts.get(toDateKey(date)) ?? 0 });
        if (date.getDate() === 1 && date <= today) {
          months.push({ label: date.toLocaleDateString('en-GB', { month: 'short' }), column: w });
        }
      }
      weeks.push(week);
    }
    return { weeks, months, total, activeDays: counts.size };
  }, [jobs]);

  return (
    <Card accent="emerald">
      <CardHeader
        title="Application activity"
        description={`${total} applications on ${activeDays} days in the last 12 months`}
      />
      <CardContent>
        <div className="overflow-x-auto pb-1">
          <div className="inline-grid min-w-max grid-cols-[auto_1fr] gap-x-2">
            <span />
            <div className="relative h-5 text-[11px] text-slate-500">
              {months.map((m) => (
                <span key={`${m.label}-${m.column}`} className="absolute" style={{ left: m.column * 14 }}>
                  {m.label}
                </span>
              ))}
            </div>
            <div className="grid grid-rows-7 gap-[3px] text-[10px] leading-[11px] text-slate-400">
              {['Mon', '', 'Wed', '', 'Fri', '', ''].map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>
            <div className="grid grid-flow-col grid-rows-7 gap-[3px]" role="img" aria-label={`${total} applications in the last 12 months`}>
              {weeks.flatMap((week, w) =>
                week.map((day, d) =>
                  day ? (
                    <span
                      key={`${w}-${d}`}
                      title={`${day.count} application${day.count === 1 ? '' : 's'} · ${formatDate(day.date)}`}
                      className={cn('size-[11px] rounded-[3px]', LEVELS[level(day.count)])}
                    />
                  ) : (
                    <span key={`${w}-${d}`} className="size-[11px]" />
                  )
                )
              )}
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-xs text-slate-500">
          Less
          {LEVELS.map((c) => (
            <span key={c} className={cn('size-[11px] rounded-[3px]', c)} />
          ))}
          More
        </div>
      </CardContent>
    </Card>
  );
}
