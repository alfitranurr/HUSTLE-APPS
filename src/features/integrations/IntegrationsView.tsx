'use client';

import { KeyRound, MessageSquareText, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Field, Input } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { useToast } from '@/components/ui/Toast';
import { errorMessage } from '@/lib/api';
import { formatDateTime, formatRelative } from '@/lib/format';
import type { ApiTokenInfo } from '@/lib/types';
import { CopyBlock } from './CopyBlock';
import { claudeCodeCommand, createToken, desktopConfig, revokeToken, useTokens } from './integrationsApi';

/*
 * Copy is written for people who have never heard of MCP or API tokens:
 * "access key" instead of token, "turn off" instead of revoke, and the
 * technical name appears once, explained.
 */

const MAX_ACTIVE = 5;

const STEPS = [
  { title: 'Create an access key', text: 'A private key that lets your AI assistant into your Hustle account, and only yours.' },
  { title: 'Paste the setup into your AI app', text: 'Hustle gives you ready-made setup text for Claude Code, Claude Desktop or Cursor. Copy, paste, done.' },
  { title: 'Ask in plain words', text: '“I just applied to Acme as Data Analyst on LinkedIn. Add it to Hustle with this screenshot.”' },
];

export function IntegrationsView() {
  const toast = useToast();
  const { tokens, isLoading, mutate } = useTokens();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ token: string; info: ApiTokenInfo } | null>(null);
  const [revoking, setRevoking] = useState<ApiTokenInfo | null>(null);
  const [busy, setBusy] = useState(false);

  const active = tokens.filter((t) => !t.revokedAt);
  const revoked = tokens.filter((t) => t.revokedAt);

  const generate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const result = await createToken(name.trim());
      setCreated(result);
      setCreating(false);
      setName('');
      await mutate();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const revoke = async () => {
    if (!revoking) return;
    setBusy(true);
    try {
      await revokeToken(revoking.id);
      toast.success(`"${revoking.name}" is turned off. Anything using it stops working now.`);
      await mutate();
      setRevoking(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const baseUrl = typeof window === 'undefined' ? '' : window.location.origin;
  const createButton = (
    <Button icon={<Plus className="size-4" />} disabled={active.length >= MAX_ACTIVE} onClick={() => setCreating(true)}>
      Create access key
    </Button>
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connect an AI assistant"
        description="Let an AI assistant such as Claude add and update your applications when you ask it in chat. No forms to fill in."
        actions={createButton}
      />

      <Card accent="teal">
        <CardHeader title="How it works" description="Takes about two minutes, once per computer." />
        <CardContent>
          <ol className="grid gap-4 md:grid-cols-3">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3 rounded-xl border border-teal-100 bg-teal-50/40 p-4">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-teal-600 text-sm font-bold text-white shadow-sm">
                  {i + 1}
                </span>
                <span className="text-sm">
                  <span className="mb-1 block font-semibold text-slate-900">{step.title}</span>
                  <span className="text-slate-600">{step.text}</span>
                </span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card accent="indigo" className="lg:col-span-2">
          <CardHeader
            title="Your access keys"
            description={`${active.length} of ${MAX_ACTIVE} in use. Make one per computer or app, so you can turn one off without affecting the others.`}
          />
          {isLoading ? (
            <SkeletonRows rows={3} className="px-5 pb-5" />
          ) : tokens.length === 0 ? (
            <EmptyState
              icon={<KeyRound className="size-5" />}
              title="No access keys yet"
              description="Create one to get the setup text for your AI app."
              action={createButton}
              className="m-5 mt-0"
            />
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {[...active, ...revoked].map((token) => (
                <li key={token.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                  <KeyRound className={token.revokedAt ? 'size-4 text-slate-300' : 'size-4 text-teal-600'} />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                      {token.name}
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-medium text-slate-600">{token.prefix}…</code>
                      {token.revokedAt && <Badge tone="rose">{token.revokedByAdmin ? 'Turned off by admin' : 'Turned off'}</Badge>}
                    </p>
                    <p className="text-xs text-slate-500">
                      Created {formatDateTime(token.createdAt)} ·{' '}
                      {token.lastUsedAt ? `last used ${formatRelative(token.lastUsedAt)}` : 'not used yet'}
                      {token.revokedAt && ` · turned off ${formatRelative(token.revokedAt)}`}
                    </p>
                  </div>
                  {!token.revokedAt && (
                    <IconButton
                      label={`Turn off ${token.name}`}
                      icon={<Trash2 className="size-4" />}
                      className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                      onClick={() => setRevoking(token)}
                    />
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card accent="violet">
          <CardHeader title="What your AI assistant can do" icon={<ShieldCheck className="size-5 text-violet-600" />} />
          <CardContent className="space-y-3 text-sm text-slate-600">
            <ul className="list-disc space-y-1 pl-5">
              <li>See your list of applications</li>
              <li>Add a new application, with proof files</li>
              <li>Move an application to the next stage</li>
            </ul>
            <p>
              It <strong className="text-slate-900">can&apos;t</strong> delete anything, change your settings, see your
              interview prep, or make new keys. It only ever sees your own data.
            </p>
            <p className="text-xs text-slate-500">
              Keep the key private, like a password. If you think someone else has it, turn it off here and it stops
              working straight away.
            </p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-slate-500">
        Technical name: this uses <strong className="font-medium text-slate-600">MCP</strong> (Model Context Protocol), the
        standard way AI apps connect to other tools. Any app that supports MCP will work.
      </p>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Create an access key"
        size="sm"
        dismissible={!saving}
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreating(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" form="token-form" loading={saving} disabled={!name.trim()}>
              Create
            </Button>
          </>
        }
      >
        <form id="token-form" onSubmit={generate}>
          <Field label="Give it a name" hint="So you know where it's used, e.g. “My laptop” or “Claude Desktop”.">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} data-autofocus />
          </Field>
        </form>
      </Modal>

      <Modal
        open={created !== null}
        onClose={() => setCreated(null)}
        title="Your access key is ready"
        description="Copy the setup for your AI app now. The key is shown only this once, for your safety."
        size="md"
        accent="teal"
        footer={<Button onClick={() => setCreated(null)}>Done, I&apos;ve copied it</Button>}
      >
        {created && (
          <div className="space-y-5">
            <div className="flex items-start gap-2 rounded-lg bg-teal-50 p-3 text-sm text-teal-900">
              <MessageSquareText className="mt-0.5 size-4 shrink-0 text-teal-600" />
              <span>
                Pick the app you use and copy its setup. Your key and this site&apos;s address are already filled in. Your
                computer needs <strong>Node.js</strong> (free, from nodejs.org).
              </span>
            </div>
            <CopyBlock label="Claude Code: paste into your terminal" value={claudeCodeCommand(baseUrl, created.token)} />
            <CopyBlock
              label="Claude Desktop or Cursor: paste into the app's MCP settings file"
              value={desktopConfig(baseUrl, created.token)}
            />
            <CopyBlock label="Just the key (for other apps)" value={created.token} />
            <p className="text-xs text-slate-500">
              Windows and Claude Desktop won&apos;t start it? Change <code>&quot;command&quot;: &quot;npx&quot;</code> to{' '}
              <code>&quot;command&quot;: &quot;cmd&quot;</code> and put <code>&quot;/c&quot;, &quot;npx&quot;</code> at the
              start of <code>&quot;args&quot;</code>.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={revoking !== null}
        title="Turn off this access key?"
        description={`Your AI assistant will stop working wherever "${revoking?.name ?? ''}" is used. You can't turn it back on, but you can create a new key anytime.`}
        confirmLabel="Turn off"
        loading={busy}
        onConfirm={() => void revoke()}
        onCancel={() => setRevoking(null)}
      />
    </div>
  );
}
