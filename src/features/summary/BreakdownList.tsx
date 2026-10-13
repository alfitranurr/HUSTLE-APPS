import { ProgressBar } from '@/components/ui/ProgressBar';
import { cn } from '@/lib/cn';
import { formatPercent, percent } from '@/lib/format';
import type { CountItem } from '@/lib/stats';
import type { Tone } from '@/lib/tones';
import { rowLabel, SelectableRow } from './SelectableRow';

interface BreakdownListProps {
  items: CountItem[];
  total: number;
  /** One tone for every bar, or a per-item tone (e.g. status colours). */
  tone: Tone | ((name: string) => Tone);
  emptyLabel?: string;
  /** Makes each row open the companies behind it. */
  onSelect?: (name: string) => void;
}

/** Ranked horizontal bars with count and share; labels stay in text colours. */
export function BreakdownList({ items, total, tone, emptyLabel = 'No data yet', onSelect }: BreakdownListProps) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{emptyLabel}</p>;
  return (
    <ul className={onSelect ? 'space-y-0.5' : 'space-y-3'}>
      {items.map((item) => {
        const share = percent(item.value, total);
        const itemTone = typeof tone === 'function' ? tone(item.name) : tone;
        return (
          <li key={item.name}>
            <SelectableRow tone={itemTone} onSelect={onSelect && (() => onSelect(item.name))}>
              <span className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                <span className={cn('min-w-0 [overflow-wrap:anywhere]', onSelect ? rowLabel(itemTone) : 'text-slate-700')}>
                  {item.name}
                </span>
                <span className="shrink-0 text-slate-900 tabular-nums">
                  <span className="font-semibold">{item.value}</span>
                  <span className="ml-1.5 text-xs text-slate-500">{formatPercent(share)}</span>
                </span>
              </span>
              <ProgressBar
                value={share}
                tone={itemTone}
                label={`${item.name}: ${formatPercent(share)}`}
              />
            </SelectableRow>
          </li>
        );
      })}
    </ul>
  );
}
