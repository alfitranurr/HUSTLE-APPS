import { ClipboardPaste, Mail, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { formatRelative } from '@/lib/format';

interface SourcesCardProps {
  lastSync: string;
  syncing: boolean;
  /** The last sync said Gmail access isn't set up yet. */
  needsSetup: boolean;
  onSync: () => void;
  onPaste: () => void;
}

/** Where recommendations come from: LinkedIn's recommendation emails in Gmail, or a pasted page. */
export function SourcesCard({ lastSync, syncing, needsSetup, onSync, onPaste }: SourcesCardProps) {
  return (
    <Card accent="sky" className="h-full">
      <CardHeader title="Sources" description="The same jobs LinkedIn picks for you on your home page" />
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-sky-50 text-sky-600">
            <Mail className="size-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-slate-900">Gmail · LinkedIn recommendation emails</p>
            <p className="text-xs text-slate-500">
              {needsSetup ? 'Not connected yet' : lastSync ? `Last synced ${formatRelative(lastSync)}` : 'Not synced yet'} · read-only
            </p>
          </div>
          <Button size="sm" variant="secondary" icon={<RefreshCw className="size-3.5" />} loading={syncing} onClick={onSync}>
            Sync
          </Button>
        </div>

        {needsSetup && (
          <div className="rounded-lg border-l-4 border-amber-400 bg-amber-50 px-3 py-2.5 text-xs text-amber-900">
            <p className="mb-1 font-semibold">One-time setup</p>
            <ol className="list-decimal space-y-0.5 pl-4">
              <li>LinkedIn → Settings → Notifications → Searching for a job → Job recommendations: turn Email on.</li>
              <li>Google Cloud Console: enable the Gmail API and add the gmail.readonly scope to the OAuth consent screen (status: In production).</li>
              <li>
                Run <code className="rounded bg-amber-100 px-1">node scripts/google-oauth-token.mjs</code>, then put the new GOOGLE_REFRESH_TOKEN in Vercel.
              </li>
            </ol>
          </div>
        )}

        <div className="flex items-start gap-3">
          <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-violet-50 text-violet-600">
            <ClipboardPaste className="size-4" />
          </span>
          <div className="min-w-0 flex-1 text-sm">
            <p className="font-medium text-slate-900">Paste “Top job picks for you”</p>
            <p className="text-xs text-slate-500">Copy the LinkedIn page and paste it; works without Gmail.</p>
          </div>
          <Button size="sm" variant="secondary" onClick={onPaste}>
            Paste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
