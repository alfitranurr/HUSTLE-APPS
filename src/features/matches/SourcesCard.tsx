import { ClipboardPaste } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';

/** Where recommendations come from: the pasted "Top job picks for you" page. */
export function SourcesCard({ onPaste }: { onPaste: () => void }) {
  return (
    <Card accent="sky" className="h-full">
      <CardHeader title="Source" description="The same jobs LinkedIn picks for you on your home page" />
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <ClipboardPaste className="size-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-slate-900">Paste “Top job picks for you”</p>
            <p className="text-xs text-slate-500">Copy the LinkedIn page and paste it. Jobs you already have are skipped.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onPaste}>
            Paste
          </Button>
        </div>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-slate-500">
          <li>Open linkedin.com/jobs and click “Show all” next to “Top job picks for you”.</li>
          <li>Select the whole page (Ctrl+A), copy (Ctrl+C) and paste it here.</li>
        </ol>
      </CardContent>
    </Card>
  );
}
