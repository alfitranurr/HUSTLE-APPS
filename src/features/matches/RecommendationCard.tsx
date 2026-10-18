import { ClipboardPaste, ExternalLink, EyeOff, Mail, Plus, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button, buttonClasses } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { FAIR_MATCH, STRONG_MATCH } from '@/lib/constants';
import { formatRelative } from '@/lib/format';
import type { MatchResult } from '@/lib/matching';
import { TONES, type Tone } from '@/lib/tones';
import type { Recommendation } from '@/lib/types';

export const scoreTone = (score: number): Tone => (score >= STRONG_MATCH ? 'emerald' : score >= FAIR_MATCH ? 'amber' : 'slate');

interface RecommendationCardProps {
  item: Recommendation;
  match: MatchResult;
  onAdd: (item: Recommendation) => void;
  onDismiss: (item: Recommendation) => void;
  onRestore: (item: Recommendation) => void;
}

export function RecommendationCard({ item, match, onAdd, onDismiss, onRestore }: RecommendationCardProps) {
  const tone = scoreTone(match.score);
  const closed = item.status !== 'new';

  return (
    <article
      className={cn(
        'flex gap-4 rounded-xl border border-l-4 border-slate-200 bg-white p-4 shadow-sm',
        TONES[tone].edge,
        closed && 'opacity-75'
      )}
    >
      <div
        className={cn('grid size-12 shrink-0 place-items-center rounded-xl text-lg font-bold tabular-nums', TONES[tone].badge)}
        title="Match score out of 100"
      >
        {match.score}
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 [overflow-wrap:anywhere]">{item.title}</h3>
          <p className="text-xs text-slate-500 [overflow-wrap:anywhere]">
            {item.company}
            {item.location && <> · {item.location}</>}
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {match.alreadyApplied && <Badge tone="sky" dot>In Applications</Badge>}
          {item.status === 'added' && <Badge tone="emerald" dot>Added</Badge>}
          {item.status === 'dismissed' && <Badge tone="slate">Dismissed</Badge>}
          {match.reasons.map((reason) => (
            <Badge key={reason} tone={match.excludedBy ? 'rose' : 'indigo'}>
              {reason}
            </Badge>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1 text-xs text-slate-500">
            {item.source === 'email' ? <Mail className="size-3.5" /> : <ClipboardPaste className="size-3.5" />}
            {item.source === 'email' ? 'Email' : 'Pasted'} · {formatRelative(item.receivedAt)}
          </span>
          <span className="flex flex-wrap items-center gap-1.5">
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className={buttonClasses('ghost', 'sm')}>
                <ExternalLink className="size-3.5" />
                LinkedIn
              </a>
            )}
            {item.status === 'dismissed' ? (
              <Button variant="ghost" size="sm" icon={<RotateCcw className="size-3.5" />} onClick={() => onRestore(item)}>
                Restore
              </Button>
            ) : (
              item.status === 'new' && (
                <Button variant="ghost" size="sm" icon={<EyeOff className="size-3.5" />} onClick={() => onDismiss(item)}>
                  Dismiss
                </Button>
              )
            )}
            {item.status !== 'added' && !match.alreadyApplied && (
              <Button size="sm" icon={<Plus className="size-3.5" />} onClick={() => onAdd(item)}>
                Add to Applications
              </Button>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}
