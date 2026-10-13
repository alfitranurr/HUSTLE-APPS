import { ProgressBar } from '@/components/ui/ProgressBar';
import { percent } from '@/lib/format';
import type { CountItem } from '@/lib/stats';
import type { Tone } from '@/lib/tones';

interface BreakdownListProps {
  items: CountItem[];
  total: number;
  /** One tone for every bar, or a per-item tone (e.g. status colours). */
  tone: Tone | ((name: string) => Tone);
  emptyLabel?: string;
}

/** Ranked horizontal bars with count and share; labels stay in text colours. */
export function BreakdownList({ items, total, tone, emptyLabel = 'No data yet' }: BreakdownListProps) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{emptyLabel}</p>;
  return (
    <ul className="space-y-3">
      {items.map((item) => {
        const share = percent(item.value, total);
        return (
          <li key={item.name}>
            <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate text-slate-700" title={item.name}>
                {item.name}
              </span>
              <span className="shrink-0 text-slate-900 tabular-nums">
                <span className="font-semibold">{item.value}</span>
                <span className="ml-1.5 text-xs text-slate-500">{share}%</span>
              </span>
            </div>
            <ProgressBar value={share} tone={typeof tone === 'function' ? tone(item.name) : tone} label={`${item.name}: ${share}%`} />
          </li>
        );
      })}
    </ul>
  );
}
